import { getSettings } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

export async function GET() {
    try {
        await connectDB();
        const settings = await getSettings();

        return Response.json({
            success: true,
            isEnabled: !!(settings.chatbot?.isEnabled && settings.gemini_ai?.isEnabled && settings.gemini_ai?.apiKey),
            welcomeMessage: settings.chatbot?.welcomeMessage || 'Hi! How can I help you today?',
        });
    } catch (error) {
        console.error("Chat config error:", error);
        return Response.json(
            { success: false, isEnabled: false },
            { status: 500 }
        );
    }
}
