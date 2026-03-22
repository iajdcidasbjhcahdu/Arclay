"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteName } from "@/config/brandContent";

const localBanners = [
    {
        _id: '1',
        image: '/images/banners/hero-1.jpg',
        title: 'Authentic Indian Flavors',
        subtitle: 'Handcrafted pickles and preserves made with love and tradition',
        link: '/products'
    },
    {
        _id: '2',
        image: '/images/banners/hero-2.jpg',
        title: 'Taste of Tradition',
        subtitle: 'Experience the rich heritage of culinary excellence',
        link: '/products?category=pickles'
    },
    {
        _id: '3',
        image: '/images/banners/festival-special.jpg',
        title: 'Premium Selection',
        subtitle: 'Discover our exclusive range of gourmet delights',
        link: '/products'
    }
];

const sanatvaBanners = [
    {
        _id: '4',
        image: 'https://ayurvedicliverdetox.com/wp-content/uploads/2025/10/livrax-banner-1.jpg',
        title: 'Sanatva Ayurvedic',
        subtitle: 'Authentic herbal formulas that cleanse, rejuvenate, and support liver health.',
        link: '/products?brand=sanatva'
    },
    {
        _id: '5',
        image: 'https://ayurvedicliverdetox.com/wp-content/uploads/2025/10/livercare-banner.jpg',
        title: 'Natural Liver Detox',
        subtitle: 'Improve digestion, vitality, and overall body balance naturally.',
        link: '/products?category=liver-care'
    },
    {
        _id: '6',
        image: 'https://ayurvedicliverdetox.com/wp-content/uploads/2025/10/gaskia-banner.jpg',
        title: 'Gaskia & Livkia',
        subtitle: 'Discover Sanatva Ayurvedic’s complete range for digestion and vitality.',
        link: '/products?brand=sanatva'
    }
];

export default function HomeHero() {
    const router = useRouter();
    const siteName = getSiteName();
    const isSanatva = siteName.toLowerCase().includes('sanatva');

    const [banners, setBanners] = useState(isSanatva ? sanatvaBanners : localBanners);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-rotate banners
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, banners.length]);

    return (
        <div className="px-4 pt-3 lg:px-0 lg:pt-0 bg-[#fdfbf7] dark:bg-background lg:bg-transparent">
            <section className="relative h-[220px] lg:h-[700px] rounded-[24px] lg:rounded-none overflow-hidden bg-muted shadow-sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentBanner}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={banners[currentBanner]?.image}
                            alt={banners[currentBanner]?.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black/70 lg:via-black/40 lg:to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Hero Content */}
                <div className="relative h-full container mx-auto px-5 lg:px-8 pb-5 lg:pb-0 flex items-end lg:items-center">
                    <motion.div
                        key={`content-${currentBanner}`}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="max-w-xl w-full"
                    >
                        <div className="hidden lg:inline-flex mb-4 items-center gap-2 bg-terracotta-500 text-white px-4 py-1.5 text-sm font-medium rounded-full">
                            <Sparkles className="w-4 h-4" />
                            <span>Premium Artisanal Collection</span>
                        </div>
                        <h1 className="text-xl lg:text-6xl font-serif lg:font-heading font-bold lg:font-black text-white lg:mb-6 leading-tight drop-shadow-md">
                            {banners[currentBanner]?.title}
                        </h1>
                        <p className="text-[11px] lg:text-xl text-white/90 lg:text-white/80 mt-1 lg:mt-0 lg:mb-8 font-medium lg:font-light drop-shadow-sm">
                            {banners[currentBanner]?.subtitle}
                        </p>
                        <div className="hidden lg:flex flex-wrap gap-4 mt-8">
                            <Button
                                size="lg"
                                className="bg-olive-600 hover:bg-olive-700 text-white rounded-full px-8 h-12 text-base shadow-sm hover:shadow-md transition-all"
                                onClick={() => router.push(banners[currentBanner]?.link || '/shop')}
                            >
                                Shop Now
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Banner Controls */}
                {banners.length > 1 && (
                    <div className="absolute bottom-5 right-5 lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 flex items-center gap-3 lg:gap-4 z-10">
                        <div className="flex gap-1.5 lg:gap-2 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full lg:bg-transparent lg:p-0">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentBanner(index)}
                                    className={`h-1.5 lg:h-2 rounded-full transition-all ${
                                        index === currentBanner 
                                            ? 'bg-white w-4 lg:w-8' 
                                            : 'bg-white/50 w-1.5 lg:w-2 hover:bg-white/70'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                            className="hidden lg:flex w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center text-white hover:bg-white/30 transition-colors"
                            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                        >
                            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
