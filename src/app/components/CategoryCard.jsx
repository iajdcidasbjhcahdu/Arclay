"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function CategoryCard({ category, index = 0 }) {
    const [imgError, setImgError] = useState(false);
    
    // Simulate image error based on screenshot
    // The screenshot showed broken images for categories with a grey gradient. 
    // We'll use a beautiful olive/cream gradient if image fails or is missing.
    const fallbackGradient = "bg-gradient-to-b from-[#EAE6D9] to-[#606E4D]";

    const isAllProducts = category._id === 'all-products';
    const linkHref = isAllProducts ? '/products' : `/products?category=${category._id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="w-full group"
        >
            <Link href={linkHref} className="block w-full">
                
                {/* Image Container */}
                <div className="relative aspect-square w-full rounded-[1.8rem] overflow-hidden bg-white mb-3 shadow-[0_4px_15px_rgb(0,0,0,0.06)] transition-all duration-400 group-hover:shadow-[0_8px_25px_rgb(0,0,0,0.12)] group-hover:-translate-y-1">
                    {(!imgError && category.image) ? (
                        <img
                            src={category.image}
                            alt={category.name}
                            onError={() => setImgError(true)}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className={`absolute inset-0 w-full h-full ${fallbackGradient} transition-transform duration-700 group-hover:scale-105`} />
                    )}
                </div>

                {/* Content - Below Image */}
                <div className="text-center px-1">
                    <h3 className="font-sans text-[14px] sm:text-[16px] font-bold text-[#1A1D23] transition-colors leading-tight line-clamp-1">
                        {category.name}
                    </h3>
                </div>
                
                {/* Broken Image Icon Simulation */}
                {imgError && (
                    <div className="absolute top-6 left-6 text-black/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                )}
            </Link>
        </motion.div>
    );
}
