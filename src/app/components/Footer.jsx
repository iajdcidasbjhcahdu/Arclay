"use client";

import { getBrandContent, getSiteName } from "@/config/brandContent";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Shield, RotateCcw, Award, Phone, Mail, MapPin, Sparkles } from "lucide-react";

const siteName = getSiteName();
const content = getBrandContent(siteName);

const brandTaglines = {
    essvora: "Artisanal Pickles & Preserves",
    vedicbro: "Authentic Ayurvedic Products",
    arclay: "Premium Quality Products",
    sanatva: "Ayurvedic Medicine & Treatment",
};

const getBrandTagline = () => {
    const name = siteName.toLowerCase().replace(/\s+/g, "");
    if (name.includes("vedicbro")) return brandTaglines.vedicbro;
    if (name.includes("arclay")) return brandTaglines.arclay;
    if (name.includes("sanatva")) return brandTaglines.sanatva;
    return brandTaglines.essvora;
};

const isSanatva = siteName.toLowerCase().includes("sanatva");

export default function Footer() {
    const pathname = usePathname();
    const [showFooter, setShowFooter] = useState(true);
    const [policies, setPolicies] = useState([]);
    const [email, setEmail] = useState("");

    useEffect(() => {
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin")
            ? setShowFooter(false)
            : setShowFooter(true);
    }, [pathname]);

    useEffect(() => {
        async function fetchPolicies() {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                if (data.success && data.config?.legalPolicies) {
                    setPolicies(data.config.legalPolicies);
                }
            } catch {
                // Silently fail
            }
        }
        fetchPolicies();
    }, []);

    if (!showFooter) return null;

    const features = [
        { icon: Truck, title: "Free Shipping", desc: "On orders above ₹500" },
        { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
        { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
        { icon: Award, title: "Premium Quality", desc: "Handcrafted with love" },
    ];

    return (
        <>
            {/* Features Bar */}
            <section className="bg-olive-700 dark:bg-[#1a1a1a]">
                <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-center gap-3 lg:gap-4">
                                <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full border-2 border-white/20 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 lg:w-5.5 lg:h-5.5 text-white/80" />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm lg:text-[15px] font-semibold leading-tight">{title}</h4>
                                    <p className="text-white/50 text-xs lg:text-[13px] mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="bg-olive-800 dark:bg-[#111111]">
                <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-16">
                        <div>
                            <h3 className="font-serif text-2xl lg:text-[28px] font-bold text-white">
                                Subscribe to Our Newsletter
                            </h3>
                            <p className="text-white/50 text-sm lg:text-[15px] mt-1.5">
                                Get exclusive offers, recipes, and updates delivered to your inbox.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full lg:w-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="flex-1 lg:w-72 px-5 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
                            />
                            <button className="px-6 lg:px-8 py-3.5 rounded-xl bg-olive-600 dark:bg-primary hover:bg-olive-500 dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold text-sm transition-colors shrink-0">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Footer */}
            <footer className="bg-olive-800 dark:bg-[#111111] text-white">
                <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

                        {/* Brand Column */}
                        <div className="lg:col-span-4">
                            {/* Logo */}
                            {isSanatva ? (
                                <Link href="/">
                                    <img src="sanatvaLogo.png" className="h-16" alt={siteName} />
                                </Link>
                            ) : (
                                <Link href="/" className="flex items-center gap-3 group">
                                    <div className="w-11 h-11 rounded-xl bg-olive-600 dark:bg-primary/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white/90 dark:text-primary" />
                                    </div>
                                    <div>
                                        <span className="text-xl font-bold text-white leading-tight block">{siteName}</span>
                                        <span className="text-xs text-white/50 leading-none">{getBrandTagline()}</span>
                                    </div>
                                </Link>
                            )}

                            <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-xs">
                                Crafting authentic Indian flavors since 2010. Every jar tells a story of tradition, quality, and love.
                            </p>

                            {/* Contact Info */}
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-white/60 text-sm">
                                    <Phone className="w-4 h-4 shrink-0" />
                                    <span>+91 98765 43210</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/60 text-sm">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span>hello@{siteName.toLowerCase().replace(/\s+/g, "")}.com</span>
                                </div>
                                <div className="flex items-start gap-3 text-white/60 text-sm">
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>123 Flavor Street, Mumbai,<br />Maharashtra 400001</span>
                                </div>
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">

                            {/* Shop */}
                            <div>
                                <h4 className="text-white font-semibold text-[15px] mb-4">Shop</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/products" className="text-white/50 hover:text-white text-sm transition-colors">All Products</Link></li>
                                    <li><Link href="/products?sort=newest" className="text-white/50 hover:text-white text-sm transition-colors">New Arrivals</Link></li>
                                    <li><Link href="/products?isFeatured=true" className="text-white/50 hover:text-white text-sm transition-colors">Bestsellers</Link></li>
                                    <li><Link href="/bundles" className="text-white/50 hover:text-white text-sm transition-colors">Gift Hampers</Link></li>
                                    <li><Link href="/products" className="text-white/50 hover:text-white text-sm transition-colors">Offers</Link></li>
                                </ul>
                            </div>

                            {/* Company */}
                            <div>
                                <h4 className="text-white font-semibold text-[15px] mb-4">Company</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">About Us</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Our Story</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Blog & Recipes</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Careers</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Press</Link></li>
                                </ul>
                            </div>

                            {/* Support */}
                            <div>
                                <h4 className="text-white font-semibold text-[15px] mb-4">Support</h4>
                                <ul className="space-y-3">
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Contact Us</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">FAQs</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Shipping Info</Link></li>
                                    <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Returns</Link></li>
                                    {/* Only show Track Order if it links to a real route */}
                                    <li><Link href="/orders" className="text-white/50 hover:text-white text-sm transition-colors">Track Order</Link></li>
                                </ul>
                            </div>

                            {/* Legal / Policies */}
                            <div>
                                <h4 className="text-white font-semibold text-[15px] mb-4">Legal</h4>
                                <ul className="space-y-3">
                                    {policies.length > 0 ? (
                                        policies.map((policy) => (
                                            <li key={policy.slug}>
                                                <Link href={`/policy/${policy.slug}`} className="text-white/50 hover:text-white text-sm transition-colors">
                                                    {policy.title}
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <>
                                            <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
                                            <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
                                            <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Refund Policy</Link></li>
                                            <li><Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">Cookie Policy</Link></li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10">
                    <div className="container mx-auto px-4 lg:px-8 py-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
                            <p>
                                © {new Date().getFullYear()}{" "}
                                <span className="text-white/60">{siteName}</span>. All Rights Reserved.
                            </p>
                            <div className="flex items-center gap-4">
                                <span>Designed with ❤️ in India</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
