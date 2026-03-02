import { getSettings } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { GoogleGenAI } from "@google/genai";

// Simple in-memory rate limiter: IP -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 1000; // 1 minute

// Clean up stale entries every 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap) {
        if (now > data.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 2 * 60 * 1000);

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

async function searchProducts(query) {
    if (!query || query.trim().length < 2) return [];

    const searchTerms = query.trim().split(/\s+/).filter(t => t.length >= 2);
    if (searchTerms.length === 0) return [];

    let products = [];

    // Strategy 1: MongoDB text search (uses index on name + description)
    try {
        products = await Product.find(
            {
                $text: { $search: query.trim() },
                isActive: true,
            },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(6)
            .select('name description images variants category')
            .populate('category', 'name')
            .lean();
    } catch {
        // Text search may fail if index not present; fall through to regex
    }

    // Strategy 2: Regex fallback (also covers long_description)
    if (products.length === 0) {
        const regexConditions = searchTerms.map(term => ({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } },
                { long_description: { $regex: term, $options: 'i' } },
            ]
        }));

        products = await Product.find({
            isActive: true,
            $and: regexConditions,
        })
            .limit(6)
            .select('name description images variants category')
            .populate('category', 'name')
            .lean();
    }

    return products.map(p => {
        const variant = p.variants?.[0];
        const price = variant?.salePrice || variant?.regularPrice || 0;
        const image = p.images?.[0] || '';

        return {
            id: p._id.toString(),
            name: p.name,
            description: (p.description || '').substring(0, 120),
            price,
            image,
            category: p.category?.name || '',
        };
    });
}

export async function POST(req) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown';

        if (!checkRateLimit(ip)) {
            return Response.json(
                { success: false, message: 'Too many requests. Please wait a moment.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        let { message, history } = body;

        if (!message || typeof message !== 'string') {
            return Response.json(
                { success: false, message: 'Message is required' },
                { status: 400 }
            );
        }

        message = message.trim().substring(0, 500);
        if (!message) {
            return Response.json(
                { success: false, message: 'Message is required' },
                { status: 400 }
            );
        }

        // Validate and limit history
        if (!Array.isArray(history)) history = [];
        history = history.slice(-10);

        await connectDB();
        const settings = await getSettings();

        if (!settings.chatbot?.isEnabled || !settings.gemini_ai?.isEnabled || !settings.gemini_ai?.apiKey) {
            return Response.json(
                { success: false, message: 'Chatbot is not available' },
                { status: 503 }
            );
        }

        // Search for relevant products based on the user's message
        const products = await searchProducts(message);

        // Build system instruction
        let systemInstruction = settings.chatbot?.systemPrompt || '';
        if (!systemInstruction) {
            systemInstruction = 'You are a helpful shopping assistant. Help customers find products and answer their questions.';
        }

        systemInstruction += '\n\nIMPORTANT RULES:\n';
        systemInstruction += '- Keep responses concise (2-3 sentences unless more detail is asked for).\n';
        systemInstruction += '- Be friendly and helpful.\n';
        systemInstruction += '- If you want to recommend a product from the list below, include its marker like [[product:PRODUCT_ID]] in your response. The system will automatically render it as a product card.\n';
        systemInstruction += '- Only recommend products that are relevant to the user\'s query.\n';
        systemInstruction += '- If no products match what the user is looking for, say so honestly.\n';

        if (products.length > 0) {
            systemInstruction += '\n\nAVAILABLE PRODUCTS (found based on user\'s query):\n';
            products.forEach(p => {
                systemInstruction += `- ID: ${p.id} | Name: ${p.name} | Price: ₹${p.price} | Category: ${p.category} | Description: ${p.description}\n`;
                systemInstruction += `  To recommend this product, use: [[product:${p.id}]]\n`;
            });
        }

        // Build conversation for Gemini
        const contents = [];

        for (const msg of history) {
            if (msg.role === 'user' || msg.role === 'model') {
                contents.push({
                    role: msg.role,
                    parts: [{ text: msg.text || '' }],
                });
            }
        }

        contents.push({
            role: 'user',
            parts: [{ text: message }],
        });

        // Call Gemini
        const ai = new GoogleGenAI({ apiKey: settings.gemini_ai.apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: {
                systemInstruction,
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        let reply = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

        // Parse [[product:ID]] markers from reply and match to searched products
        const productMarkerRegex = /\[\[product:([a-f0-9]+)\]\]/gi;
        const referencedIds = new Set();
        let match;
        while ((match = productMarkerRegex.exec(reply)) !== null) {
            referencedIds.add(match[1]);
        }

        // Remove markers from the displayed reply
        reply = reply.replace(/\[\[product:[a-f0-9]+\]\]/gi, '').trim();

        // Build the products to show
        let displayProducts = [];
        if (referencedIds.size > 0) {
            // Show only the products Gemini specifically referenced
            displayProducts = products.filter(p => referencedIds.has(p.id));
        } else if (products.length > 0) {
            // Gemini didn't use markers, but we found products — show them as suggestions
            displayProducts = products.slice(0, 4);
        }

        return Response.json({
            success: true,
            reply,
            products: displayProducts,
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return Response.json(
            { success: false, message: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
