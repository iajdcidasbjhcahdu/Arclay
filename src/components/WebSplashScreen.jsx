"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function WebSplashScreen() {
    const [splashScreens, setSplashScreens] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Only run on the client side
        const hasSeenSplash = localStorage.getItem("hasSeenSplash");
        if (hasSeenSplash === "true") {
            return;
        }

        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();

                if (data.success && data.config?.splashScreens?.length > 0) {
                    setSplashScreens(data.config.splashScreens);
                    setIsVisible(true);

                    // Prevent scrolling while splash screen is active
                    document.body.style.overflow = "hidden";
                } else {
                    // No splash screens configured, mark as seen
                    localStorage.setItem("hasSeenSplash", "true");
                }
            } catch (err) {
                console.error("Failed to load splash screen config", err);
            }
        };

        fetchConfig();
    }, []);

    useEffect(() => {
        if (!isVisible || splashScreens.length === 0) return;

        // Auto-advance logic
        const timer = setTimeout(() => {
            if (currentIndex < splashScreens.length - 1) {
                // Move to next screen
                setCurrentIndex(prev => prev + 1);
            } else {
                // Sequence finished, start fade out
                setIsFadingOut(true);
                setTimeout(() => {
                    setIsVisible(false);
                    localStorage.setItem("hasSeenSplash", "true");
                    document.body.style.overflow = "auto";
                }, 500); // 500ms fade duration
            }
        }, 2000); // Show each screen for 2000ms

        return () => clearTimeout(timer);
    }, [isVisible, currentIndex, splashScreens.length]);

    if (!isVisible) return null;

    const currentScreen = splashScreens[currentIndex];

    // Parse background color safely, default to white
    const bgColor = currentScreen?.backgroundColor || "#FFFFFF";

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? "opacity-0" : "opacity-100"
                }`}
            style={{ backgroundColor: bgColor }}
        >
            <div className="flex flex-col items-center justify-center max-w-md text-center px-6 animate-fade-in-up">
                {currentScreen.imageUrl && (
                    <div className="mb-8 relative w-32 h-32 md:w-48 md:h-48 drop-shadow-xl animate-float">
                        <Image
                            src={currentScreen.imageUrl}
                            alt={currentScreen.title || "Logo"}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                )}

                {currentScreen.title && (
                    <h1
                        className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight drop-shadow-sm"
                        style={{ color: getContrastColor(bgColor) }}
                    >
                        {currentScreen.title}
                    </h1>
                )}

                {currentScreen.description && (
                    <p
                        className="text-lg md:text-xl font-medium opacity-90 drop-shadow-sm max-w-sm leading-relaxed"
                        style={{ color: getContrastColor(bgColor, 0.8) }}
                    >
                        {currentScreen.description}
                    </p>
                )}
            </div>

            {/* Progress Indicators */}
            {splashScreens.length > 1 && (
                <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3">
                    {splashScreens.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                                    ? "w-8 opacity-100"
                                    : "w-2 opacity-30"
                                }`}
                            style={{ backgroundColor: getContrastColor(bgColor) }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper function to determine text color based on background
function getContrastColor(hexcolor, opacity = 1) {
    // If it's a valid hex
    if (hexcolor && hexcolor.startsWith('#') && (hexcolor.length === 4 || hexcolor.length === 7)) {
        let r, g, b;
        if (hexcolor.length === 4) {
            r = parseInt(hexcolor[1] + hexcolor[1], 16);
            g = parseInt(hexcolor[2] + hexcolor[2], 16);
            b = parseInt(hexcolor[3] + hexcolor[3], 16);
        } else {
            r = parseInt(hexcolor.slice(1, 3), 16);
            g = parseInt(hexcolor.slice(3, 5), 16);
            b = parseInt(hexcolor.slice(5, 7), 16);
        }

        // Calculate YIQ (perceived brightness)
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Return black for light backgrounds, white for dark backgrounds
        const rgb = yiq >= 128 ? "10,10,10" : "255,255,255";
        return `rgba(${rgb}, ${opacity})`;
    }
    return `rgba(10,10,10, ${opacity})`; // Default to dark text
}
