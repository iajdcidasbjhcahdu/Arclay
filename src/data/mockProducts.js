export const MOCK_CATEGORIES = [
    { _id: 'pickles', name: 'Pickles', productCount: 45, image: 'https://images.unsplash.com/photo-1589135303405-86687a4087e6?q=80&w=800' },
    { _id: 'snacks', name: 'Snacks', productCount: 24, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800' },
    { _id: 'combos', name: 'Combos', productCount: 12, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800' },
    { _id: 'gift-boxes', name: 'Gift Boxes', productCount: 8, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800' },
    { _id: 'festive', name: 'Festive', productCount: 15, image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800' }
];

export const MOCK_PRODUCTS = [
    {
        _id: "mock-1",
        name: "Royal Mango Pickle (Aam Achar)",
        subtitle: "Aged in Ceramic Barnis with Cold-Pressed Oil",
        description: "A heritage recipe passed down through generations. Sliced green mangoes sun-dried for 14 days and marinated in cold-pressed mustard oil with a blend of 12 hand-ground spices.",
        long_description: "Our Royal Mango Pickle is the crown jewel of our collection. We use only 'Ramkela' mangoes, known for their firm texture and tangy profile. Each batch is aged in traditional ceramic jars (Barnis) to allow the flavors to develop naturally without any artificial preservatives.",
        images: [
            "https://images.unsplash.com/photo-1589135303405-86687a4087e6?q=80&w=800", 
            "https://images.unsplash.com/photo-1589135303310-86b24032d1f9?q=80&w=800",
            "https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?q=80&w=800",
            "https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?q=80&w=800"
        ],
        avgRating: 4.8,
        reviewCount: 156,
        isFeatured: true,
        isActive: true,
        spiceLevel: 3,
        category: { _id: "pickles", name: "Pickles" },
        ingredients: "Green Mango, Mustard Oil, Fenugreek, Fennel, Nigella Seeds, Turmeric, Red Chili, Salt, Asafoetida.",
        variationTypes: [
            { name: "Weight", options: ["250g", "500g", "1kg", "5kg"] },
            { name: "Intensity", options: ["Light", "Medium", "Heavy"] }
        ],
        variants: [
            { _id: "v1-1", regularPrice: 350, salePrice: 299, stock: 50, attributes: { Weight: "500g", Intensity: "Medium" } },
            { _id: "v1-2", regularPrice: 200, salePrice: 175, stock: 30, attributes: { Weight: "250g", Intensity: "Medium" } },
            { _id: "v1-3", regularPrice: 650, salePrice: 599, stock: 15, attributes: { Weight: "1kg", Intensity: "Heavy" } },
            { _id: "v1-4", regularPrice: 2800, salePrice: 2499, stock: 5, attributes: { Weight: "5kg", Intensity: "Light" } }
        ]
    },
    {
        _id: "mock-2",
        name: "Zesty Lime Pickle (Khatta Meetha)",
        subtitle: "Oil-Free Digestive Delight with Sun-Cured Lemons",
        description: "A perfect balance of sweet, sour, and spicy. Thin-skinned lemons cured in rock salt and jaggery.",
        long_description: "This oil-free pickle is a digestive delight. The lemons are cured in the sun until the skin becomes soft and translucent. We use organic jaggery to provide a subtle sweetness that complements the citrus tang.",
        images: ["https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800"],
        avgRating: 4.7,
        reviewCount: 92,
        isFeatured: false,
        isActive: true,
        spiceLevel: 2,
        category: { _id: "pickles", name: "Pickles" },
        ingredients: "Lemon, Jaggery, Rock Salt, Black Salt, Cumin, Carom Seeds, Black Pepper.",
        variationTypes: [
            { name: "Weight", options: ["400g", "800g"] }
        ],
        variants: [
            { _id: "v2-1", regularPrice: 280, salePrice: null, stock: 30, attributes: { Weight: "400g" } },
            { _id: "v2-2", regularPrice: 520, salePrice: 480, stock: 15, attributes: { Weight: "800g" } }
        ]
    },
    {
        _id: "mock-3",
        name: "Fiery Green Chili Pickle",
        subtitle: "Extra Hot Hand-Cut Chilies for the Bold",
        description: "Bold, pungent, and intensely flavorful. For those who love an extra kick in their meals.",
        images: [
            "https://images.unsplash.com/photo-1582515073490-39981397c445?q=80&w=800",
            "https://images.unsplash.com/photo-1589135303310-86b24032d1f9?q=80&w=800",
            "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800"
        ],
        avgRating: 4.9,
        reviewCount: 45,
        isFeatured: true,
        isActive: true,
        spiceLevel: 5,
        category: { _id: "pickles", name: "Pickles" },
        variationTypes: [
            { name: "Weight", options: ["250g", "500g"] }
        ],
        variants: [
            { _id: "v3-1", regularPrice: 250, salePrice: 199, stock: 20, attributes: { Weight: "250g" } },
            { _id: "v3-2", regularPrice: 480, salePrice: 420, stock: 10, attributes: { Weight: "500g" } }
        ]
    },
    {
        _id: "mock-4",
        name: "Handcrafted Peri Peri Makhana",
        subtitle: "Signature Spices with Slow-Roasted Lotus Seeds",
        description: "Slow-roasted lotus seeds tossed in a signature peri-peri spice blend for a guilt-free crunch.",
        images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800"],
        avgRating: 4.6,
        reviewCount: 210,
        isFeatured: false,
        isActive: true,
        spiceLevel: 3,
        category: { _id: "snacks", name: "Snacks" },
        variationTypes: [
            { name: "Weight", options: ["100g", "250g", "500g"] }
        ],
        variants: [
            { _id: "v4-1", regularPrice: 180, salePrice: 149, stock: 100, attributes: { Weight: "100g" } },
            { _id: "v4-2", regularPrice: 420, salePrice: 380, stock: 50, attributes: { Weight: "250g" } },
            { _id: "v4-3", regularPrice: 800, salePrice: 720, stock: 25, attributes: { Weight: "500g" } }
        ]
    },
    {
        _id: "mock-5",
        name: "Traditional Garlic Thokku",
        subtitle: "Aromatic South Indian Garlic Preserve",
        description: "A South Indian style garlic preserve. Rich, aromatic, and packed with flavor.",
        images: ["https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?q=80&w=800"],
        avgRating: 4.8,
        reviewCount: 38,
        isFeatured: true,
        isActive: true,
        spiceLevel: 4,
        category: { _id: "pickles", name: "Pickles" },
        variationTypes: [
            { name: "Weight", options: ["300g", "600g"] }
        ],
        variants: [
            { _id: "v5-1", regularPrice: 320, salePrice: null, stock: 15, attributes: { Weight: "300g" } },
            { _id: "v5-2", regularPrice: 600, salePrice: 550, stock: 10, attributes: { Weight: "600g" } }
        ]
    },
    {
        _id: "mock-6",
        name: "Assorted Heritage Combo",
        subtitle: "Curated Trio of Heritage Flavors",
        description: "A curated trio of our best-selling pickles: Mango, Lime, and Garlic.",
        images: ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800"],
        avgRating: 5.0,
        reviewCount: 15,
        isFeatured: true,
        isActive: true,
        category: { _id: "combos", name: "Combos" },
        variants: [{ _id: "v6", regularPrice: 850, salePrice: 749, stock: 10, attributes: { Weight: "3 x 250g" } }]
    },
    {
        _id: "mock-7",
        name: "Royal Festive Gift Box",
        subtitle: "Premium Packaging for Special Occasions",
        description: "An elegant gift box featuring our premium pickles and handcrafted snacks.",
        images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800"],
        avgRating: 4.9,
        reviewCount: 22,
        isFeatured: true,
        isActive: true,
        category: { _id: "gift-boxes", name: "Gift Boxes" },
        variants: [{ _id: "v7", regularPrice: 1500, salePrice: 1299, stock: 25, attributes: { Type: "Standard" } }]
    },
    {
        _id: "mock-8",
        name: "Sundried Tomato Pickle",
        subtitle: "Mediterranean Flair with Indian Spices",
        description: "Mediterranean inspiration meets Indian craftsmanship. Rich and savory.",
        images: ["https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?q=80&w=800"],
        avgRating: 4.5,
        reviewCount: 31,
        isFeatured: false,
        isActive: true,
        spiceLevel: 2,
        category: { _id: "pickles", name: "Pickles" },
        variationTypes: [
            { name: "Weight", options: ["300g", "600g"] }
        ],
        variants: [
            { _id: "v8-1", regularPrice: 420, salePrice: 380, stock: 12, attributes: { Weight: "300g" } },
            { _id: "v8-2", regularPrice: 800, salePrice: 720, stock: 8, attributes: { Weight: "600g" } }
        ]
    },
    {
        _id: "mock-9",
        name: "Crunchy Beetroot Chips",
        subtitle: "Vacuum-Fried Healthy Snacking Experience",
        description: "Vacuum-fried beetroot slices for a healthy and colorful snacking experience.",
        images: ["https://images.unsplash.com/photo-1628548484584-930bc472747d?q=80&w=800"],
        avgRating: 4.7,
        reviewCount: 64,
        isFeatured: true,
        isActive: true,
        category: { _id: "snacks", name: "Snacks" },
        variationTypes: [
            { name: "Weight", options: ["150g", "300g"] }
        ],
        variants: [
            { _id: "v9-1", regularPrice: 220, salePrice: null, stock: 80, attributes: { Weight: "150g" } },
            { _id: "v9-2", regularPrice: 400, salePrice: 360, stock: 40, attributes: { Weight: "300g" } }
        ]
    },
    {
        _id: "mock-10",
        name: "Hot & Sour Ginger Preserve",
        subtitle: "Immunity-Boosting Sharp Ginger Juliens",
        description: "Julienned ginger roots marinated in a sharp, spicy base. Excellent for immunity.",
        images: ["https://images.unsplash.com/photo-1615485500704-8e990f9900f7?q=80&w=800"],
        avgRating: 4.8,
        reviewCount: 29,
        isFeatured: false,
        isActive: true,
        spiceLevel: 4,
        category: { _id: "pickles", name: "Pickles" },
        variationTypes: [
            { name: "Weight", options: ["250g", "500g"] }
        ],
        variants: [
            { _id: "v10-1", regularPrice: 310, salePrice: null, stock: 40, attributes: { Weight: "250g" } },
            { _id: "v10-2", regularPrice: 580, salePrice: 520, stock: 20, attributes: { Weight: "500g" } }
        ]
    }
];

// Replicate for 20+ products
for (let i = 11; i <= 25; i++) {
    MOCK_PRODUCTS.push({
        ...MOCK_PRODUCTS[i % 5],
        _id: `mock-${i}`,
        name: `${MOCK_PRODUCTS[i % 5].name} - Batch ${String.fromCharCode(64 + i - 10)}`,
        isFeatured: i % 4 === 0
    });
}
