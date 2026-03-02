"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Gift, Leaf } from "lucide-react";
import { getSiteName } from "@/config/brandContent";

export default function PromoBanner() {
    const router = useRouter();
    const siteName = getSiteName();
    const isSanatva = siteName.toLowerCase().includes('sanatva');

    if (isSanatva) {
        return (
            <section className="py-8 bg-transparent">
                <div className="container mx-auto px-4 lg:px-8">
                    <div
                        onClick={() => router.push('/products?brand=sanatva')}
                        className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer group h-[200px] md:h-[250px]"
                    >
                        <img
                            src="https://ayurvedicliverdetox.com/wp-content/uploads/2025/10/livrax-livkia-combo_b0e0b781-5017-40a0-903a-5edbd3568174.jpg"
                            alt="Sanatva Combo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-olive-900/90 via-olive-900/40 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
                            <div className="flex items-center gap-2 mb-2">
                                <Leaf className="w-5 h-5 text-gold-400" />
                                <span className="text-gold-400 text-sm font-medium uppercase tracking-wider">Health Combo</span>
                            </div>
                            <h2 className="text-white font-heading font-bold text-2xl md:text-4xl mb-2">
                                Wellness Packs
                            </h2>
                            <p className="text-white/80 text-sm md:text-base mb-6 max-w-sm">
                                Complete natural detox and digestive support kits for you and your family.
                            </p>
                            <button className="inline-flex items-center gap-2 text-white text-sm font-bold uppercase tracking-widest group-hover:text-gold-400 transition-colors">
                                Explore Combos <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 bg-transparent">
            <div className="container mx-auto px-4 lg:px-8">
                <div
                    onClick={() => router.push('/gift-hampers')}
                    className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer group h-[200px] md:h-[250px]"
                >
                    <img
                        src="/images/banners/hero-2.jpg"
                        alt="Festive Gifting"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop"; }} // Fallback
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-olive-900/90 via-olive-900/40 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-5 h-5 text-gold-400" />
                            <span className="text-gold-400 text-sm font-medium uppercase tracking-wider">Festive Special</span>
                        </div>
                        <h2 className="text-white font-heading font-bold text-2xl md:text-4xl mb-2">
                            Gift Hampers
                        </h2>
                        <p className="text-white/80 text-sm md:text-base mb-6 max-w-sm">
                            Premium collections curated for your loved ones. Perfect for every occasion.
                        </p>
                        <button className="inline-flex items-center gap-2 text-white text-sm font-bold uppercase tracking-widest group-hover:text-gold-400 transition-colors">
                            Explore Now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
