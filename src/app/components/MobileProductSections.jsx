"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, Sparkles, Star, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { getSiteName } from "@/config/brandContent";
import ProductCard from "./ProductCard";

const siteName = getSiteName();
const isSanatva = siteName.toLowerCase().includes("sanatva");

function CategoryPills() {
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState("all");
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/products?limit=1");
                const data = await res.json();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch {}
        };
        fetchCategories();
    }, []);

    return (
        <div className="px-4 py-5 bg-[#fdfbf7] dark:bg-background">
            <div
                ref={scrollRef}
                className="flex gap-2.5 overflow-x-auto no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
            >
                <Link
                    href="/products"
                    className={`shrink-0 px-5 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                        active === "all"
                            ? "bg-[#6b7b5c] text-white shadow-sm"
                            : "bg-[#fcf6eb] dark:bg-secondary/60 text-[#4a553c] dark:text-foreground hover:bg-[#f3eedd] dark:hover:bg-secondary"
                    }`}
                    onClick={() => setActive("all")}
                >
                    All Products
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat._id}
                        href={`/products?category=${cat._id}`}
                        className={`shrink-0 px-5 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                            active === cat._id
                                ? "bg-[#6b7b5c] text-white shadow-sm"
                                : "bg-[#fcf6eb] dark:bg-secondary/60 text-[#4a553c] dark:text-foreground hover:bg-[#f3eedd] dark:hover:bg-secondary"
                        }`}
                        onClick={() => setActive(cat._id)}
                    >
                        {cat.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function Section({ title, viewAllLink, children, icon: Icon }) {
    return (
        <section className="py-2 px-4 mb-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-[#e25d43]" />}
                    <h2 className="text-[22px] font-serif font-bold text-[#2d2d2d] dark:text-foreground tracking-tight">{title}</h2>
                </div>
                <Link href={viewAllLink || "/products"} className="flex items-center gap-0.5 text-[13px] text-muted-foreground font-medium hover:text-[#2d2d2d] transition-colors">
                    See All
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            {children}
        </section>
    );
}

function SimpleProductCard({ product }) {
    const variant = product.variants?.[0];
    const price = variant?.salePrice || variant?.regularPrice || 0;
    const router = useRouter();
    return (
        <div onClick={() => router.push(`/products/${product._id}`)} className="cursor-pointer flex flex-col gap-2.5 group">
            <div className="aspect-[1.05/1] rounded-[22px] overflow-hidden bg-[#f4f1ea] shadow-sm transform transition-transform group-hover:scale-[1.02]">
                <img src={product.images?.[0] || "/placeholder-product.jpg"} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="px-1">
                <h3 className="font-serif text-[15px] font-medium text-foreground line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-[#f0a500] text-[#f0a500]" />
                    <span className="text-[12px] font-medium text-foreground">{product.avgRating || '4.8'}</span>
                </div>
                <div className="mt-1">
                    <span className="text-[16px] font-extrabold text-[#2d2d2d] dark:text-foreground">₹{price}</span>
                </div>
            </div>
        </div>
    );
}

function HorizontalProductCard({ product }) {
    const variant = product.variants?.[0];
    const price = variant?.salePrice || variant?.regularPrice || 0;
    const router = useRouter();
    return (
        <div onClick={() => router.push(`/products/${product._id}`)} className="cursor-pointer flex gap-3.5 bg-white dark:bg-card rounded-[20px] p-2 pr-4 shadow-[0_0_15px_rgba(0,0,0,0.03)] border border-border/20 mb-3 group">
            <div className="w-24 h-24 shrink-0 rounded-[14px] overflow-hidden bg-[#f4f1ea]">
                <img src={product.images?.[0] || "/placeholder-product.jpg"} alt={product.name} className="w-full h-full object-cover transform transition-transform group-hover:scale-[1.05]" />
            </div>
            <div className="flex flex-col flex-1 py-1">
                <span className="inline-block self-start bg-[#e8ece1] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">New Arrival</span>
                <h3 className="font-serif text-[15px] font-medium text-foreground line-clamp-1">{product.name}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 break-all">{product.shortDescription || "Premium quality product"}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[15px] font-extrabold text-[#2d2d2d] dark:text-foreground">₹{price}</span>
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#f0a500] text-[#f0a500]" />
                        <span className="text-[11px] font-medium text-foreground">{product.avgRating || '4.9'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobilePromoBanner() {
    return (
        <div className="px-4 py-4 mb-2">
            <div className="relative w-full h-[150px] rounded-[24px] overflow-hidden bg-[#242d19] shadow-md group">
                {/* Fallback pattern / image overlay */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542841791-efa6ebba5121?q=80&w=600')] bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-5 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 text-[#f0a500] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        Festive Special
                    </div>
                    <h3 className="font-serif text-[22px] leading-tight font-bold text-white mb-1 shadow-sm">Gift Hampers</h3>
                    <p className="text-[12px] text-white/90 mb-3 shadow-sm max-w-[200px] line-clamp-2">Premium collections for your loved ones.</p>
                    <Link href="/bundles" className="inline-flex items-center gap-1 text-[13px] text-white font-medium group-hover:underline">
                        Explore Now
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SpecialOffers() {
    const offers = [10, 20, 30];
    return (
        <div className="px-4 pt-1 mb-6 overflow-hidden">
            <h2 className="text-[22px] font-serif font-bold text-[#2d2d2d] dark:text-foreground tracking-tight mb-4">Special Offers</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {offers.map((off) => (
                    <div key={off} className="shrink-0 flex flex-col items-center gap-2.5">
                        <div className="w-[90px] h-[90px] rounded-full border-[3px] border-[#e8ece1] dark:border-primary/30 p-1 bg-white dark:bg-transparent">
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#cca27e] to-[#92a15c] flex flex-col items-center justify-center text-white shadow-inner transform hover:scale-105 transition-transform cursor-pointer">
                                <span className="text-[22px] font-bold leading-none">{off}%</span>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold tracking-widest text-[#2d2d2d] dark:text-foreground">OFF</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MobileProductSections() {
    const [featured, setFeatured] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [fRes, bRes, nRes] = await Promise.all([
                    fetch("/api/products?limit=2"),
                    fetch("/api/products?isFeatured=true&limit=2"),
                    fetch("/api/products?sort=newest&limit=3")
                ]);
                const [fData, bData, nData] = await Promise.all([fRes.json(), bRes.json(), nRes.json()]);
                
                if (fData.success) setFeatured(fData.products);
                if (bData.success) setBestSellers(bData.products);
                if (nData.success) setNewArrivals(nData.products);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return <div className="lg:hidden h-screen bg-[#fdfbf7] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#6b7b5c] border-t-transparent flex rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="lg:hidden bg-[#fdfbf7] dark:bg-background min-h-screen pb-10">
            {/* Category Pills */}
            <CategoryPills />

            {/* Featured Products (Full Cards) */}
            <Section title="Featured Products" viewAllLink="/products">
                <div className="grid grid-cols-2 gap-3.5">
                    {featured.map(product => (
                        <ProductCard key={product._id} product={product} viewMode="grid" />
                    ))}
                </div>
            </Section>

            {/* Best Sellers (Simple Cards) */}
            <Section title="Best Sellers" icon={Flame} viewAllLink="/products?isFeatured=true">
                <div className="grid grid-cols-2 gap-4">
                    {bestSellers.map(product => (
                        <SimpleProductCard key={product._id} product={product} />
                    ))}
                </div>
            </Section>

            {/* Promotional Banner */}
            <MobilePromoBanner />

            {/* New Arrivals (Horizontal Cards) */}
            <Section title="New Arrivals" icon={Sparkles} viewAllLink="/products?sort=newest">
                <div className="flex flex-col">
                    {newArrivals.map(product => (
                        <HorizontalProductCard key={product._id} product={product} />
                    ))}
                </div>
            </Section>

            {/* Special Offers (Gradients) */}
            <SpecialOffers />
        </div>
    );
}
