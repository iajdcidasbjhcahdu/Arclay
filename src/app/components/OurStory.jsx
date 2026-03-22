"use client";

import { useState, useEffect } from "react";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import Link from "next/link";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const storyContent = content.ourStory;

export default function OurStory() {
    const [featuredImage, setFeaturedImage] = useState(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await fetch("/api/products?isFeatured=true&limit=1");
                const data = await res.json();
                if (data.success && data.products?.[0]?.images?.[0]) {
                    setFeaturedImage(data.products[0].images[0]);
                }
            } catch {}
        };
        fetchImage();
    }, []);

    // Calculate years since 2010
    const yearsSince = new Date().getFullYear() - 2010;

    return (
        <section className="hidden lg:block py-20 lg:py-28 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

                    {/* Left - Image with floating stat badge */}
                    <div className="relative">
                        <div className="aspect-2/2 rounded-2xl overflow-hidden bg-cream-100 dark:bg-secondary">
                            {featuredImage ? (
                                <img
                                    src={featuredImage}
                                    alt="Our Story"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-olive-100 dark:bg-secondary flex items-center justify-center">
                                    <span className="text-8xl opacity-20">🫙</span>
                                </div>
                            )}
                        </div>

                        {/* Floating stat badge - bottom right overlapping */}
                        <div className="absolute -bottom-6 right-4 lg:-right-5 bg-card border border-border rounded-2xl shadow-lg px-8 py-6 text-center">
                            <p className="text-4xl lg:text-5xl font-bold text-foreground leading-none">
                                {yearsSince}+
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">Years of Excellence</p>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div>
                        {/* Label */}
                        <span className="inline-block px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                            {storyContent.sectionLabel}
                        </span>

                        {/* Title */}
                        <h2 className="font-serif text-3xl md:text-4xl lg:text-[42px] font-bold text-foreground leading-tight">
                            Crafting Authentic Flavors Since 2010
                        </h2>

                        {/* Description */}
                        <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
                            <p>{storyContent.description}</p>
                            <p>{storyContent.additionalText}</p>
                        </div>

                        {/* Stats Row */}
                        <div className="flex gap-10 lg:gap-14 mt-8">
                            {storyContent.stats.map((stat, i) => (
                                <div key={i}>
                                    <p className="text-3xl lg:text-4xl font-bold text-foreground leading-none">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-8">
                            <Link
                                href="/"
                                className="inline-flex items-center px-7 py-3.5 rounded-xl bg-olive-700 dark:bg-primary hover:bg-olive-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-sm transition-colors"
                            >
                                Read Our Story
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
