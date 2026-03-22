"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard from "@/app/components/ProductCard";
import { Search, SlidersHorizontal, Grid3X3, List, ChevronDown, X, ArrowLeft, ShoppingBag } from "lucide-react";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const categoryScrollRef = useRef(null);

    // Filters
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("newest");
    const [viewMode, setViewMode] = useState("grid");
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                sort,
            });

            if (search) params.set("search", search);
            if (selectedCategory) params.set("category", selectedCategory);
            if (minPrice) params.set("minPrice", minPrice);
            if (maxPrice) params.set("maxPrice", maxPrice);

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.products);
                setCategories(data.categories);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, minPrice, maxPrice, sort]);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(1);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setMinPrice("");
        setMaxPrice("");
        setSort("newest");
    };

    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price-low", label: "Price: Low to High" },
        { value: "price-high", label: "Price: High to Low" },
        { value: "name-asc", label: "Name: A to Z" },
        { value: "name-desc", label: "Name: Z to A" },
    ];

    return (
        <main className="min-h-screen bg-[#fdfbf7] dark:bg-background lg:bg-background">

            {/* === MOBILE LAYOUT === */}
            <div className="lg:hidden">
                {/* Mobile Sticky Toolbar (Categories) - Sticks below fixed navbar (72px) */}
                <div className="sticky top-[72px] z-30 bg-[#fdfbf7] dark:bg-background pb-3 pt-4">

                    {/* Mobile Category Pills - Horizontal Scroll */}
                    <div
                        ref={categoryScrollRef}
                        className="flex gap-3 px-4 pt-2 pb-4 overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
                    >
                        <button
                            onClick={() => setSelectedCategory("")}
                            className={`shrink-0 px-5 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                                selectedCategory === ""
                                    ? "bg-[#6b7b5c] text-white shadow-sm"
                                    : "bg-[#fcf6eb] dark:bg-secondary/60 text-[#4a553c] dark:text-foreground hover:bg-[#f3eedd] dark:hover:bg-secondary"
                            }`}
                        >
                            All Products
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat._id}
                                onClick={() => setSelectedCategory(cat._id)}
                                className={`shrink-0 px-5 py-2.5 rounded-full text-[15px] font-medium transition-colors ${
                                    selectedCategory === cat._id
                                        ? "bg-[#6b7b5c] text-white shadow-sm"
                                        : "bg-[#fcf6eb] dark:bg-secondary/60 text-[#4a553c] dark:text-foreground hover:bg-[#f3eedd] dark:hover:bg-secondary"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Toolbar: count + filter + view */}
                <div className="flex items-center justify-between px-4 py-5 mb-2">
                    <p className="text-muted-foreground text-[15px]">
                        {pagination.total} product{pagination.total !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary rounded-full shadow-sm border border-border/50 text-[15px] font-medium text-foreground"
                        >
                            <SlidersHorizontal className="w-[15px] h-[15px] text-muted-foreground" />
                            Filter
                        </button>
                        <div className="flex items-center bg-white dark:bg-secondary rounded-full shadow-sm border border-border/50 p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-full transition-colors ${
                                    viewMode === "grid"
                                        ? "bg-[#e8ece1] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary"
                                        : "text-muted-foreground"
                                }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded-full transition-colors ${
                                    viewMode === "list"
                                        ? "bg-[#e8ece1] dark:bg-primary/20 text-[#6b7b5c] dark:text-primary"
                                        : "text-muted-foreground"
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Products */}
                <div className="px-4 pb-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="font-serif text-xl font-bold text-foreground mb-2">No products found</h3>
                            <p className="text-sm text-muted-foreground mb-5">Try adjusting your filters</p>
                            <button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-5 py-2 text-sm transition-colors">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product} viewMode={viewMode} />
                                ))}
                            </div>

                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => fetchProducts(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-sm text-muted-foreground">
                                        {pagination.page} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => fetchProducts(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-3 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Filter Bottom Sheet */}
                {showMobileFilters && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto">
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-border" />
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="font-serif text-lg font-bold text-foreground">Filters</h3>
                                    <button onClick={() => setShowMobileFilters(false)}>
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Sort */}
                                <div className="mb-5">
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Sort By</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {sortOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSort(opt.value)}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                                    sort === opt.value
                                                        ? "bg-olive-700 dark:bg-primary text-white dark:text-primary-foreground border-olive-700 dark:border-primary"
                                                        : "bg-background text-foreground border-border hover:bg-muted"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="mb-5">
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Price Range</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            placeholder="Min ₹"
                                            min="0"
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            placeholder="Max ₹"
                                            min="0"
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {(selectedCategory || minPrice || maxPrice || sort !== "newest") && (
                                        <button
                                            onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                                            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowMobileFilters(false)}
                                        className="flex-1 py-3 rounded-xl bg-olive-700 dark:bg-primary text-white dark:text-primary-foreground text-sm font-semibold transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* === DESKTOP LAYOUT === */}
            <div className="hidden lg:block">
                {/* Desktop Header */}
                <section className="border-b border-border bg-background">
                    <div className="container mx-auto px-8 py-8">
                        <div className="flex items-end justify-between">
                            <div>
                                <h1 className="font-serif text-4xl font-bold text-foreground">
                                    All Products
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <form onSubmit={handleSearch} className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search products..."
                                        className="pl-9 pr-4 py-2.5 w-60 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </form>

                                <div className="relative">
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all"
                                    >
                                        {sortOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>

                                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2.5 transition-colors ${
                                            viewMode === "grid"
                                                ? "bg-foreground text-background"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-2.5 transition-colors ${
                                            viewMode === "list"
                                                ? "bg-foreground text-background"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-8 py-10">
                    <div className="flex gap-8">
                        {/* Desktop Sidebar */}
                        <aside className="w-64 shrink-0">
                            <div className="sticky top-28">
                                <div className="mb-8">
                                    <h3 className="font-serif text-lg font-bold text-foreground mb-4">Categories</h3>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setSelectedCategory("")}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                selectedCategory === ""
                                                    ? "bg-olive-100 dark:bg-primary/15 text-olive-800 dark:text-primary"
                                                    : "text-foreground hover:bg-muted/60"
                                            }`}
                                        >
                                            <span>All Products</span>
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat._id}
                                                onClick={() => setSelectedCategory(cat._id)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                    selectedCategory === cat._id
                                                        ? "bg-olive-100 dark:bg-primary/15 text-olive-800 dark:text-primary"
                                                        : "text-foreground hover:bg-muted/60"
                                                }`}
                                            >
                                                <span>{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-serif text-lg font-bold text-foreground mb-4">Price Range</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            placeholder="Min"
                                            min="0"
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                                        />
                                        <input
                                            type="number"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            placeholder="Max"
                                            min="0"
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
                                        />
                                    </div>
                                </div>

                                {(selectedCategory || minPrice || maxPrice || search) && (
                                    <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </aside>

                        {/* Desktop Products */}
                        <div className="flex-1 min-w-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="font-serif text-2xl font-bold text-foreground mb-2">No products found</h3>
                                    <p className="text-muted-foreground mb-6">Try adjusting your filters or search term</p>
                                    <button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-6 py-2.5 transition-colors">
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={viewMode === "grid" ? "grid grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-4"}>
                                        {products.map((product) => (
                                            <ProductCard key={product._id} product={product} viewMode={viewMode} />
                                        ))}
                                    </div>

                                    {pagination.pages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-12">
                                            <button
                                                onClick={() => fetchProducts(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <div className="flex gap-1">
                                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                                    let pageNum;
                                                    if (pagination.pages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.page <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.page >= pagination.pages - 2) {
                                                        pageNum = pagination.pages - 4 + i;
                                                    } else {
                                                        pageNum = pagination.page - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => fetchProducts(pageNum)}
                                                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                                                                pagination.page === pageNum
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "border border-border text-foreground hover:bg-muted"
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => fetchProducts(pagination.page + 1)}
                                                disabled={pagination.page === pagination.pages}
                                                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
