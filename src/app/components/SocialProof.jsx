"use client";

import { useState, useEffect, useCallback } from "react";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const socialContent = content.socialProof;

export default function SocialProof() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch("/api/reviews/social-proof");
                const data = await res.json();
                if (data.success) {
                    setReviews(data.reviews);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const displayReviews = reviews.length > 0
        ? reviews.map(r => ({
            id: r._id,
            rating: r.stars,
            text: r.comment,
            author: r.userName || "Customer",
        }))
        : socialContent.reviews;

    const total = displayReviews.length;

    const goNext = useCallback(() => {
        setCurrent((prev) => (prev + 1) % total);
    }, [total]);

    const goPrev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + total) % total);
    }, [total]);

    // Auto-advance every 5s
    useEffect(() => {
        if (total <= 1) return;
        const timer = setInterval(goNext, 5000);
        return () => clearInterval(timer);
    }, [goNext, total]);

    const review = displayReviews[current];

    return (
        <section className="hidden lg:block py-20 lg:py-28 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-12 lg:mb-16">
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-[42px] font-bold text-foreground">
                        What Our Customers Say
                    </h2>
                    <p className="text-muted-foreground mt-3 text-sm lg:text-base max-w-lg mx-auto">
                        Don&apos;t just take our word for it - hear from our satisfied customers
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : review ? (
                        <div className="bg-card rounded-2xl shadow-sm border border-border px-8 py-12 md:px-14 md:py-16 text-center transition-all duration-500">
                            {/* Quote Icon */}
                            <div className="flex justify-center mb-6">
                                <Quote className="w-10 h-10 lg:w-12 lg:h-12 text-olive-300 dark:text-primary/30 rotate-180" />
                            </div>

                            {/* Quote Text */}
                            <p className="font-serif text-lg md:text-xl lg:text-2xl text-foreground leading-relaxed max-w-2xl mx-auto">
                                &quot;{review.text}&quot;
                            </p>

                            {/* Author */}
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <div className="w-12 h-12 rounded-full bg-olive-600 dark:bg-primary/20 flex items-center justify-center text-white dark:text-primary font-bold text-lg">
                                    {review.author[0]}
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-foreground">{review.author}</p>
                                    {/* Stars */}
                                    <div className="flex gap-0.5 mt-0.5">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < (review.rating || 5) ? "text-amber-400 fill-amber-400" : "text-border fill-border"}`}
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Navigation */}
                    {total > 1 && !loading && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            {/* Prev */}
                            <button
                                onClick={goPrev}
                                className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Dots */}
                            <div className="flex items-center gap-2">
                                {displayReviews.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        className={`rounded-full transition-all duration-300 ${
                                            i === current
                                                ? "w-7 h-3 bg-olive-700 dark:bg-primary"
                                                : "w-3 h-3 bg-terracotta-300 dark:bg-primary/30"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Next */}
                            <button
                                onClick={goNext}
                                className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
