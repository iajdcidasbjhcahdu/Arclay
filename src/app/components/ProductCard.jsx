"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ShoppingBag, Star } from "lucide-react";

export default function ProductCard({ product, viewMode = "grid" }) {
    const priceInfo = useMemo(() => {
        const firstVariant = product.variants?.[0];
        if (!firstVariant) return { price: 0, originalPrice: null, hasSale: false, inStock: false, discountPercent: 0 };

        const hasSale = firstVariant.salePrice && firstVariant.salePrice < firstVariant.regularPrice;
        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const discountPercent = hasSale
            ? Math.round((1 - firstVariant.salePrice / firstVariant.regularPrice) * 100)
            : 0;

        return {
            price: hasSale ? firstVariant.salePrice : firstVariant.regularPrice,
            originalPrice: hasSale ? firstVariant.regularPrice : null,
            hasSale,
            inStock: totalStock > 0,
            discountPercent,
        };
    }, [product]);

    const { price, originalPrice, hasSale, inStock, discountPercent } = priceInfo;

    // Status badge: Bestseller (featured) or New or Hot
    const getStatusBadge = () => {
        if (product.isFeatured) return { label: "Bestseller", color: "bg-red-500" };
        if (!hasSale && inStock) return { label: "New", color: "bg-emerald-500" };
        if (hasSale && inStock) return { label: "Hot", color: "bg-orange-500" };
        if (!inStock) return { label: "Out of Stock", color: "bg-gray-700" };
        return null;
    };

    const statusBadge = getStatusBadge();

    if (viewMode === "list") {
        return (
            <Link
                href={`/products/${product._id}`}
                className="group flex gap-4 bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all duration-300"
            >
                <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 relative overflow-hidden bg-cream-100 dark:bg-secondary">
                    {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>
                    )}
                    {statusBadge && (
                        <span className={`absolute top-2 left-2 ${statusBadge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-lg`}>
                            {statusBadge.label}
                        </span>
                    )}
                    {hasSale && discountPercent > 0 && (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            {discountPercent}% OFF
                        </span>
                    )}
                </div>
                <div className="flex-1 py-3 pr-4 flex flex-col justify-center">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                    {product.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">₹{price}</span>
                            {hasSale && originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">₹{originalPrice}</span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/products/${product._id}`}
            className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-cream-100 dark:bg-secondary">
                {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                )}

                {/* Status Badge — top left */}
                {statusBadge && (
                    <span className={`absolute top-2.5 left-2.5 ${statusBadge.color} text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm`}>
                        {statusBadge.label}
                    </span>
                )}

                {/* Discount Badge — top right */}
                {hasSale && discountPercent > 0 && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {discountPercent}% OFF
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-3 lg:p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-sm lg:text-[15px] text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-xs lg:text-[13px] text-muted-foreground mt-0.5 lg:mt-1 line-clamp-1">
                        {product.description}
                    </p>
                )}

                {/* Rating — desktop only for cleaner mobile */}
                {(product.avgRating > 0 || product.reviewCount > 0) && (
                    <div className="hidden lg:flex items-center gap-1.5 mt-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-foreground">{product.avgRating}</span>
                        <span className="text-muted-foreground/40 mx-0.5">|</span>
                        <span className="text-[13px] text-muted-foreground">{product.reviewCount} reviews</span>
                    </div>
                )}

                {/* Price + Cart Button */}
                <div className="flex items-center justify-between mt-2 lg:mt-2.5">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base lg:text-lg font-bold text-foreground">₹{price}</span>
                        {hasSale && originalPrice && (
                            <span className="text-xs lg:text-sm text-muted-foreground line-through">₹{originalPrice}</span>
                        )}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-olive-100 dark:bg-primary/15 text-olive-600 dark:text-primary flex items-center justify-center hover:bg-olive-500 hover:text-white dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
