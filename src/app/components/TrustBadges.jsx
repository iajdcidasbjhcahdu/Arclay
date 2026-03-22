"use client";

import { motion } from "framer-motion";
import { Award, Leaf, Shield, Truck, Droplet, CheckCircle, Heart, Package } from "lucide-react";
import { getSiteName, getBrandContent } from "@/config/brandContent";

const iconMap = {
    "leaf": Leaf,
    "jar": Droplet,
    "no-preservatives": Shield,
    "package": Package,
    "award": Award,
    "truck": Truck
};

export default function TrustBadges() {
    const siteName = getSiteName();
    const content = getBrandContent(siteName);
    const badges = content.whyUs.features;

    return (
        <section className="hidden lg:block py-12 bg-background border-b border-border">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary">
                                {(() => {
                                    const IconComponent = iconMap[badge.icon] || Award;
                                    return <IconComponent className="w-7 h-7" />;
                                })()}
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{badge.title}</p>
                                {badge.desc && <p className="text-sm text-muted-foreground">{badge.desc}</p>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
