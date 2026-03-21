"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/app/components/ProductCard";
import { toast } from "react-toastify";
import { ArrowLeft, Heart, Share2, ShoppingBag, Star, Truck, Shield, RotateCcw, Leaf } from "lucide-react";

export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { isAuthenticated } = useUser();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);

    // Review form state
    const [canReview, setCanReview] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [activeTab, setActiveTab] = useState("description");

    // Pincode check state
    const [pincode, setPincode] = useState("");
    const [checkingPincode, setCheckingPincode] = useState(false);
    const [pincodeResult, setPincodeResult] = useState(null);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && id) {
            checkReviewEligibility();
        }
    }, [isAuthenticated, id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();

            if (data.success) {
                setProduct(data.product);
                setReviews(data.reviews || []);
                setRelatedProducts(data.relatedProducts || []);
                const initialOptions = {};
                data.product.variationTypes?.forEach((type) => {
                    if (type.options?.length > 0) {
                        initialOptions[type.name] = type.options[0];
                    }
                });
                setSelectedOptions(initialOptions);
            }
        } catch (error) {
            console.error("Failed to fetch product:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkReviewEligibility = async () => {
        try {
            const res = await fetch(`/api/reviews?productId=${id}`, { credentials: "include" });
            const data = await res.json();
            if (data.success) setCanReview(data.canReview);
        } catch (error) {
            console.error("Failed to check review eligibility:", error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewComment.trim()) return;
        setSubmittingReview(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId: id, stars: reviewStars, comment: reviewComment.trim() })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Review submitted! It will be visible after admin approval.");
                setShowReviewForm(false);
                setReviewComment("");
                setCanReview(false);
            } else {
                toast.error(data.message || "Failed to submit review");
            }
        } catch (error) {
            toast.error("Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const selectedVariant = useMemo(() => {
        if (!product?.variants?.length) return null;
        if (!product.variationTypes?.length) return product.variants[0];
        return product.variants.find(variant => {
            const attrs = variant.attributes instanceof Map ? Object.fromEntries(variant.attributes) : variant.attributes;
            return Object.entries(selectedOptions).every(([key, value]) => attrs[key] === value);
        });
    }, [product, selectedOptions]);

    const priceInfo = useMemo(() => {
        if (!selectedVariant) return { price: 0, originalPrice: null, hasSale: false, stock: 0, inStock: false, discountPercent: 0, saveAmount: 0 };
        const hasSale = selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.regularPrice;
        const discountPercent = hasSale ? Math.round((1 - selectedVariant.salePrice / selectedVariant.regularPrice) * 100) : 0;
        const saveAmount = hasSale ? selectedVariant.regularPrice - selectedVariant.salePrice : 0;
        return {
            price: hasSale ? selectedVariant.salePrice : selectedVariant.regularPrice,
            originalPrice: hasSale ? selectedVariant.regularPrice : null,
            hasSale,
            discountPercent,
            saveAmount,
            stock: selectedVariant.stock || 0,
            inStock: (selectedVariant.stock || 0) > 0
        };
    }, [selectedVariant]);

    const isOptionAvailable = (typeName, optionValue) => {
        if (!product?.variants) return false;
        return product.variants.some(variant => {
            const attrs = variant.attributes instanceof Map ? Object.fromEntries(variant.attributes) : variant.attributes;
            if (attrs[typeName] !== optionValue) return false;
            const otherOptionsMatch = Object.entries(selectedOptions).every(([key, value]) => {
                if (key === typeName) return true;
                return attrs[key] === value;
            });
            return otherOptionsMatch && variant.stock > 0;
        });
    };

    const handleOptionSelect = (typeName, optionValue) => {
        setSelectedOptions(prev => ({ ...prev, [typeName]: optionValue }));
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) { router.push("/login"); return; }
        if (!selectedVariant) { toast.error("Please select all options"); return; }
        try {
            setAddingToCart(true);
            const variantAttributes = selectedVariant.attributes instanceof Map ? Object.fromEntries(selectedVariant.attributes) : selectedVariant.attributes;
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId: product._id, variantAttributes, quantity }),
            });
            const data = await res.json();
            if (data.success) { toast.success("Added to cart!"); router.push("/cart"); }
            else { toast.error(data.message || "Failed to add to cart"); }
        } catch (error) {
            toast.error("Failed to add to cart");
        } finally {
            setAddingToCart(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: product.name, url: window.location.href });
            } catch {}
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
        }
    };

    const renderStars = (count) => Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? "text-amber-500" : "text-border"}>★</span>
    ));

    const avgRating = reviews.length > 0 ? (reviews.reduce((t, r) => t + r.stars, 0) / reviews.length).toFixed(1) : 0;

    // Get selected variant label (e.g. "500g")
    const variantLabel = useMemo(() => {
        if (!selectedVariant || !product?.variationTypes?.length) return null;
        const attrs = selectedVariant.attributes instanceof Map ? Object.fromEntries(selectedVariant.attributes) : selectedVariant.attributes;
        return Object.values(attrs).join(", ");
    }, [selectedVariant, product]);

    // Status badge
    const statusBadge = product?.isFeatured
        ? { label: "Bestseller", color: "bg-red-500" }
        : null;

    if (loading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-background">
                <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Product Not Found</h1>
                    <p className="text-muted-foreground mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link href="/products">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">Browse Products</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">

            {/* ============ MOBILE LAYOUT ============ */}
            <div className="lg:hidden">
                {/* Mobile Top Bar */}
                <div className="sticky top-25 z-30 bg-background/95 backdrop-blur-sm px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                                <Heart className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleShare}
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <Link
                                href="/cart"
                                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                            >
                                <ShoppingBag className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Image */}
                <div className="px-4 mb-4">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 dark:bg-secondary">
                        {product.images?.[selectedImage] ? (
                            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                        )}

                        {/* Status Badge — top left */}
                        {statusBadge && (
                            <span className={`absolute top-3 left-3 ${statusBadge.color} text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1`}>
                                <span>🔥</span> {statusBadge.label}
                            </span>
                        )}

                        {/* Discount Badge — top right */}
                        {priceInfo.hasSale && priceInfo.discountPercent > 0 && (
                            <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                {priceInfo.discountPercent}% OFF
                            </span>
                        )}

                        {/* Out of stock overlay */}
                        {!priceInfo.inStock && (
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                <span className="bg-destructive text-destructive-foreground px-5 py-2.5 rounded-full font-bold">Out of Stock</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail dots / gallery */}
                    {product.images?.length > 1 && (
                        <div className="flex gap-2 justify-center mt-3">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary" : "border-transparent opacity-60"}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Product Info */}
                <div className="px-4 pb-4">
                    <h1 className="font-serif text-2xl font-bold text-foreground">{product.name}</h1>

                    {product.description && (
                        <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
                    )}

                    {/* Rating + Variant Label */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {reviews.length > 0 && (
                            <>
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-foreground">{avgRating}</span>
                                <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                            </>
                        )}
                        {variantLabel && reviews.length > 0 && (
                            <span className="text-muted-foreground/40">|</span>
                        )}
                        {variantLabel && (
                            <span className="text-muted-foreground text-sm">{variantLabel}</span>
                        )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2.5 mt-4">
                        <span className="text-3xl font-bold text-foreground">₹{priceInfo.price}</span>
                        {priceInfo.hasSale && priceInfo.originalPrice && (
                            <>
                                <span className="text-lg text-muted-foreground line-through">₹{priceInfo.originalPrice}</span>
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                    Save ₹{priceInfo.saveAmount}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Stock */}
                    <div className="mt-3">
                        {priceInfo.inStock ? (
                            <p className="text-sm text-muted-foreground">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                                In Stock ({priceInfo.stock} available)
                            </p>
                        ) : (
                            <p className="text-sm text-destructive">
                                <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-1.5"></span>
                                Out of Stock
                            </p>
                        )}
                    </div>

                    {/* Variation Types */}
                    {product.variationTypes?.length > 0 && (
                        <div className="space-y-4 mt-5">
                            {product.variationTypes.map((variationType) => (
                                <div key={variationType.name}>
                                    <h3 className="text-sm font-semibold text-foreground mb-2">
                                        {variationType.name}: <span className="text-primary">{selectedOptions[variationType.name]}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {variationType.options?.map((option) => {
                                            const isSelected = selectedOptions[variationType.name] === option;
                                            const isAvailable = isOptionAvailable(variationType.name, option);
                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => handleOptionSelect(variationType.name, option)}
                                                    disabled={!isAvailable && !isSelected}
                                                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : isAvailable
                                                            ? "border-border text-foreground hover:border-primary"
                                                            : "border-border text-muted-foreground line-through opacity-50 cursor-not-allowed"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mt-5">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Quantity</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors text-lg"
                            >
                                −
                            </button>
                            <span className="w-10 text-center font-semibold text-foreground">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(priceInfo.stock || 99, quantity + 1))}
                                disabled={quantity >= priceInfo.stock}
                                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-50 text-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Features Row */}
                    <div className="flex gap-4 mt-5 py-4 border-y border-border overflow-x-auto">
                        {[
                            { icon: Truck, label: "Free Shipping" },
                            { icon: Shield, label: "Quality Assured" },
                            { icon: RotateCcw, label: "Easy Returns" },
                            { icon: Leaf, label: "100% Natural" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-1.5 shrink-0">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pincode Check */}
                    <div className="mt-5 p-4 bg-muted/40 rounded-xl">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <span>📍</span> Check Delivery
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={pincode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setPincode(val);
                                    if (val.length < 6) setPincodeResult(null);
                                }}
                                placeholder="Enter 6-digit pincode"
                                maxLength={6}
                                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <button
                                onClick={async () => {
                                    if (pincode.length !== 6) return;
                                    setCheckingPincode(true);
                                    setPincodeResult(null);
                                    try {
                                        const res = await fetch('/api/shipping/serviceability', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ pincode })
                                        });
                                        const data = await res.json();
                                        setPincodeResult(data);
                                    } catch {
                                        setPincodeResult({ serviceable: false, error: true });
                                    } finally {
                                        setCheckingPincode(false);
                                    }
                                }}
                                disabled={pincode.length !== 6 || checkingPincode}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                            >
                                {checkingPincode ? '...' : 'Check'}
                            </button>
                        </div>
                        {pincodeResult && (
                            <div className={`mt-2 p-2.5 rounded-lg text-xs ${pincodeResult.serviceable ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                                {pincodeResult.serviceable ? (
                                    <span>✅ Delivery available{pincodeResult.estimatedDays ? ` • Est. ${pincodeResult.estimatedDays} days` : ""}</span>
                                ) : (
                                    <span>❌ Delivery not available to this pincode</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description & Reviews (collapsible on mobile) */}
                    <div className="mt-6">
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setActiveTab("description")}
                                className={`flex-1 py-3 text-sm font-medium text-center relative transition-colors ${activeTab === "description" ? "text-primary" : "text-muted-foreground"}`}
                            >
                                Description
                                {activeTab === "description" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`flex-1 py-3 text-sm font-medium text-center relative transition-colors ${activeTab === "reviews" ? "text-primary" : "text-muted-foreground"}`}
                            >
                                Reviews ({reviews.length})
                                {activeTab === "reviews" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                            </button>
                        </div>

                        {activeTab === "description" && (
                            <div className="py-4">
                                {product.long_description ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: product.long_description }}
                                        className="text-sm text-muted-foreground leading-relaxed break-words [&_img]:max-w-full [&_p]:mb-3"
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No detailed description available.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="py-4">
                                {canReview && !showReviewForm && (
                                    <button onClick={() => setShowReviewForm(true)} className="w-full py-2.5 mb-4 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors">
                                        Write a Review
                                    </button>
                                )}

                                {showReviewForm && (
                                    <form onSubmit={handleSubmitReview} className="bg-muted/40 rounded-xl p-4 mb-4">
                                        <div className="mb-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button key={star} type="button" onClick={() => setReviewStars(star)}
                                                        className={`text-2xl ${star <= reviewStars ? 'text-amber-500' : 'text-border'}`}>★</button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Share your experience..." rows={3} required
                                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <button type="submit" disabled={submittingReview || !reviewComment.trim()}
                                                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
                                                {submittingReview ? "Submitting..." : "Submit"}
                                            </button>
                                            <button type="button" onClick={() => setShowReviewForm(false)}
                                                className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.slice(0, 5).map(review => (
                                            <div key={review._id} className="bg-card rounded-xl p-4 border border-border">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                                        {review.user?.name?.[0] || 'U'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-foreground">{review.user?.name || 'Anonymous'}</p>
                                                        <div className="flex text-xs">{renderStars(review.stars)}</div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <h2 className="font-serif text-lg font-bold text-foreground mb-4">You May Also Like</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {relatedProducts.slice(0, 4).map(p => (
                                    <ProductCard key={p._id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Sticky Add to Cart */}
                <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-30">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <span className="text-xl font-bold text-foreground">₹{priceInfo.price * quantity}</span>
                            {quantity > 1 && <span className="text-xs text-muted-foreground ml-1">({quantity} items)</span>}
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={!priceInfo.inStock || addingToCart}
                            className="flex-1 bg-olive-700 dark:bg-primary hover:bg-olive-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-semibold rounded-xl py-3 text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {addingToCart ? "Adding..." : priceInfo.inStock ? "Add to Cart" : "Out of Stock"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ============ DESKTOP LAYOUT ============ */}
            <div className="hidden lg:block">
                <div className="container mx-auto px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-8">
                        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li>/</li>
                            <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
                            <li>/</li>
                            <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
                        </ol>
                    </nav>

                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Images */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-cream-100 dark:bg-secondary rounded-2xl overflow-hidden relative">
                                {product.images?.[selectedImage] ? (
                                    <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
                                )}
                                {statusBadge && (
                                    <span className={`absolute top-4 left-4 ${statusBadge.color} text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow flex items-center gap-1.5`}>
                                        🔥 {statusBadge.label}
                                    </span>
                                )}
                                {priceInfo.hasSale && priceInfo.discountPercent > 0 && (
                                    <span className="absolute top-4 right-4 bg-emerald-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow">
                                        {priceInfo.discountPercent}% OFF
                                    </span>
                                )}
                                {!priceInfo.inStock && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                        <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-full font-bold text-lg">Out of Stock</span>
                                    </div>
                                )}
                            </div>
                            {product.images?.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {product.images.map((img, i) => (
                                        <button key={i} onClick={() => setSelectedImage(i)}
                                            className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary" : "border-transparent hover:border-border"}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div>
                            {product.category && (
                                <Link href={`/products?category=${product.category._id}`}
                                    className="text-sm text-primary font-medium uppercase tracking-wide hover:underline">
                                    {product.category.name}
                                </Link>
                            )}
                            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mt-2">{product.name}</h1>

                            {product.description && (
                                <p className="text-muted-foreground mt-2">{product.description}</p>
                            )}

                            {/* Rating */}
                            {reviews.length > 0 && (
                                <div className="flex items-center gap-2 mt-3">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-foreground">{avgRating}</span>
                                    <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                                    {variantLabel && (
                                        <>
                                            <span className="text-muted-foreground/40">|</span>
                                            <span className="text-muted-foreground text-sm">{variantLabel}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-3 mt-5">
                                <span className="text-4xl font-bold text-foreground">₹{priceInfo.price}</span>
                                {priceInfo.hasSale && priceInfo.originalPrice && (
                                    <>
                                        <span className="text-xl text-muted-foreground line-through">₹{priceInfo.originalPrice}</span>
                                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                                            Save ₹{priceInfo.saveAmount}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="mt-3 mb-6">
                                {priceInfo.inStock ? (
                                    <p className="text-sm text-muted-foreground">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        In Stock ({priceInfo.stock} available)
                                    </p>
                                ) : (
                                    <p className="text-sm text-destructive">
                                        <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                                        Out of Stock
                                    </p>
                                )}
                            </div>

                            {/* Variations */}
                            {product.variationTypes?.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    {product.variationTypes.map((variationType) => (
                                        <div key={variationType.name}>
                                            <h3 className="font-medium text-foreground mb-3">
                                                {variationType.name}: <span className="text-primary">{selectedOptions[variationType.name]}</span>
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variationType.options?.map((option) => {
                                                    const isSelected = selectedOptions[variationType.name] === option;
                                                    const isAvailable = isOptionAvailable(variationType.name, option);
                                                    return (
                                                        <button key={option} onClick={() => handleOptionSelect(variationType.name, option)}
                                                            disabled={!isAvailable && !isSelected}
                                                            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : isAvailable ? "border-border text-foreground hover:border-primary"
                                                                    : "border-border text-muted-foreground line-through opacity-50 cursor-not-allowed"}`}>
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-6">
                                <h3 className="font-medium text-foreground mb-3">Quantity</h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">−</button>
                                    <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                                    <button onClick={() => setQuantity(Math.min(priceInfo.stock || 99, quantity + 1))}
                                        disabled={quantity >= priceInfo.stock}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">+</button>
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <div className="flex gap-4">
                                <Button onClick={handleAddToCart} disabled={!priceInfo.inStock || addingToCart}
                                    className="flex-1 bg-olive-700 dark:bg-primary hover:bg-olive-800 dark:hover:bg-primary/90 text-white dark:text-primary-foreground rounded-full py-6 text-base font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {addingToCart ? "Adding..." : priceInfo.inStock ? `Add to Cart — ₹${priceInfo.price * quantity}` : "Out of Stock"}
                                </Button>
                                <Button variant="outline" className="px-6 py-6 border-2 border-border text-foreground hover:bg-muted rounded-full">
                                    <Heart className="w-5 h-5" />
                                </Button>
                                <Button variant="outline" onClick={handleShare} className="px-6 py-6 border-2 border-border text-foreground hover:bg-muted rounded-full">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Pincode Check */}
                            <div className="mt-6 p-4 bg-muted/40 rounded-xl">
                                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                    <span>📍</span> Check Delivery
                                </h3>
                                <div className="flex gap-2">
                                    <input type="text" value={pincode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setPincode(val);
                                            if (val.length < 6) setPincodeResult(null);
                                        }}
                                        placeholder="Enter 6-digit pincode" maxLength={6}
                                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <button
                                        onClick={async () => {
                                            if (pincode.length !== 6) return;
                                            setCheckingPincode(true); setPincodeResult(null);
                                            try {
                                                const res = await fetch('/api/shipping/serviceability', {
                                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ pincode })
                                                });
                                                setPincodeResult(await res.json());
                                            } catch { setPincodeResult({ serviceable: false, error: true }); }
                                            finally { setCheckingPincode(false); }
                                        }}
                                        disabled={pincode.length !== 6 || checkingPincode}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50">
                                        {checkingPincode ? 'Checking...' : 'Check'}
                                    </button>
                                </div>
                                {pincodeResult && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm ${pincodeResult.serviceable ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                                        {pincodeResult.serviceable
                                            ? <span>✅ Delivery available to {pincode}{pincodeResult.estimatedDays ? ` • Est. ${pincodeResult.estimatedDays} days` : ""}</span>
                                            : <span>❌ Delivery not available to this pincode</span>}
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div className="mt-6 grid grid-cols-4 gap-4">
                                {[
                                    { icon: Truck, label: "Free Shipping" },
                                    { icon: Shield, label: "Quality Assured" },
                                    { icon: RotateCcw, label: "Easy Returns" },
                                    { icon: Leaf, label: "100% Natural" },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex flex-col items-center gap-2 text-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description & Reviews Tabs */}
                    <section className="mt-16 pt-12 border-t border-border">
                        <div className="flex border-b border-border mb-8">
                            <button onClick={() => setActiveTab("description")}
                                className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "description" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                Description
                                {activeTab === "description" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                            </button>
                            <button onClick={() => setActiveTab("reviews")}
                                className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "reviews" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                Reviews ({reviews.length})
                                {activeTab === "reviews" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                            </button>
                        </div>

                        {activeTab === "description" && (
                            <div className="prose prose-neutral dark:prose-invert max-w-none overflow-hidden">
                                {product.long_description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.long_description }}
                                        className="text-muted-foreground leading-relaxed break-words overflow-x-auto whitespace-pre-line [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&_p]:mb-4 [&_br]:block [&_br]:content-[''] [&_br]:mb-2" />
                                ) : (
                                    <div className="text-center py-12 bg-muted/30 rounded-2xl">
                                        <p className="text-4xl mb-3">📝</p>
                                        <p className="text-muted-foreground">No detailed description available.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="font-serif text-2xl font-bold text-foreground">
                                        Customer Reviews ({avgRating}⭐)
                                    </h2>
                                    {canReview && !showReviewForm && (
                                        <Button onClick={() => setShowReviewForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                            Write a Review
                                        </Button>
                                    )}
                                </div>

                                {showReviewForm && (
                                    <form onSubmit={handleSubmitReview} className="bg-muted/50 rounded-2xl p-6 mb-8">
                                        <h3 className="font-semibold text-foreground mb-4">Write Your Review</h3>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button key={star} type="button" onClick={() => setReviewStars(star)}
                                                        className={`text-2xl transition-colors ${star <= reviewStars ? 'text-amber-500' : 'text-border'}`}>★</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-foreground mb-2">Comment</label>
                                            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Share your experience..." rows={4} required
                                                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button type="submit" disabled={submittingReview || !reviewComment.trim()}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="rounded-full">Cancel</Button>
                                        </div>
                                    </form>
                                )}

                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.slice(0, 5).map(review => (
                                            <div key={review._id} className="bg-card rounded-xl p-6 border border-border">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                            {review.user?.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{review.user?.name || 'Anonymous'}</p>
                                                            <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex text-lg">{renderStars(review.stars)}</div>
                                                </div>
                                                <p className="text-muted-foreground">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-muted/30 rounded-2xl">
                                        <p className="text-4xl mb-3">⭐</p>
                                        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-16 pt-12 border-t border-border">
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Related Products</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p._id} product={p} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
