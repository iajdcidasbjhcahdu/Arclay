"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Truck, ChevronRight, Lock } from "lucide-react";
import TrustBadges from "../components/TrustBadges";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
    const { isAuthenticated, loading: userLoading, setCartCount } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchCart();
        }
    }, [isAuthenticated, userLoading]);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
                setCartCount(data.cart?.items?.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return;
        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });
            const data = await res.json();
            if (data.success) await fetchCart();
            else toast.error(data.message || "Failed to update");
        } catch { toast.error("Failed to update quantity"); }
        finally { setUpdating(false); }
    };

    const removeItem = async (itemId) => {
        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE", credentials: "include" });
            const data = await res.json();
            if (data.success) await fetchCart();
            else toast.error(data.message || "Failed to remove");
        } catch { toast.error("Failed to remove item"); }
        finally { setUpdating(false); }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FEFBF6] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#869661]/30 border-t-[#869661] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FEFBF6] pb-28 lg:pb-12">
            {/* Header */}
            <div className="bg-white border-b border-[#ECE8E0]">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-8">
                    <nav className="flex items-center gap-2 text-sm text-[#767B71] mb-4">
                        <Link href="/" className="hover:text-[#2A2F25] transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#2A2F25] font-medium">Shopping Cart</span>
                    </nav>
                    <h1 className="font-serif text-[36px] lg:text-[44px] font-bold text-[#2A2F25]">
                        Shopping Bag
                    </h1>
                    <p className="text-[#767B71] text-sm mt-1">{cart?.itemCount || 0} item{(cart?.itemCount || 0) !== 1 ? "s" : ""} in your cart</p>
                </div>
            </div>

            <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-8 lg:py-12">
                {!cart || cart.items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-[#ECE8E0]">
                        <ShoppingBag className="w-16 h-16 mx-auto text-[#ECE8E0] mb-6" strokeWidth={1} />
                        <h3 className="font-serif text-2xl text-[#2A2F25] mb-2">Your Cart is Empty</h3>
                        <p className="text-[#767B71] mb-8 max-w-sm mx-auto text-sm">Discover our handcrafted pickles and preserves.</p>
                        <Link href="/products" className="inline-block bg-[#869661] text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#71824F] transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        
                        {/* Cart Items */}
                        <div className="lg:col-span-8 space-y-6">
                            <AnimatePresence>
                                {cart.items.map((item, idx) => (
                                    <motion.div 
                                        key={item._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex gap-4 lg:gap-8 p-6 lg:p-7 bg-white rounded-3xl border border-[#ECE8E0] group relative overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                                    >
                                        {/* Image */}
                                        {item.product.images?.[0] && (
                                            <Link href={`/products/${item.product._id}`} className="shrink-0 w-28 h-32 lg:w-32 lg:h-36 rounded-2xl overflow-hidden bg-[#F3EFE8] relative">
                                                <img 
                                                    src={item.product.images[0]} 
                                                    alt={item.product.name} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                            </Link>
                                        )}
    
                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#869661] mb-1 block">Artisanal Choice</span>
                                                        <Link href={`/products/${item.product._id}`} className="font-serif text-[18px] lg:text-[22px] font-bold text-[#2A2F25] hover:text-[#647345] transition-colors leading-tight block">
                                                            {item.product.name}
                                                        </Link>
                                                    </div>
                                                    <button onClick={() => removeItem(item._id)} disabled={updating}
                                                        className="w-10 h-10 rounded-full border border-[#ECE8E0] flex items-center justify-center text-[#767B71] hover:text-[#D86B4B] hover:border-[#D86B4B]/20 hover:bg-[#FDF2F0] transition-all shrink-0 disabled:opacity-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {Object.entries(item.variant.attributes).map(([key, value]) => (
                                                        <span key={key} className="text-[11px] font-semibold bg-[#F8F5F0] text-[#767B71] px-3 py-1 rounded-full border border-[#ECE8E0]/50">
                                                            {key}: <span className="text-[#2A2F25]">{value}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
    
                                            <div className="flex items-end justify-between mt-auto">
                                                <div className="flex items-center bg-[#F3EFE8]/50 border border-[#ECE8E0] rounded-2xl p-1.5">
                                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                        disabled={updating || item.quantity <= 1}
                                                        className="w-10 h-10 flex items-center justify-center text-[#767B71] hover:bg-white rounded-xl transition-all disabled:opacity-40 shadow-none hover:shadow-sm">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-12 text-center text-[15px] font-bold text-[#2A2F25]">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                        disabled={updating || item.quantity >= item.variant.stock}
                                                        className="w-10 h-10 flex items-center justify-center text-[#767B71] hover:bg-white rounded-xl transition-all disabled:opacity-40 shadow-none hover:shadow-sm">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] text-[#767B71] font-bold line-through block mb-0.5 opacity-50">₹{(item.subtotal * 1.2).toFixed(0)}</span>
                                                    <span className="text-[24px] font-bold text-[#2A2F25]">₹{item.subtotal}</span>
                                                </div>
                                            </div>
    
                                            {!item.available && (
                                                <p className="text-xs text-[#D86B4B] mt-2 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-[#D86B4B] rounded-full animate-pulse" /> Out of stock
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl border border-[#ECE8E0] p-6 lg:p-8 sticky top-8 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.04)]">
                                <h2 className="font-serif text-2xl font-bold text-[#2A2F25] mb-6 pb-4 border-b border-[#ECE8E0]">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 mb-6 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#767B71]">Subtotal</span>
                                        <span className="font-semibold text-[#2A2F25]">₹{cart.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#767B71]">Shipping</span>
                                        <span className="text-[#869661] text-xs font-semibold bg-[#F0F4EC] px-2 py-1 rounded-full">Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-[#ECE8E0] pt-4 mb-6 flex items-baseline justify-between">
                                    <span className="text-sm font-semibold text-[#2A2F25]">Total</span>
                                    <span className="text-[28px] font-bold text-[#2A2F25]">₹{cart.total}</span>
                                </div>

                                <Link href="/checkout"
                                    className="w-full flex items-center justify-center gap-3 bg-[#2A2F25] hover:bg-[#2A2F25]/90 text-white py-5 rounded-2xl text-[15px] font-bold transition-all hover:shadow-2xl hover:-translate-y-1 mb-4 shadow-xl shadow-black/10">
                                    <Lock className="w-4 h-4 text-[#869661]" />
                                    Secure Checkout
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>

                                <Link href="/products"
                                    className="w-full flex items-center justify-center py-4 text-xs tracking-widest uppercase font-bold text-[#2A2F25] border border-[#ECE8E0] rounded-2xl hover:bg-[#F3EFE8] transition-all">
                                    Continue Shopping
                                </Link>

                                {/* Trust indicators */}
                                <div className="mt-6 pt-6 border-t border-[#ECE8E0] flex items-center justify-center gap-6 text-[#767B71]">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Shield className="w-3.5 h-3.5" /> Secure
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Truck className="w-3.5 h-3.5" /> Free Shipping
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Trust Badges Strip */}
            <div className="border-t border-[#ECE8E0] mt-12">
                <TrustBadges />
            </div>

            {/* Mobile Sticky CTA */}
            {cart && cart.items.length > 0 && (
                <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ECE8E0] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#767B71] font-semibold uppercase tracking-wider">Total</span>
                            <span className="text-xl font-bold text-[#2A2F25]">₹{cart.total}</span>
                        </div>
                        <Link href="/checkout"
                            className="flex-1 flex items-center justify-center bg-[#869661] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#71824F] transition-colors">
                            Checkout
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}
