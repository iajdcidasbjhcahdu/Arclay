"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, PackageOpen } from "lucide-react";

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
            const res = await fetch("/api/cart", {
                credentials: "include",
            });
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
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });

            const data = await res.json();

            if (data.success) {
                await fetchCart();
            } else {
                toast.error(data.message || "Failed to update quantity");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update quantity");
        } finally {
            setUpdating(false);
        }
    };

    const removeItem = async (itemId) => {
        if (!confirm("Remove this item from cart?")) return;

        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (data.success) {
                await fetchCart();
            } else {
                toast.error(data.message || "Failed to remove item");
            }
        } catch (error) {
            console.error("Remove error:", error);
            toast.error("Failed to remove item");
        } finally {
            setUpdating(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] dark:bg-background pb-28 lg:pb-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header - Compact on mobile */}
                <div className="mb-4 lg:mb-8">
                    <h1 className="font-serif text-2xl lg:text-4xl font-bold text-foreground">
                        Shopping Cart
                    </h1>
                    <p className="text-muted-foreground text-sm lg:text-base mt-1">
                        {cart?.itemCount || 0} item{(cart?.itemCount || 0) !== 1 ? "s" : ""} in your cart
                    </p>
                </div>

                {!cart || cart.items.length === 0 ? (
                    <div className="bg-card rounded-2xl p-8 lg:p-12 text-center shadow-sm border border-border">
                        <PackageOpen className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="font-serif text-xl font-bold text-foreground mb-2">Your cart is empty</h3>
                        <p className="text-muted-foreground text-sm mb-6">Looks like you haven&apos;t added anything yet</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium transition-all"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-3">
                            {cart.items.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-card rounded-2xl p-3 lg:p-5 shadow-sm border border-border"
                                >
                                    <div className="flex gap-3 lg:gap-5">
                                        {/* Product Image */}
                                        {item.product.images?.[0] && (
                                            <Link href={`/products/${item.product._id}`} className="shrink-0">
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    className="w-20 h-20 lg:w-28 lg:h-28 object-cover rounded-xl"
                                                />
                                            </Link>
                                        )}
                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/products/${item.product._id}`}
                                                className="font-serif text-sm lg:text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 lg:line-clamp-1"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                                {Object.entries(item.variant.attributes).map(([key, value]) => (
                                                    <span key={key} className="mr-2">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </p>

                                            {!item.available && (
                                                <p className="text-xs text-destructive mt-1">
                                                    Out of stock
                                                </p>
                                            )}

                                            {/* Mobile: Price + Quantity + Remove inline */}
                                            <div className="flex items-center justify-between mt-2 lg:mt-3">
                                                <p className="text-base lg:text-lg font-bold text-foreground">
                                                    ₹{item.subtotal}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-0 bg-muted rounded-full">
                                                        <button
                                                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                            disabled={updating || item.quantity <= 1}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted-foreground/10 disabled:opacity-40 transition-all"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                            disabled={updating || item.quantity >= item.variant.stock}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted-foreground/10 disabled:opacity-40 transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => removeItem(item._id)}
                                                        disabled={updating}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary - Fixed bottom bar on mobile, sidebar on desktop */}
                        <div className="lg:col-span-1">
                            {/* Desktop Summary */}
                            <div className="hidden lg:block bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-28">
                                <h2 className="font-serif text-2xl font-bold mb-6">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">₹{cart.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="text-sm font-medium">Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 mb-6">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>₹{cart.total}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-xl font-medium transition-all"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4" />
                                </Link>

                                <Link
                                    href="/products"
                                    className="block w-full text-center mt-3 text-sm text-primary hover:underline"
                                >
                                    Continue Shopping
                                </Link>
                            </div>

                            {/* Mobile Fixed Bottom Summary */}
                            <div className="lg:hidden fixed bottom-17.5 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold text-foreground">₹{cart.total}</p>
                                    </div>
                                    <Link
                                        href="/checkout"
                                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium transition-all"
                                    >
                                        Checkout
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
