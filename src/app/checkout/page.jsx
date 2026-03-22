"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { MapPin, CreditCard, FileText, Tag, ChevronDown, ChevronUp, Plus, Truck } from "lucide-react";

export default function CheckoutPage() {
    const { isAuthenticated, user, loading: userLoading } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [cart, setCart] = useState(null);
    const [settings, setSettings] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    // Coupon state
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Shipping fee state
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingMessage, setShippingMessage] = useState("");
    const [isFreeShipping, setIsFreeShipping] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        paymentMethod: "cod",
        notes: ""
    });

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, userLoading]);

    const fetchData = async () => {
        try {
            const [cartRes, settingsRes, addressesRes, couponsRes] = await Promise.all([
                fetch("/api/cart", { credentials: "include" }),
                fetch("/api/settings", { credentials: "include" }),
                fetch("/api/addresses", { credentials: "include" }),
                fetch("/api/coupons", { credentials: "include" })
            ]);

            const [cartData, settingsData, addressesData, couponsData] = await Promise.all([
                cartRes.json(),
                settingsRes.json(),
                addressesRes.json(),
                couponsRes.json()
            ]);

            if (cartData.success) {
                setCart(cartData.cart);
                if (cartData.cart.items.length === 0) {
                    router.push("/cart");
                }
            }

            if (settingsData.success) {
                setSettings(settingsData._fullSettings);
                if (settingsData._fullSettings.payment.cod.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "cod" }));
                } else if (settingsData._fullSettings.payment.razorpay.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "razorpay" }));
                } else if (settingsData._fullSettings.payment.stripe.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "stripe" }));
                }
            }

            if (addressesData.success && addressesData.addresses.length > 0) {
                setAddresses(addressesData.addresses);
                const defaultAddr = addressesData.addresses.find(a => a.isDefault) || addressesData.addresses[0];
                setSelectedAddressId(defaultAddr._id);
                setFormData(prev => ({
                    ...prev,
                    fullName: defaultAddr.fullName,
                    phone: defaultAddr.phone,
                    addressLine1: defaultAddr.addressLine1,
                    addressLine2: defaultAddr.addressLine2 || "",
                    city: defaultAddr.city,
                    state: defaultAddr.state,
                    pincode: defaultAddr.pincode,
                    country: defaultAddr.country
                }));
            } else {
                setUseNewAddress(true);
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: user.name || "",
                        phone: user.phone || ""
                    }));
                }
            }

            if (couponsData.success) {
                setAvailableCoupons(couponsData.coupons || []);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShippingRates = async (pincode, cartTotal) => {
        if (!pincode || pincode.length !== 6) return;
        try {
            const res = await fetch("/api/shipping/rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode, cartTotal })
            });
            const data = await res.json();
            if (data.success) {
                setShippingFee(data.fee || 0);
                setIsFreeShipping(data.isFree || false);
                setShippingMessage(data.message || "");
            }
        } catch (error) {
            console.error("Failed to fetch shipping rates:", error);
        }
    };

    useEffect(() => {
        if (formData.pincode && cart?.total) {
            const cartTotal = cart.total - discountAmount;
            fetchShippingRates(formData.pincode, cartTotal);
        }
    }, [formData.pincode, cart?.total, discountAmount]);

    const handleAddressSelect = (addressId) => {
        setSelectedAddressId(addressId);
        setUseNewAddress(false);
        const address = addresses.find(a => a._id === addressId);
        if (address) {
            setFormData(prev => ({
                ...prev,
                fullName: address.fullName,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || "",
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country
            }));
        }
    };

    const handleApplyCoupon = async (code = couponCode) => {
        if (!code.trim()) return;
        setApplyingCoupon(true);
        setCouponError("");
        try {
            const cartItems = cart.items.map(item => ({
                productId: item.product._id,
                product: item.product,
                quantity: item.quantity,
                priceAtOrder: item.variant?.price || (item.subtotal / item.quantity) || 0
            }));

            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    code: code.trim(),
                    cartItems,
                    cartTotal: cart.total
                })
            });

            const data = await res.json();
            if (data.success) {
                setAppliedCoupon(data.coupon);
                setDiscountAmount(data.discountAmount);
                setCouponCode(data.coupon.code);
                setCouponError("");
            } else {
                setCouponError(data.message || "Invalid coupon");
                setAppliedCoupon(null);
                setDiscountAmount(0);
            }
        } catch (error) {
            console.error("Apply coupon error:", error);
            setCouponError("Failed to apply coupon");
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode("");
        setCouponError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            if (saveAddress && useNewAddress) {
                await fetch("/api/addresses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        label: "Home",
                        fullName: formData.fullName,
                        phone: formData.phone,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        country: formData.country,
                        isDefault: addresses.length === 0
                    })
                });
            }

            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    shippingAddress: {
                        fullName: formData.fullName,
                        phone: formData.phone,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        country: formData.country
                    },
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes,
                    couponCode: appliedCoupon?.code || "",
                    shippingFee: shippingFee
                }),
            });

            const orderData = await orderRes.json();
            if (!orderData.success) {
                toast.error(orderData.message || "Failed to create order");
                setSubmitting(false);
                return;
            }

            const order = orderData.order;

            if (formData.paymentMethod === "cod") {
                toast.success("Order placed successfully!");
                router.push(`/orders/${order._id}`);
            } else if (formData.paymentMethod === "razorpay") {
                await handleRazorpayPayment(order);
            } else if (formData.paymentMethod === "stripe") {
                await handleStripePayment(order);
            }
        } catch (error) {
            console.error("Order error:", error);
            toast.error("Failed to place order");
            setSubmitting(false);
        }
    };

    const handleRazorpayPayment = async (order) => {
        try {
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId: order._id })
            });

            const data = await res.json();
            if (!data.success) {
                toast.error(data.message || "Failed to initiate payment");
                setSubmitting(false);
                return;
            }

            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => { script.onload = resolve; });
            }

            const options = {
                key: data.keyId,
                amount: data.amount * 100,
                currency: data.currency,
                name: data.name,
                description: `Order #${order._id}`,
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    const verifyRes = await fetch("/api/payment/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            orderId: order._id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        toast.success("Payment successful!");
                        router.push(`/orders/${order._id}`);
                    } else {
                        toast.error("Payment verification failed!");
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.error("Payment cancelled");
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: formData.fullName,
                    contact: formData.phone,
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Razorpay error:", error);
            toast.error("Payment failed");
            setSubmitting(false);
        }
    };

    const handleStripePayment = async () => {
        toast.error("Stripe payment integration is pending. Please use COD or Razorpay for now.");
        setSubmitting(false);
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const availablePayments = [];
    if (settings?.payment.cod.isEnabled) availablePayments.push({ value: "cod", label: "Cash on Delivery", icon: "💵" });
    if (settings?.payment.razorpay.isEnabled) availablePayments.push({ value: "razorpay", label: "Razorpay", icon: "💳" });
    if (settings?.payment.stripe.isEnabled) availablePayments.push({ value: "stripe", label: "Stripe", icon: "💳" });

    const finalTotal = cart?.total - discountAmount;

    const inputClass = "w-full px-4 py-3 bg-muted/50 dark:bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm";

    return (
        <div className="min-h-screen bg-[#fdfbf7] dark:bg-background pb-28 lg:pb-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-4 lg:mb-8">
                    <h1 className="font-serif text-2xl lg:text-4xl font-bold text-foreground">
                        Checkout
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {cart?.itemCount || 0} item{(cart?.itemCount || 0) !== 1 ? "s" : ""} — ₹{cart?.total}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                        {/* Left Column - Form Sections */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Shipping Address */}
                            <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <h2 className="font-serif text-lg lg:text-2xl font-bold">Shipping Address</h2>
                                    </div>
                                    {addresses.length > 0 && (
                                        <Link href="/account/addresses" className="text-primary text-xs lg:text-sm hover:underline">
                                            Manage
                                        </Link>
                                    )}
                                </div>

                                {/* Saved Addresses */}
                                {addresses.length > 0 && !useNewAddress && (
                                    <div className="space-y-2 mb-3">
                                        {addresses.map((address) => (
                                            <label
                                                key={address._id}
                                                className={`block p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === address._id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/30'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="address"
                                                        checked={selectedAddressId === address._id}
                                                        onChange={() => handleAddressSelect(address._id)}
                                                        className="mt-0.5 accent-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-semibold text-sm">{address.label}</span>
                                                            {address.isDefault && (
                                                                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-foreground">{address.fullName} &middot; {address.phone}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUseNewAddress(true);
                                                setSelectedAddressId(null);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    fullName: user?.name || "",
                                                    phone: user?.phone || "",
                                                    addressLine1: "", addressLine2: "",
                                                    city: "", state: "", pincode: "",
                                                    country: "India"
                                                }));
                                            }}
                                            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-primary text-sm font-medium transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add New Address
                                        </button>
                                    </div>
                                )}

                                {/* New Address Form */}
                                {(useNewAddress || addresses.length === 0) && (
                                    <>
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseNewAddress(false);
                                                    if (addresses.length > 0) handleAddressSelect(addresses[0]._id);
                                                }}
                                                className="mb-3 text-primary text-sm hover:underline"
                                            >
                                                ← Use Saved Address
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name *</label>
                                                <input type="text" required value={formData.fullName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                    className={inputClass} placeholder="John Doe" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number *</label>
                                                <input type="tel" required value={formData.phone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    className={inputClass} placeholder="+91 98765 43210" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 1 *</label>
                                                <input type="text" required value={formData.addressLine1}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                                                    className={inputClass} placeholder="House no., Building, Street" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address Line 2</label>
                                                <input type="text" value={formData.addressLine2}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                                                    className={inputClass} placeholder="Locality, Landmark" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">City *</label>
                                                <input type="text" required value={formData.city}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                    className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">State *</label>
                                                <input type="text" required value={formData.state}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                                    className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pincode *</label>
                                                <input type="text" required value={formData.pincode}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                                                    className={inputClass} placeholder="110001" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Country *</label>
                                                <input type="text" required value={formData.country}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                                    className={inputClass} />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer mt-3">
                                            <input type="checkbox" checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                className="w-4 h-4 accent-primary rounded" />
                                            <span className="text-sm text-muted-foreground">Save this address for future orders</span>
                                        </label>
                                    </>
                                )}
                            </div>

                            {/* Coupon Code */}
                            <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-sm border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-5 h-5 text-primary" />
                                    <h2 className="font-serif text-lg lg:text-2xl font-bold">Discount Code</h2>
                                </div>

                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-primary/10 rounded-xl p-3">
                                        <div>
                                            <p className="font-mono font-bold text-primary text-sm">{appliedCoupon.code}</p>
                                            <p className="text-xs text-muted-foreground">{appliedCoupon.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary text-sm">-₹{discountAmount}</p>
                                            <button type="button" onClick={handleRemoveCoupon}
                                                className="text-xs text-destructive hover:underline">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <input type="text" value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className={`${inputClass} flex-1 font-mono`} />
                                            <button type="button" onClick={() => handleApplyCoupon()}
                                                disabled={applyingCoupon || !couponCode.trim()}
                                                className="px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                                                {applyingCoupon ? "..." : "Apply"}
                                            </button>
                                        </div>
                                        {couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
                                    </>
                                )}

                                {availableCoupons.length > 0 && !appliedCoupon && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Available Coupons</p>
                                        <div className="space-y-2">
                                            {availableCoupons.map(coupon => (
                                                <button key={coupon._id} type="button"
                                                    onClick={() => { setCouponCode(coupon.code); handleApplyCoupon(coupon.code); }}
                                                    className="w-full text-left p-3 bg-muted/40 dark:bg-secondary/30 rounded-xl hover:bg-muted transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-mono font-bold text-primary text-xs">{coupon.code}</p>
                                                            <p className="text-xs text-muted-foreground">{coupon.description}</p>
                                                        </div>
                                                    </div>
                                                    {coupon.minPurchase > 0 && (
                                                        <p className="text-[10px] text-muted-foreground mt-1">Min. order: ₹{coupon.minPurchase}</p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-sm border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    <h2 className="font-serif text-lg lg:text-2xl font-bold">Payment</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availablePayments.map((payment) => (
                                        <label key={payment.value}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === payment.value
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/30'
                                                }`}>
                                            <input type="radio" name="paymentMethod" value={payment.value}
                                                checked={formData.paymentMethod === payment.value}
                                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                className="accent-primary" />
                                            <span className="text-lg">{payment.icon}</span>
                                            <span className="font-medium text-sm">{payment.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {availablePayments.length === 0 && (
                                    <p className="text-destructive text-sm">No payment methods available. Please contact support.</p>
                                )}
                            </div>

                            {/* Order Notes */}
                            <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-sm border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h2 className="font-serif text-lg lg:text-2xl font-bold">Notes</h2>
                                    <span className="text-xs text-muted-foreground">(Optional)</span>
                                </div>
                                <textarea value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={2} maxLength={500}
                                    placeholder="Any special instructions..."
                                    className={`${inputClass} resize-none`} />
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            {/* Desktop Summary */}
                            <div className="hidden lg:block bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-28">
                                <h2 className="font-serif text-2xl font-bold mb-4">Order Summary</h2>

                                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                    {cart?.items.map((item) => (
                                        <div key={item._id} className="flex items-center gap-3 py-2">
                                            {item.product.images?.[0] && (
                                                <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-sm font-semibold shrink-0">₹{item.subtotal}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₹{cart?.total}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-primary">
                                            <span>Discount ({appliedCoupon?.code})</span>
                                            <span>-₹{discountAmount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Truck className="w-3.5 h-3.5" /> Shipping
                                        </span>
                                        {isFreeShipping ? (
                                            <span className="text-primary font-medium">Free</span>
                                        ) : shippingFee > 0 ? (
                                            <span>₹{shippingFee}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Enter pincode</span>
                                        )}
                                    </div>
                                    {shippingMessage && <p className="text-xs text-primary">{shippingMessage}</p>}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                        <span>Total</span>
                                        <span>₹{finalTotal + shippingFee}</span>
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting || availablePayments.length === 0}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-5">
                                    {submitting ? "Placing Order..." : `Place Order — ₹${finalTotal + shippingFee}`}
                                </button>
                            </div>

                            {/* Mobile Fixed Bottom Bar */}
                            <div className="lg:hidden fixed bottom-17.5 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                                {/* Expandable order details */}
                                {showOrderDetails && (
                                    <div className="px-4 pt-3 pb-2 border-b border-border bg-muted/30 max-h-48 overflow-y-auto">
                                        {cart?.items.map((item) => (
                                            <div key={item._id} className="flex items-center justify-between py-1.5">
                                                <span className="text-xs text-muted-foreground line-clamp-1 flex-1 mr-2">
                                                    {item.product.name} × {item.quantity}
                                                </span>
                                                <span className="text-xs font-medium shrink-0">₹{item.subtotal}</span>
                                            </div>
                                        ))}
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between py-1 text-xs text-primary border-t border-border mt-1 pt-1">
                                                <span>Discount</span>
                                                <span>-₹{discountAmount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-1 text-xs border-t border-border mt-1 pt-1">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span>{isFreeShipping ? "Free" : shippingFee > 0 ? `₹${shippingFee}` : "TBD"}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <button type="button" onClick={() => setShowOrderDetails(!showOrderDetails)}
                                                className="flex items-center gap-1 text-xs text-primary mb-0.5">
                                                {showOrderDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                                {showOrderDetails ? "Hide" : "View"} details
                                            </button>
                                            <p className="text-xl font-bold text-foreground">₹{finalTotal + shippingFee}</p>
                                        </div>
                                        <button type="submit" disabled={submitting || availablePayments.length === 0}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {submitting ? "Placing..." : "Place Order"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
