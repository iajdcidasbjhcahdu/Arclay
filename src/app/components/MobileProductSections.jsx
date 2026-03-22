"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const isSanatva = siteName.toLowerCase().includes("sanatva");

function CategoryPills() {
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState("all");
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch {}
        };
        fetchCategories();
    }, []);

    return (
        <div className="px-4 py-4">
            <div
                ref={scrollRef}
                className="flex gap-2.5 overflow-x-auto no-scrollbar"
            >
                <Link
                    href="/products"
                    className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                        active === "all"
                            ? "bg-olive-700 dark:bg-primary text-white dark:text-primary-foreground"
                            : "bg-muted text-foreground border border-border"
                    }`}
                    onClick={() => setActive("all")}
                >
                    All Products
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat._id}
                        href={`/products?category=${cat._id}`}
                        className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                            active === cat._id
                                ? "bg-olive-700 dark:bg-primary text-white dark:text-primary-foreground"
                                : "bg-muted text-foreground border border-border"
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

function ProductGrid({ title, endpoint, viewAllLink }) {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(endpoint);
                const data = await res.json();
                if (data.success) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error(`Failed to fetch products for ${title}:`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [endpoint, title]);

    if (!products.length && !loading) return null;

    return (
        <section className="py-5">
            <div className="px-4">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">{title}</h2>
                    <Link
                        href={viewAllLink || "/products"}
                        className="flex items-center gap-1 text-sm text-olive-600 dark:text-primary font-medium"
                    >
                        See All
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden">
                                <div className="aspect-square bg-muted animate-pulse" />
                                <div className="p-2.5 space-y-2">
                                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {products.slice(0, 10).map((product) => {
                            const variant = product.variants?.[0];
                            const salePrice = variant?.salePrice;
                            const regularPrice = variant?.regularPrice;
                            const hasDiscount = salePrice && salePrice < regularPrice;
                            const discountPercent = hasDiscount
                                ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
                                : 0;

                            // Determine badge
                            const isNew = product.createdAt &&
                                (new Date() - new Date(product.createdAt)) < 30 * 24 * 60 * 60 * 1000;

                            return (
                                <div
                                    key={product._id}
                                    onClick={() => router.push(`/products/${product._id}`)}
                                    className="cursor-pointer group bg-card rounded-2xl overflow-hidden shadow-sm"
                                >
                                    {/* Image */}
                                    <div className="aspect-square relative overflow-hidden bg-muted">
                                        <img
                                            src={product.images?.[0] || "/placeholder-product.jpg"}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 flex gap-1.5">
                                            {product.isFeatured && (
                                                <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    <Flame className="w-2.5 h-2.5" />
                                                    Hot
                                                </span>
                                            )}
                                            {isNew && !product.isFeatured && (
                                                <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    New
                                                </span>
                                            )}
                                        </div>

                                        {hasDiscount && discountPercent > 0 && (
                                            <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {discountPercent}% OFF
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-2.5">
                                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                                            {product.name}
                                        </h3>
                                        {product.shortDescription && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {product.shortDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function MobileProductSections() {
    const rail1Title = isSanatva ? "Best Detoxifiers" : "Featured Products";
    const rail2Title = isSanatva ? "Featured Wellness" : "New Arrivals";

    return (
        <div className="lg:hidden bg-background">
            {/* Category Pills */}
            <CategoryPills />

            <ProductGrid
                title={rail1Title}
                endpoint="/api/products?isFeatured=true&limit=10"
                viewAllLink="/products?isFeatured=true"
            />
            <ProductGrid
                title={rail2Title}
                endpoint="/api/products?sort=newest&limit=10"
                viewAllLink="/products?sort=newest"
            />
        </div>
    );
}
