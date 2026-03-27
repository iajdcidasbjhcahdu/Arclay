"use client";

import { motion } from "framer-motion";
import { Leaf, Award, Truck, ShieldCheck, Sparkles } from "lucide-react";

export default function TrustBadges() {
    const badges = [
        { icon: ShieldCheck, title: "FSSAI Certified", desc: "Highest standards of food safety" },
        { icon: Award, title: "ISO 9001:2015", desc: "Certified quality management" },
        { icon: Leaf, title: "Vedic-Method", desc: "Traditionally slow-aged process" },
        { icon: Sparkles, title: "Artisanal Heritage", desc: "100% natural, no preservatives" }
    ];

    return (
        <section className="py-20 bg-[#FEFBF6] relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#869661]/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D86B4B]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-12 max-w-7xl relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ 
                                delay: index * 0.1, 
                                duration: 0.8,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            className="group relative bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-[#ECE8E0]/40 hover:border-[#869661]/30 hover:shadow-[0_25px_60px_rgba(134,150,97,0.08)] transition-all duration-500 overflow-hidden"
                        >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/0 via-[#869661]/5 to-white/0 transition-opacity duration-700 pointer-events-none" />

                            <div className="w-16 h-16 rounded-[1.5rem] bg-[#869661] text-white flex items-center justify-center relative shadow-lg shadow-[#869661]/20 group-hover:rotate-12 transition-transform duration-500">
                                <badge.icon className="w-8 h-8" strokeWidth={1.5} />
                                <div className="absolute -top-1 -right-1">
                                    <Sparkles className="w-4 h-4 text-[#D86B4B] animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col">
                                <h3 className="font-serif text-[18px] font-bold text-[#2A2F25] mb-2 group-hover:text-[#647345] transition-colors">
                                    {badge.title}
                                </h3>
                                <p className="text-[13px] sm:text-[14px] text-[#767B71] font-medium leading-relaxed italic">
                                    {badge.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* Luxury divider line */}
            <div className="container mx-auto px-12 mt-20">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#ECE8E0] to-transparent" />
            </div>
        </section>
    );
}
