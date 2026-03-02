/**
 * WooCommerce CSV → MongoDB Import Script
 *
 * Parses a WooCommerce product export CSV and imports products
 * with proper variationTypes and variants into the database.
 *
 * Usage: node scripts/importWooCommerceCSV.js [path-to-csv]
 * Default CSV: wc-product-export-2-3-2026-1772449234404.csv
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================
// CONFIG
// ============================================
const CSV_PATH = process.argv[2] || path.join(__dirname, '..', 'wc-product-export-2-3-2026-1772449234404.csv');
const DEFAULT_STOCK = 100; // Stock for variants when CSV has no stock value

// ============================================
// MONGOOSE SCHEMAS (inline to avoid Next.js import issues)
// ============================================
const VariationTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    options: [{ type: String, trim: true }]
}, { _id: false });

const VariantSchema = new mongoose.Schema({
    attributes: { type: Map, of: String, required: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, default: '' }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    images: [{ type: String }],
    description: { type: String, trim: true, maxlength: 10000, default: '' },
    long_description: { type: String, trim: true, maxlength: 100000, default: '' },
    variationTypes: { type: [VariationTypeSchema], default: [] },
    variants: { type: [VariantSchema], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================
// HELPERS
// ============================================

/** Strip HTML tags and decode common entities */
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Parse comma-separated image URLs */
function parseImages(imagesStr) {
    if (!imagesStr) return [];
    return imagesStr.split(',').map(url => url.trim()).filter(Boolean);
}

/** Parse comma-separated attribute options */
function parseOptions(optionsStr) {
    if (!optionsStr) return [];
    return optionsStr.split(',').map(opt => opt.trim()).filter(Boolean);
}

// ============================================
// MAIN IMPORT
// ============================================
async function importProducts() {
    const MONGODB_URI = process.env.MONGODB_URI + '/' + (process.env.NEXT_PUBLIC_SITE_NAME || 'arclay').toLowerCase();

    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI not set in .env');
        process.exit(1);
    }

    // Read & parse CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`Error: CSV file not found at ${CSV_PATH}`);
        process.exit(1);
    }

    console.log(`Reading CSV from: ${CSV_PATH}`);
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true, // handle BOM
        relax_quotes: true,
        relax_column_count: true
    });

    console.log(`Parsed ${rows.length} rows from CSV\n`);

    // Separate variable (parent) and variation (child) rows
    const parentRows = rows.filter(r => r.Type === 'variable');
    const variationRows = rows.filter(r => r.Type === 'variation');

    console.log(`Found ${parentRows.length} parent products and ${variationRows.length} variations\n`);

    // Group variations by their parent SKU
    const variationsByParent = {};
    for (const v of variationRows) {
        const parentSku = v.Parent;
        if (!parentSku) continue;
        if (!variationsByParent[parentSku]) variationsByParent[parentSku] = [];
        variationsByParent[parentSku].push(v);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected\n');

    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

    // Clear existing products (optional - comment out if you want to keep existing data)
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Existing products cleared\n');

    // Category cache
    const categoryCache = {};

    async function getOrCreateCategory(name) {
        const trimmed = name.trim();
        const key = trimmed.toLowerCase();
        if (categoryCache[key]) return categoryCache[key];

        let cat = await Category.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
        if (!cat) {
            cat = await Category.create({ name: trimmed });
            console.log(`  Created category: "${trimmed}"`);
        }
        categoryCache[key] = cat._id;
        return cat._id;
    }

    // Results tracking
    const results = { created: 0, skipped: 0, errors: [] };

    // Process each parent product
    for (const parent of parentRows) {
        const productName = parent.Name;
        const parentSku = parent.SKU;

        try {
            // --- Category ---
            const categoryName = parent.Categories || process.env.NEXT_PUBLIC_SITE_NAME || 'General';
            const categoryId = await getOrCreateCategory(categoryName);

            // --- Images (from parent row) ---
            const images = parseImages(parent.Images);

            // --- Description ---
            const shortDesc = stripHtml(parent['Short description']).replaceAll('\n', '<br/>').replaceAll('\\n', '\n');
            const longDesc = (parent.Description || '').replaceAll('\n', '<br/>').replaceAll('\\n', '<br/>');

            // --- Flags ---
            const isActive = parent.Published === '1';
            const isFeatured = parent['Is featured?'] === '1';

            // --- Attribute / VariationTypes ---
            const attrName = parent['Attribute 1 name'] || '';
            const attrOptions = parseOptions(parent['Attribute 1 value(s)']);

            const variationTypes = [];
            if (attrName && attrOptions.length > 0) {
                variationTypes.push({ name: attrName, options: attrOptions });
            }

            // --- Variants (from child variation rows) ---
            const childRows = variationsByParent[parentSku] || [];
            const variants = [];

            if (childRows.length > 0) {
                for (const child of childRows) {
                    const regularPrice = parseFloat(child['Regular price']) || 0;
                    const salePriceRaw = child['Sale price'];
                    const salePrice = salePriceRaw ? parseFloat(salePriceRaw) : null;
                    const stock = child.Stock ? parseInt(child.Stock) : DEFAULT_STOCK;
                    const sku = child.SKU || '';

                    // Build attributes map from attribute columns
                    const attributes = {};
                    const childAttrName = child['Attribute 1 name'] || attrName;
                    const childAttrValue = child['Attribute 1 value(s)'] || '';

                    if (childAttrName && childAttrValue) {
                        attributes[childAttrName] = childAttrValue;
                    } else {
                        attributes['Default'] = 'Default';
                    }

                    variants.push({
                        attributes: new Map(Object.entries(attributes)),
                        regularPrice,
                        salePrice: (salePrice && salePrice > 0) ? salePrice : null,
                        stock,
                        sku
                    });
                }
            } else {
                // No variations found — create a single default variant
                const regularPrice = parseFloat(parent['Regular price']) || 0;
                const salePriceRaw = parent['Sale price'];
                const salePrice = salePriceRaw ? parseFloat(salePriceRaw) : null;
                const stock = parent.Stock ? parseInt(parent.Stock) : DEFAULT_STOCK;

                variants.push({
                    attributes: new Map([['Default', 'Default']]),
                    regularPrice,
                    salePrice: (salePrice && salePrice > 0) ? salePrice : null,
                    stock,
                    sku: parentSku || ''
                });
            }

            // --- Create Product ---
            await Product.create({
                name: productName,
                images,
                description: shortDesc,
                long_description: longDesc,
                variationTypes,
                variants,
                category: categoryId,
                isActive,
                isFeatured
            });

            results.created++;
            console.log(`  [${results.created}] Created: ${productName} (${variants.length} variants)`);

        } catch (error) {
            results.errors.push({ product: productName, error: error.message });
            console.error(`  ERROR creating "${productName}": ${error.message}`);
        }
    }

    // Summary
    console.log('\n========================================');
    console.log('IMPORT COMPLETE');
    console.log('========================================');
    console.log(`Products created: ${results.created}`);
    console.log(`Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
        console.log('\nError details:');
        results.errors.forEach(e => console.log(`  - ${e.product}: ${e.error}`));
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
}

importProducts();