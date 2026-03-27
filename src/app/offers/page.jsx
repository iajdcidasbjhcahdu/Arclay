"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Check, Tag, Gift, Sparkles } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import { toast } from "react-toastify";

export default function OffersPage() {
    const [trending, setTrending] = useState([]);
    const [copiedCode, setCopiedCode] = useState("");

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch("/api/products?limit=4&sort=newest");
                const data = await res.json();
                if (data.success) setTrending(data.products);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchTrending();
    }, []);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`Copied: ${code}`);
        setTimeout(() => setCopiedCode(""), 3000);
    };

    const coupons = [
        {
            code: "GOURMET15",
            title: "Flat 15% Off",
            description: "On all orders above ₹1,000. Valid on pickles, preserves & snacks.",
            color: "bg-[#F0F4EC]",
            borderColor: "border-[#869661]",
            tagColor: "text-[#647345]",
            icon: Tag
        },
        {
            code: "FREESHIP",
            title: "Free Shipping",
            description: "Free express delivery on all orders above ₹500 nationwide.",
            color: "bg-[#FFF5F0]",
            borderColor: "border-[#D86B4B]",
            tagColor: "text-[#D86B4B]",
            icon: Gift
        },
        {
            code: "FESTIVE30",
            title: "Festive 30% Off",
            description: "Special festive discount on gift hampers and combo packs.",
            color: "bg-[#FDF8EF]",
            borderColor: "border-[#C4A642]",
            tagColor: "text-[#8B7A2E]",
            icon: Sparkles
        },
    ];

    return (
        <main className="min-h-screen bg-[#FEFBF6]">
            {/* Hero */}
            <section className="relative h-[50vh] lg:h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-[#2A2F25] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2853&auto=format&fit=crop"
                    alt="Festive Offers"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
                />
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block bg-[#D86B4B] text-white text-xs font-semibold px-5 py-2 rounded-full mb-6">
                            🎉 Limited Time Offers
                        </span>
                        <h1 className="font-serif text-[44px] lg:text-6xl text-white font-bold mb-4 leading-tight">
                            Festive Season Sale
                        </h1>
                        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
                            Celebrate with exclusive discounts on artisanal pickles, preserves & gift hampers.
                        </p>
                        <Link href="/products" className="inline-flex items-center bg-[#869661] hover:bg-[#71824F] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors">
                            Shop the Sale
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Coupons Section */}
            <section className="py-16 lg:py-24">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-[32px] font-bold text-[#2A2F25] mb-3">Exclusive Coupon Codes</h2>
                        <p className="text-[#767B71] text-[15px] max-w-lg mx-auto">
                            Click to copy any code and apply at checkout for instant savings.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {coupons.map((coupon) => (
                            <motion.div
                                key={coupon.code}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`${coupon.color} border-2 ${coupon.borderColor} border-dashed rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer group`}
                                onClick={() => handleCopy(coupon.code)}
                            >
                                <coupon.icon className={`w-8 h-8 ${coupon.tagColor} mx-auto mb-4`} strokeWidth={1.5} />
                                <h3 className="font-serif text-xl font-bold text-[#2A2F25] mb-2">{coupon.title}</h3>
                                <p className="text-[#767B71] text-sm mb-5 leading-relaxed">{coupon.description}</p>
                                <div className={`inline-flex items-center gap-2 bg-white border border-[#ECE8E0] px-5 py-2.5 rounded-xl font-mono font-bold text-sm tracking-wider ${coupon.tagColor} group-hover:shadow-md transition-all`}>
                                    {coupon.code}
                                    {copiedCode === coupon.code
                                        ? <Check className="w-4 h-4 text-green-600" />
                                        : <Copy className="w-4 h-4 opacity-40" />
                                    }
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trending Products */}
            {trending.length > 0 && (
                <section className="py-16 lg:py-20 bg-white border-t border-[#ECE8E0]">
                    <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="text-[#D86B4B] text-sm font-medium mb-1 block">Editor&apos;s Picks</span>
                                <h2 className="font-serif text-[28px] font-bold text-[#2A2F25]">Trending This Season</h2>
                            </div>
                            <Link href="/products" className="hidden sm:inline-flex items-center text-sm font-medium text-[#2A2F25] hover:text-[#647345] transition-colors">
                                View All →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {trending.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Newsletter */}
            <section className="py-16 bg-[#2A2F25]">
                <div className="container mx-auto px-6 text-center max-w-2xl">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Never Miss a Deal</h2>
                    <p className="text-white/60 text-sm mb-8">Subscribe for early access to exclusive offers and new launches.</p>
                    <form className="flex flex-col sm:flex-row gap-3 justify-center" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="bg-white/10 border border-white/20 px-6 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors w-full sm:w-80 rounded-xl text-sm"
                        />
                        <button className="bg-[#869661] hover:bg-[#71824F] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
