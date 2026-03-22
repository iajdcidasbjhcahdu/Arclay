"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    Search,
    ShoppingBag,
    User,
    Phone,
    Truck,
    ChevronDown,
    Store,
    Gift,
    LayoutGrid,
    Sparkles,
    Sun,
    Moon,
    Home,
    Heart,
    Bell,
} from "lucide-react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

// Tagline per brand
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

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout, loading, cartCount } = useUser();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isShopHovered, setIsShopHovered] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [categories, setCategories] = useState([]);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const moreRef = useRef(null);
    const userMenuRef = useRef(null);
    const shopDropdownRef = useRef(null);
    const shopTimeoutRef = useRef(null);

    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin")
            ? setShowNavbar(false)
            : setShowNavbar(true);
    }, [pathname]);

    // Fetch categories for shop dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/products");
                const data = await res.json();
                if (data.success && data.products) {
                    const cats = [...new Set(data.products.map(p => p.category).filter(Boolean))];
                    setCategories(cats);
                }
            } catch {}
        };
        fetchCategories();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setIsMoreOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setIsMoreOpen(false);
        setIsUserMenuOpen(false);
        setIsShopHovered(false);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    const handleShopMouseEnter = () => {
        if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
        setIsShopHovered(true);
    };

    const handleShopMouseLeave = () => {
        shopTimeoutRef.current = setTimeout(() => {
            setIsShopHovered(false);
        }, 150);
    };

    if (!mounted) return null;

    const isActive = (path) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    const isSanatva = siteName.toLowerCase().includes("sanatva");

    // Nav items
    const navItems = [
        { label: "Home", href: "/", icon: Sparkles },
        { label: "Shop", href: "/products", icon: Store, hasDropdown: true },
        { label: "Gift Boxes", href: "/bundles", icon: Gift },
    ];

    // More dropdown items
    const moreItems = [
        ...(isAuthenticated
            ? [
                  { label: "My Orders", href: "/orders" },
                  { label: "My Account", href: "/account" },
              ]
            : []),
        ...(isAdmin ? [{ label: "Admin Panel", href: "/admin" }] : []),
    ];

    // Default shop dropdown categories
    const shopCategories = [
        { label: "All Products", href: "/products" },
        ...categories.map(cat => ({
            label: cat,
            href: `/products?category=${encodeURIComponent(cat)}`,
        })),
    ];

    return (
        showNavbar && (
            <>
                {/* Top Announcement Bar (desktop only) */}
                <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-olive-700 dark:bg-[#1a1a1a] text-white text-xs">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex items-center justify-between h-9">
                            {/* Left info */}
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3" />
                                    <span>+91 98765 43210</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Free shipping on orders above ₹500</span>
                                </div>
                            </div>
                            {/* Right links */}
                            <div className="flex items-center gap-4">
                                {isAuthenticated && (
                                    <Link
                                        href="/orders"
                                        className="hover:text-cream-300 transition-colors"
                                    >
                                        Track Order
                                    </Link>
                                )}
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    aria-label="Toggle Theme"
                                >
                                    {theme === "dark" ? (
                                        <Sun className="w-3.5 h-3.5" />
                                    ) : (
                                        <Moon className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Navbar */}
                <header className="fixed top-0 lg:top-9 left-0 right-0 z-50 bg-[#fdfbf7] lg:bg-background/95 lg:backdrop-blur-md border-b-0 lg:border-b border-border transition-all">
                    <nav className="container mx-auto px-4 lg:px-8">
                        <div className="flex items-center justify-between h-[72px] lg:h-[68px]">
                            {/* Brand Logo */}
                            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                                {isSanatva ? (
                                    <img src="sanatvaLogo.png" className="h-12" alt={siteName} />
                                ) : (
                                    <>
                                        {/* Logo Icon */}
                                        <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-[10px] lg:rounded-xl bg-[#6b7b5c] lg:bg-olive-700 dark:bg-primary flex items-center justify-center shadow-sm">
                                            <Sparkles className="w-5 h-5 lg:w-5.5 lg:h-5.5 text-white dark:text-primary-foreground" />
                                        </div>
                                        {/* Brand Text */}
                                        <div className="flex flex-col">
                                            <span className="font-serif text-[22px] lg:font-sans lg:text-xl font-bold text-[#2d2d2d] dark:text-foreground leading-none tracking-tight">
                                                {siteName}
                                            </span>
                                            <span className="hidden lg:block text-[11px] text-primary dark:text-primary leading-none tracking-wide mt-1">
                                                {getBrandTagline()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </Link>

                            {/* Desktop Navigation - Center */}
                            <div className="hidden lg:flex items-center gap-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    // Shop item with hover dropdown
                                    if (item.hasDropdown) {
                                        return (
                                            <div
                                                key={item.label}
                                                className="relative"
                                                ref={shopDropdownRef}
                                                onMouseEnter={handleShopMouseEnter}
                                                onMouseLeave={handleShopMouseLeave}
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                        active || isShopHovered
                                                            ? "bg-olive-100 dark:bg-primary/15 text-olive-800 dark:text-primary"
                                                            : "text-foreground/70 hover:text-foreground hover:bg-muted/60"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {item.label}
                                                    <ChevronDown
                                                        className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                                                            isShopHovered ? "rotate-180" : ""
                                                        }`}
                                                    />
                                                </Link>

                                                {/* Shop Dropdown */}
                                                {isShopHovered && (
                                                    <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 animate-fade-in-up">
                                                        {shopCategories.map((cat) => (
                                                            <Link
                                                                key={cat.label}
                                                                href={cat.href}
                                                                className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors capitalize"
                                                                onClick={() => setIsShopHovered(false)}
                                                            >
                                                                {cat.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                active
                                                    ? "bg-olive-100 dark:bg-primary/15 text-olive-800 dark:text-primary"
                                                    : "text-foreground/70 hover:text-foreground hover:bg-muted/60"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}

                                {/* More Dropdown */}
                                {moreItems.length > 0 && (
                                    <div className="relative" ref={moreRef}>
                                        <button
                                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                isMoreOpen
                                                    ? "bg-olive-100 dark:bg-primary/15 text-olive-800 dark:text-primary"
                                                    : "text-foreground/70 hover:text-foreground hover:bg-muted/60"
                                            }`}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                            More
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                                                    isMoreOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>
                                        {isMoreOpen && (
                                            <div className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-1.5 animate-fade-in-up">
                                                {moreItems.map((item) => (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors"
                                                        onClick={() => setIsMoreOpen(false)}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Right Actions */}
                            <div className="hidden lg:flex items-center gap-1.5">
                                {/* Search */}
                                <button className="p-2.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors">
                                    <Search className="w-5 h-5" />
                                </button>

                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></div>
                                ) : isAuthenticated ? (
                                    <>
                                        {/* Cart */}
                                        <Link
                                            href="/cart"
                                            className="relative p-2.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
                                        >
                                            <ShoppingBag className="w-5 h-5" />
                                            {cartCount > 0 && (
                                                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center border-2 border-background">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </Link>

                                        {/* User Profile */}
                                        <div className="relative" ref={userMenuRef}>
                                            <button
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                className="p-2.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
                                            >
                                                <User className="w-5 h-5" />
                                            </button>
                                            {isUserMenuOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl py-1.5 animate-fade-in-up">
                                                    <div className="px-4 py-3 border-b border-border">
                                                        <p className="font-semibold text-foreground text-sm truncate">
                                                            {user?.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href="/account"
                                                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        Account
                                                    </Link>
                                                    <Link
                                                        href="/orders"
                                                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        Orders
                                                    </Link>
                                                    {user?.role === "admin" && (
                                                        <Link
                                                            href="/admin"
                                                            className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                        >
                                                            Admin
                                                        </Link>
                                                    )}
                                                    <div className="border-t border-border mt-1 pt-1">
                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted/60 transition-colors"
                                                        >
                                                            Sign Out
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 ml-2">
                                        <Link
                                            href="/login"
                                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link href="/products">
                                            <button className="bg-olive-700 dark:bg-primary hover:bg-olive-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold rounded-full px-5 h-9 text-sm shadow-sm hover:shadow-md transition-all">
                                                Shop Now
                                            </button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Right Actions */}
                            <div className="lg:hidden flex items-center gap-2">
                                {/* Search */}
                                <button className="w-10 h-10 bg-white dark:bg-secondary rounded-full border border-border/40 shadow-sm flex flex-col items-center justify-center text-foreground transition-colors">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                </button>

                                {/* Notification Bell */}
                                <button className="relative w-10 h-10 bg-white dark:bg-secondary rounded-full border border-border/40 shadow-sm flex flex-col items-center justify-center text-foreground transition-colors">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    {/* Mockup explicitly shows 2 */}
                                    <span className="absolute -top-1 -right-1 bg-[#e25d43] text-white text-[10px] font-bold h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center border-[1.5px] border-white dark:border-secondary">
                                        2
                                    </span>
                                </button>

                                {/* Cart */}
                                <Link
                                    href="/cart"
                                    className="relative w-10 h-10 bg-white dark:bg-secondary rounded-full border border-border/40 shadow-sm flex flex-col items-center justify-center text-foreground transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-[#e25d43] text-white text-[10px] font-bold h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center border-[1.5px] border-white dark:border-secondary">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </nav>
                </header>

                {/* Spacer for fixed navbar (mobile: 64px, desktop: announcement 36px + navbar 68px) */}
                <div className="h-16 lg:h-26" />

                {/* Mobile Bottom Navigation Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-border/30 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] safe-area-bottom pb-1">
                    <div className="flex items-center justify-around h-[70px] px-2.5">
                        {/* Home */}
                        <Link
                            href="/"
                            className={`flex flex-col items-center justify-center gap-1 min-w-[70px] h-[52px] rounded-[18px] transition-colors ${
                                isActive("/")
                                    ? "bg-[#ecf0e6] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary"
                                    : "text-muted-foreground/80 hover:bg-muted/30"
                            }`}
                        >
                            <Home className="w-[20px] h-[20px]" />
                            <span className="text-[10px] font-semibold">Home</span>
                        </Link>

                        {/* Shop */}
                        <Link
                            href="/products"
                            className={`flex flex-col items-center justify-center gap-1 min-w-[70px] h-[52px] rounded-[18px] transition-colors ${
                                isActive("/products")
                                    ? "bg-[#ecf0e6] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary"
                                    : "text-muted-foreground/80 hover:bg-muted/30"
                            }`}
                        >
                            <Store className="w-[20px] h-[20px]" />
                            <span className="text-[10px] font-semibold">Shop</span>
                        </Link>

                        {/* Wishlist */}
                        <Link
                            href={isAuthenticated ? "/account" : "/login"}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[70px] h-[52px] rounded-[18px] transition-colors text-muted-foreground/80 hover:bg-muted/30`}
                        >
                            <Heart className="w-[20px] h-[20px]" />
                            <span className="text-[10px] font-semibold">Wishlist</span>
                        </Link>

                        {/* Profile */}
                        <Link
                            href={isAuthenticated ? "/account" : "/login"}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[70px] h-[52px] rounded-[18px] transition-colors ${
                                isActive("/account") || isActive("/login")
                                    ? "bg-[#ecf0e6] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary"
                                    : "text-muted-foreground/80 hover:bg-muted/30"
                            }`}
                        >
                            <User className="w-[20px] h-[20px]" />
                            <span className="text-[10px] font-semibold">Profile</span>
                        </Link>
                    </div>
                </div>

                {/* Bottom nav spacer for mobile */}
                <div className="lg:hidden h-16" />
            </>
        )
    );
}
