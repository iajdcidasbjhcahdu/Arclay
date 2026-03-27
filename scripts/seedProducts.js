/**
 * Complete Seeder Script
 * 
 * Seeds the database with:
 * - Admin user (from config)
 * - Sample users
 * - Categories
 * - Products with long descriptions
 * - Reviews
 * - Bundles
 * - Product Ads
 * - Coupons
 * - Settings
 * - Addresses
 * - Orders (some with coupons)
 * 
 * Usage: node scripts/seedProducts.js
 * 
 * Make sure to set MONGODB_URI in your .env.local file
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================
// CONFIGURATION - Modify these values as needed
// ============================================
const CONFIG = {
    // Admin user credentials
    admin: {
        name: 'Super Admin',
        email: 'admin@gmail.com',
        password: 'Admin@123',
        phone: '+91 9999999999'
    },

    // Counts
    usersCount: 10,
    productsCount: 50,
    categoriesCount: 5,
    bundlesCount: 5,
    productAdsCount: 10,
    couponsCount: 8,
    ordersPerUserMax: 5,

    // Reviews per product (min, max)
    minReviewsPerProduct: 0,
    maxReviewsPerProduct: 10,

    // Min and max images per product
    minImagesPerProduct: 2,
    maxImagesPerProduct: 5,

    // Image dimensions for Picsum
    imageWidth: 800,
    imageHeight: 800,

    // Price range
    minPrice: 99,
    maxPrice: 9999,

    // Stock range per variant
    minStock: 0,
    maxStock: 100,

    // Sale price probability (0 to 1)
    salePriceProbability: 0.4,

    // Sale discount range (percentage)
    minSaleDiscount: 10,
    maxSaleDiscount: 50,

    // Featured product probability
    featuredProbability: 0.6,

    // Clear existing data before seeding
    clearExisting: true
};

// ============================================
// SAMPLE DATA
// ============================================
const CATEGORIES = [
    { name: 'Pickles', description: 'Traditional handcrafted pickles made with ancestral recipes' },
    { name: 'Snacks', description: 'Premium artisanal snacks and savory delights' },
    { name: 'Combos', description: 'Curated combinations of our best-selling products' },
    { name: 'Gift Boxes', description: 'Luxury hampers and gift sets for every occasion' },
    { name: 'Festive', description: 'Special seasonal offerings and celebration packs' }
];

const SAMPLE_USERS = [
    { name: 'Rahul Sharma', email: 'rahul.sharma@example.com' },
    { name: 'Priya Patel', email: 'priya.patel@example.com' },
    { name: 'Amit Kumar', email: 'amit.kumar@example.com' },
    { name: 'Sneha Reddy', email: 'sneha.reddy@example.com' },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com' },
    { name: 'Anita Gupta', email: 'anita.gupta@example.com' },
    { name: 'Rajesh Iyer', email: 'rajesh.iyer@example.com' },
    { name: 'Meera Nair', email: 'meera.nair@example.com' },
    { name: 'Sanjay Joshi', email: 'sanjay.joshi@example.com' },
    { name: 'Kavita Menon', email: 'kavita.menon@example.com' },
    { name: 'Arjun Das', email: 'arjun.das@example.com' },
    { name: 'Pooja Verma', email: 'pooja.verma@example.com' }
];

const COUPONS = [
    { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, description: '10% off on your first order' },
    { code: 'SAVE20', discountType: 'percentage', discountValue: 20, description: 'Save 20% on all items' },
    { code: 'FLAT500', discountType: 'fixed', discountValue: 500, minPurchase: 2000, description: 'Flat ₹500 off on orders above ₹2000' },
    { code: 'FREESHIP', discountType: 'fixed', discountValue: 0, description: 'Free shipping on all orders' }, // Handled as free shipping logic usually
    { code: 'SUMMER30', discountType: 'percentage', discountValue: 30, description: 'Summer sale special' },
    { code: 'BUY1GET1', discountType: 'buyXGetYFree', buyXGetYFree: { buyQty: 1, freeQty: 1 }, description: 'Buy 1 Get 1 Free on selected items' },
    { code: 'BULK5', discountType: 'tierPricing', quantityTiers: [{ minQty: 5, discountValue: 15 }], description: '15% off when you buy 5 or more items' }
];

const PRODUCT_ADS = [
    { title: 'Summer Collection', description: 'Check out our new summer arrivals', mediaUrl: 'https://picsum.photos/1200/400?random=101', position: 'hero' },
    { title: 'Flash Sale', description: 'Up to 50% off on electronics', mediaUrl: 'https://picsum.photos/1200/400?random=102', position: 'banner' },
    { title: 'New Gadgets', description: 'Upgrade your tech game', mediaUrl: 'https://picsum.photos/600/400?random=103', position: 'banner' }
];

const PRODUCT_TEMPLATES = {
    Pickles: [
        { name: 'Royal Mango Pickle', variations: [{ name: 'Weight', options: ['250g', '500g', '1kg'] }] },
        { name: 'Zesty Lime Pickle', variations: [{ name: 'Weight', options: ['250g', '500g', '1kg'] }] },
        { name: 'Fire Chili Pickle', variations: [{ name: 'Weight', options: ['250g', '500g', '1kg'] }] },
        { name: 'Garlic Reserve Pickle', variations: [{ name: 'Weight', options: ['250g', '500g'] }] },
        { name: 'Stuffed Red Chili Pickle', variations: [{ name: 'Weight', options: ['500g', '1kg'] }] },
        { name: 'Sweet & Spicy Lemon Pickle', variations: [{ name: 'Weight', options: ['250g', '500g', '1kg'] }] },
        { name: 'Ginger & Green Chili', variations: [{ name: 'Weight', options: ['250g', '500g'] }] },
        { name: 'Amla (Gooseberry) Pickle', variations: [{ name: 'Weight', options: ['250g', '500g', '1kg'] }] }
    ],
    Snacks: [
        { name: 'Artisanal Masala Makhana', variations: [{ name: 'Size', options: ['100g', '250g'] }] },
        { name: 'Roasted Cashews (Gold Edition)', variations: [{ name: 'Size', options: ['200g', '500g'] }] },
        { name: 'Premium Almonds (Smoked)', variations: [{ name: 'Size', options: ['200g', '500g'] }] },
        { name: 'Traditional Sev Mix', variations: [{ name: 'Size', options: ['250g', '500g'] }] },
        { name: 'Beetroot & Kale Chips', variations: [{ name: 'Size', options: ['50g', '150g'] }] },
        { name: 'Peri Peri Makhana', variations: [{ name: 'Size', options: ['100g', '250g'] }] }
    ],
    Combos: [
        { name: 'Heritage Duo (Mango & Lime)', variations: [{ name: 'Pack', options: ['Standard'] }] },
        { name: 'Spice Route Collection', variations: [{ name: 'Pack', options: ['Large'] }] },
        { name: 'Snack & Sip Combo', variations: [{ name: 'Pack', options: ['Regular'] }] },
        { name: 'The Pickle Lover Set', variations: [{ name: 'Pack', options: ['Triple Pack'] }] }
    ],
    'Gift Boxes': [
        { name: 'Gourmet Celebration Box', variations: [{ name: 'Box Type', options: ['Premium', 'Luxury'] }] },
        { name: 'The Artisanal Hamper', variations: [{ name: 'Box Type', options: ['Standard', 'Exquisite'] }] },
        { name: 'Royal Gifting Suite', variations: [{ name: 'Box Type', options: ['Grand'] }] },
        { name: 'Signature Mini Hamper', variations: [{ name: 'Box Type', options: ['Mini'] }] }
    ],
    Festive: [
        { name: 'Diwali Celebration Basket', variations: [{ name: 'Size', options: ['Regular', 'Family'] }] },
        { name: 'Holi Joy Platter', variations: [{ name: 'Size', options: ['Standard'] }] },
        { name: 'Rakhi Sweets & Savories', variations: [{ name: 'Size', options: ['Small', 'Medium'] }] },
        { name: 'Wedding Favors Box', variations: [{ name: 'Size', options: ['Custom'] }] }
    ]
};

const DESCRIPTIONS = [
    "Experience premium quality with this exceptional product designed for everyday use. Crafted with attention to detail and built to last.",
    "Upgrade your lifestyle with this must-have item. Features modern design and superior functionality for the discerning customer.",
    "Discover the perfect blend of style and practicality. This product delivers outstanding performance and unmatched value.",
    "Elevate your experience with this top-rated product. Engineered for excellence and designed with you in mind.",
    "A perfect choice for those who appreciate quality. This product combines innovation with reliability.",
    "Stand out from the crowd with this exceptional offering. Premium materials meet cutting-edge design.",
    "Your search for the perfect product ends here. Uncompromising quality meets affordable pricing.",
    "Transform your daily routine with this game-changing product. Built for performance, designed for life.",
    "Experience the difference that quality makes. This product is crafted to exceed your expectations.",
    "The ultimate solution for modern living. Combining functionality with aesthetics in perfect harmony."
];

const LONG_DESCRIPTIONS = [
    `## Product Overview
This premium product represents the pinnacle of quality and craftsmanship. Every aspect has been carefully considered to deliver an exceptional user experience.

### Key Features
- **Premium Materials**: Crafted using only the finest materials available
- **Durable Construction**: Built to withstand daily use for years to come
- **Modern Design**: Sleek aesthetics that complement any style
- **Easy Maintenance**: Simple care instructions for long-lasting beauty

### What's in the Box
- Main product unit
- User manual with detailed instructions
- Warranty card
- Accessories pack

### Care Instructions
Clean with a soft, damp cloth. Avoid harsh chemicals. Store in a cool, dry place when not in use.`,

    // ... (reused from before, kept concise here for file) ...
    `## Exceptional Quality, Unbeatable Value
Discover why thousands of customers have chosen this product. We've combined cutting-edge technology with timeless design principles.

### Technical Details
- Engineered for optimal performance
- Energy-efficient operation
- Low maintenance requirements

### User Experience
Our product is designed to be intuitive and user-friendly. Whether you're a first-time user or an experienced professional, you'll appreciate the thoughtful design choices we've made.`,

    `## The Perfect Choice for Discerning Customers
When only the best will do, this product delivers. We've spared no expense in creating something truly special.

### What Sets Us Apart
- **Attention to Detail**: Every component has been carefully selected
- **Quality Control**: Multiple inspection points ensure perfection
- **Customer Focus**: Designed based on real user feedback

### Ideal For
- Daily use in home or office
- Gift giving for special occasions
- Professional applications`
];

const REVIEW_COMMENTS = [
    "Absolutely love this product! Exceeded all my expectations.",
    "Great value for money. Works exactly as described.",
    "Good product overall. Minor issues with packaging but the item itself is perfect.",
    "Five stars! This is exactly what I was looking for.",
    "Very satisfied with this purchase. The product matches the description perfectly.",
    "Excellent quality! I've been using this for weeks now and it still performs like new.",
    "Amazing product at a reasonable price.",
    "Really impressed with the attention to detail.",
    "Perfect for my needs. Easy to use and the instructions were clear.",
    "Outstanding quality and fast delivery."
];

// ============================================
// MONGOOSE SCHEMAS (inline to avoid import issues)
// ============================================

// 1. Settings Schema
const SettingsSchema = new mongoose.Schema({
    isDemo: { type: Boolean, default: false },
    isMaintenance: { type: Boolean, default: false },
    payment: {
        razorpay: { keyId: { type: String, default: '' }, keySecret: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
        stripe: { publishableKey: { type: String, default: '' }, secretKey: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
        cod: { isEnabled: { type: Boolean, default: true } }
    },
    mail: { email: { type: String, default: '' }, password: { type: String, default: '' }, host: { type: String, default: '' }, port: { type: Number, default: 587 }, isSSL: { type: Boolean, default: false }, isEnabled: { type: Boolean, default: false } },
    gemini_ai: { apiKey: { type: String, default: '' }, isEnabled: { type: Boolean, default: false } },
    shipping: {
        shiprocket: { isEnabled: { type: Boolean, default: false }, email: { type: String, default: '' }, password: { type: String, default: '' } },
        warehouse: { name: { type: String, default: '' } },
        rateCalculation: { type: String, enum: ['realtime', 'flat', 'free_threshold'], default: 'free_threshold' },
        flatRate: { type: Number, default: 50 },
        freeShippingThreshold: { type: Number, default: 499 },
        defaultWeight: { type: Number, default: 0.5 }
    }
}, { timestamps: true });

// 2. Coupon Schema
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed', 'buyXForY', 'buyXGetYFree', 'tierPricing'], required: true },
    discountValue: { type: Number, default: 0 },

    buyXForY: { requiredQty: { type: Number, default: 0 }, flatPrice: { type: Number, default: 0 } },
    buyXGetYFree: { buyQty: { type: Number, default: 0 }, freeQty: { type: Number, default: 0 } },
    quantityTiers: [{ minQty: { type: Number, required: true }, maxQty: { type: Number, default: null }, discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }, discountValue: { type: Number, required: true } }],

    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    maxUsage: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    showToUser: { type: Boolean, default: false }
}, { timestamps: true });

// 3. Address Schema
const AddressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// 4. Order Schema
const OrderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { attributes: { type: Map, of: String }, price: { type: Number, required: true }, sku: String },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    totalAmount: { type: Number, required: true },
    subtotal: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 }
}, { timestamps: true });

// 5. ProductAd Schema
const ProductAdSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    linkUrl: { type: String, default: '' },
    position: { type: String, enum: ['hero', 'banner', 'popup'], default: 'banner' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 6. Bundle Schema
const BundleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    btnTxt: { type: String, default: 'View Bundle' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Other Schemas (Existing)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    image: { type: String, default: '' }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

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
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    long_description: { type: String, trim: true, maxlength: 10000, default: '' },
    variationTypes: { type: [VariationTypeSchema], default: [] },
    variants: { type: [VariantSchema], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    image: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomElement(array) { return array[Math.floor(Math.random() * array.length)]; }
function generatePicsumImageUrl(width, height, seed) { return `https://picsum.photos/seed/${seed}/${width}/${height}`; }

function generateImages(productIndex, imageIndex, count) {
    const images = [];
    for (let i = 0; i < count; i++) {
        const seed = `product-${productIndex}-${imageIndex}-${i}-${Date.now()}`;
        images.push(generatePicsumImageUrl(CONFIG.imageWidth, CONFIG.imageHeight, seed));
    }
    return images;
}

function generateSKU(productName, variantIndex) {
    const prefix = productName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${timestamp}-${variantIndex.toString().padStart(3, '0')}`;
}

function generateVariants(variationTypes, productName) {
    const variants = [];
    if (variationTypes.length === 0) {
        const regularPrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        const hasSale = Math.random() < CONFIG.salePriceProbability;
        const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
        const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

        variants.push({
            attributes: new Map([['Default', 'Standard']]),
            regularPrice,
            salePrice,
            stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
            sku: generateSKU(productName, 0)
        });
    } else if (variationTypes.length === 1) {
        const basePrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        variationTypes[0].options.forEach((option, index) => {
            const priceVariation = getRandomInt(-50, 100);
            const regularPrice = Math.max(CONFIG.minPrice, basePrice + priceVariation);
            const hasSale = Math.random() < CONFIG.salePriceProbability;
            const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
            const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

            variants.push({
                attributes: new Map([[variationTypes[0].name, option]]),
                regularPrice,
                salePrice,
                stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
                sku: generateSKU(productName, index)
            });
        });
    } else {
        const basePrice = getRandomInt(CONFIG.minPrice, CONFIG.maxPrice);
        let variantIndex = 0;
        const generateCombinations = (typeIndex, currentAttributes) => {
            if (typeIndex >= variationTypes.length) {
                const priceVariation = getRandomInt(-50, 150);
                const regularPrice = Math.max(CONFIG.minPrice, basePrice + priceVariation);
                const hasSale = Math.random() < CONFIG.salePriceProbability;
                const saleDiscount = getRandomInt(CONFIG.minSaleDiscount, CONFIG.maxSaleDiscount);
                const salePrice = hasSale ? Math.round(regularPrice * (1 - saleDiscount / 100)) : null;

                variants.push({
                    attributes: new Map(Object.entries(currentAttributes)),
                    regularPrice,
                    salePrice,
                    stock: getRandomInt(CONFIG.minStock, CONFIG.maxStock),
                    sku: generateSKU(productName, variantIndex++)
                });
                return;
            }
            const currentType = variationTypes[typeIndex];
            for (const option of currentType.options) {
                generateCombinations(typeIndex + 1, { ...currentAttributes, [currentType.name]: option });
            }
        };
        generateCombinations(0, {});
    }
    return variants;
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function seedDatabase() {
    let MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) { console.error('❌ Error: MONGODB_URI not set.'); process.exit(1); }

    // Ensure database name and options are added correctly
    const dbName = (process.env.NEXT_PUBLIC_SITE_NAME || 'arclay').toLowerCase();
    if (!MONGODB_URI.includes('.net/')) {
        MONGODB_URI = MONGODB_URI.replace('.net', `.net/${dbName}`);
    }
    if (!MONGODB_URI.includes('?')) {
        MONGODB_URI += '?retryWrites=true&w=majority';
    }

    console.log('🚀 Starting database seeding...\n');
    console.log('📋 Configuration:', CONFIG);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { bufferCommands: false });
        console.log('✅ Connected\n');

        // Models
        const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
        const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
        const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
        const Address = mongoose.models.Address || mongoose.model('Address', AddressSchema);
        const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
        const ProductAd = mongoose.models.ProductAd || mongoose.model('ProductAd', ProductAdSchema);
        const Bundle = mongoose.models.Bundle || mongoose.model('Bundle', BundleSchema);

        if (CONFIG.clearExisting) {
            console.log('🗑️  Clearing existing data...');
            await Promise.all([
                Category.deleteMany({}),
                Product.deleteMany({}), 
                User.deleteMany({}), 
                Review.deleteMany({}),
                // Settings.deleteMany({}), 
                Coupon.deleteMany({}), 
                Address.deleteMany({}), 
                Order.deleteMany({}),
                ProductAd.deleteMany({}), 
                Bundle.deleteMany({})
            ]);
            console.log('✅ Data cleared\n');
        }

        // 1. Settings
        console.log('⚙️  Creating settings...');
        // await Settings.create({
        //     isDemo: false,
        //     payment: { cod: { isEnabled: true }, razorpay: { isEnabled: true }, stripe: { isEnabled: false } },
        //     shipping: { freeShippingThreshold: 500, flatRate: 40, rateCalculation: 'free_threshold' }
        // });
        console.log('✅ Settings created\n');

        // 2. Users (Admin + Sample)
        console.log('� Creating users...');
        const users = [];
        const hashedAdminPwd = await hashPassword(CONFIG.admin.password);
        const admin = await User.create({
            name: CONFIG.admin.name, email: CONFIG.admin.email, phone: CONFIG.admin.phone,
            password: hashedAdminPwd, role: 'admin', isActive: true, isEmailVerified: true
        });

        // return;

        users.push(admin);

        for (const u of SAMPLE_USERS) {
            const pwd = await hashPassword('User@123');
            const user = await User.create({
                name: u.name, email: u.email, password: pwd, role: 'user', isActive: true, isEmailVerified: true
            });
            users.push(user);
        }
        console.log(`✅ Created ${users.length} users\n`);

        // 3. Addresses
        console.log('🏠 Creating addresses...');
        for (const user of users) {
            await Address.create({
                user: user._id, label: 'Home', fullName: user.name, phone: user.phone || '9876543210',
                addressLine1: '123, Sample Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true
            });
        }
        console.log('✅ Addresses created\n');

        // 4. Categories & Products
        console.log('📦 Creating categories & products...');
        const products = [];
        const categories = [];

        for (let i = 0; i < CONFIG.categoriesCount; i++) {
            const cData = CATEGORIES[i];
            const cat = await Category.create({
                name: cData.name, description: cData.description,
                image: generatePicsumImageUrl(400, 400, `cat-${i}`), isActive: true
            });
            categories.push(cat);
        }

        let productsCreated = 0;
        while (productsCreated < CONFIG.productsCount) {
            const category = getRandomElement(categories);
            const template = getRandomElement(PRODUCT_TEMPLATES[category.name] || Object.values(PRODUCT_TEMPLATES).flat());
            const variations = template.variations || [];

            const product = await Product.create({
                name: template.name,
                description: getRandomElement(DESCRIPTIONS),
                long_description: getRandomElement(LONG_DESCRIPTIONS),
                images: generateImages(productsCreated, Math.random(), 3),
                variationTypes: variations,
                variants: generateVariants(variations, template.name),
                category: category._id,
                isActive: true,
                isFeatured: Math.random() < CONFIG.featuredProbability
            });
            products.push(product);
            productsCreated++;
        }
        console.log(`✅ Created ${products.length} products\n`);

        // 5. Product Ads & Bundles
        console.log('📢 Creating ads & bundles...');
        await ProductAd.insertMany(PRODUCT_ADS);

        for (let i = 0; i < CONFIG.bundlesCount; i++) {
            const bundleProducts = [getRandomElement(products), getRandomElement(products)];
            await Bundle.create({
                title: `Super Saver Bundle ${i + 1}`,
                slug: `super-saver-bundle-${i + 1}`,
                products: bundleProducts.map(p => p._id),
                isActive: true
            });
        }
        console.log('✅ Ads & bundles created\n');

        // 6. Coupons
        console.log('🎟️  Creating coupons...');
        const coupons = await Coupon.insertMany(COUPONS);
        console.log(`✅ Created ${coupons.length} coupons\n`);

        // 7. Orders & Reviews
        console.log('🛒 Creating orders & reviews...');
        const regularUsers = users.filter(u => u.role !== 'admin');

        for (const user of regularUsers) {
            // Orders
            const orderCount = getRandomInt(0, CONFIG.ordersPerUserMax);
            for (let i = 0; i < orderCount; i++) {
                const orderItems = [];
                const itemCount = getRandomInt(1, 3);
                let subtotal = 0;

                for (let j = 0; j < itemCount; j++) {
                    const prod = getRandomElement(products);
                    const variant = prod.variants[0];
                    const price = variant.salePrice || variant.regularPrice;
                    orderItems.push({
                        product: prod._id,
                        variant: { attributes: variant.attributes, price, sku: variant.sku },
                        quantity: 1,
                        priceAtOrder: price
                    });
                    subtotal += price;
                }

                // Randomly apply coupon
                let coupon = null;
                let discountAmount = 0;
                if (Math.random() > 0.5) {
                    coupon = getRandomElement(coupons);
                    // Simplified discount logic
                    if (coupon.discountType === 'percentage') discountAmount = (subtotal * coupon.discountValue) / 100;
                    else if (coupon.discountType === 'fixed') discountAmount = coupon.discountValue;
                    if (discountAmount > subtotal) discountAmount = subtotal;
                }

                await Order.create({
                    user: user._id,
                    items: orderItems,
                    shippingAddress: { fullName: user.name, phone: '9999999999', addressLine1: 'Main St', city: 'City', state: 'State', pincode: '123456' },
                    paymentMethod: 'razorpay',
                    paymentStatus: 'completed',
                    orderStatus: 'delivered',
                    subtotal,
                    totalAmount: subtotal - discountAmount + 40,
                    coupon: coupon?._id,
                    couponCode: coupon?.code,
                    discountAmount,
                    shippingFee: 40
                });
            }

            // Reviews
            for (let k = 0; k < 2; k++) {
                const prod = getRandomElement(products);
                try {
                    await Review.create({
                        stars: getRandomInt(4, 5), comment: getRandomElement(REVIEW_COMMENTS),
                        user: user._id, product: prod._id, isActive: true
                    });
                } catch (e) { }
            }
        }
        console.log('✅ Orders & reviews created\n');

        console.log('🎉 Database seeding COMPLETED!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();
