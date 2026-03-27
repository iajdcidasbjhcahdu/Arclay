"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Gift, Pause, Play } from "lucide-react";

const festivalBanners = [
    {
        _id: '1',
        image: 'https://images.unsplash.com/photo-1605372551532-61c0e3eb4aae?q=80&w=2855&auto=format&fit=crop',
        badge: 'Premium Artisanal Collection',
        title: 'Artisanal Pickles & Preserves',
        subtitle: 'Handcrafted with love, aged to perfection',
        primaryCta: 'Shop Now',
        secondaryCta: 'Gift Hampers',
        primaryLink: '/products',
        secondaryLink: '/bundles',
        dark: false
    },
    {
        _id: '3',
        image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2853&auto=format&fit=crop',
        badge: 'Festive Special',
        title: 'Premium Gift Hampers',
        subtitle: 'Make every occasion special with our curated gift hampers. Perfect for festivals, corporate gifting, or showing someone you care.',
        primaryCta: 'Explore Hampers',
        secondaryCta: 'Corporate Gifting',
        primaryLink: '/bundles',
        secondaryLink: '/offers',
        dark: true
    }
];

export default function HomeHero() {
    const router = useRouter();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        let timer;
        if (isPlaying) {
            timer = setInterval(() => {
                setCurrentBanner(prev => (prev + 1) % festivalBanners.length);
            }, 6000);
        }
        return () => clearInterval(timer);
    }, [isPlaying]);

    return (
        <section className="relative w-full overflow-hidden bg-[#FEFBF6] py-3 container mx-auto px-4 max-w-7xl">
            {/* Aspect ratio container for banner */}
            <div className={`relative w-full h-[50vh] min-h-[420px] sm:min-h-[500px] lg:h-[75vh] lg:min-h-[640px] rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-1000 ${festivalBanners[currentBanner].dark ? 'bg-[#2A2F25]' : 'bg-[#F0EFED]'}`}>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentBanner}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 z-0"
                    >
                        {festivalBanners[currentBanner].dark ? (
                             <div className="absolute inset-0 bg-[#2A2F25] z-0" />
                        ) : (
                            <img
                                src={festivalBanners[currentBanner]?.image}
                                alt={festivalBanners[currentBanner]?.title}
                                className="w-full h-full object-cover opacity-80"
                            />
                        )}
                        
                        {!festivalBanners[currentBanner].dark && (
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent z-10" />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Content Overlay */}
                <div className="relative z-20 h-full w-full flex flex-col justify-center px-6 sm:px-8 lg:px-24 max-w-5xl">
                    <motion.div
                        key={`content-${currentBanner}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        {/* Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6 ${festivalBanners[currentBanner].dark ? 'bg-[#D86B4B] text-white' : 'bg-[#D86B4B] text-white'}`}>
                            <Sparkles className="w-3 h-3" strokeWidth={3}/>
                            {festivalBanners[currentBanner]?.badge}
                        </div>
                        
                        <h1 className={`text-[36px] sm:text-[44px] lg:text-[72px] font-serif font-bold mb-3 sm:mb-5 leading-tight ${festivalBanners[currentBanner].dark ? 'text-white' : 'text-[#2A2F25]'}`}>
                            {festivalBanners[currentBanner]?.title}
                        </h1>
                        
                        <p className={`text-[14px] sm:text-[16px] lg:text-[18px] mb-6 sm:mb-10 max-w-xl leading-relaxed ${festivalBanners[currentBanner].dark ? 'text-white/70' : 'text-[#2A2F25]/70'}`}>
                            {festivalBanners[currentBanner]?.subtitle}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                            <button
                                className="bg-[#869661] hover:bg-[#71824F] text-white rounded-xl px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#869661]/20 w-auto justify-center"
                                onClick={() => router.push(festivalBanners[currentBanner]?.primaryLink)}
                            >
                                {festivalBanners[currentBanner]?.primaryCta}
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                                className={`rounded-xl px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all border w-auto justify-center ${
                                    festivalBanners[currentBanner].dark 
                                    ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' 
                                    : 'border-[#2A2F25]/10 bg-white/50 backdrop-blur-sm text-[#2A2F25] hover:bg-white'
                                }`}
                                onClick={() => router.push(festivalBanners[currentBanner]?.secondaryLink)}
                            >
                                {festivalBanners[currentBanner]?.secondaryCta}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Customizable Options Pill */}
                {festivalBanners[currentBanner].dark && (
                     <div className="hidden sm:block absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
                         <div className="bg-white rounded-full px-6 py-3 flex items-center gap-2 shadow-xl border border-[#ECE8E0]">
                             <Sparkles className="w-4 h-4 text-[#D86B4B]" />
                             <span className="text-xs font-bold text-[#2A2F25] tracking-tight">Customizable Options</span>
                         </div>
                     </div>
                )}

                {/* Dots Navigation */}
                <div className="absolute bottom-6 sm:bottom-10 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-12 flex items-center gap-2 z-30">
                    {festivalBanners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentBanner(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentBanner 
                                    ? 'bg-white w-8' 
                                    : 'bg-white/30 w-1.5'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
