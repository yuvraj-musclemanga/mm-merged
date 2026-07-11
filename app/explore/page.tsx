"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/features/ProductCard";
import { H1, H3 } from "@/components/ui/Typography";
import { FiFilter, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function ExplorePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [collectionFilter, setCollectionFilter] = useState("All");
    const [sizeFilter, setSizeFilter] = useState("All");
    const [colorFilter, setColorFilter] = useState("All");
    const [dropFilter, setDropFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    // Available Filter Options
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [collections, setCollections] = useState<string[]>(["All"]);
    const [drops, setDrops] = useState<string[]>(["All"]);
    const sizes = ["All", "XS", "S", "M", "L", "XL", "XXL"];
    const [colors, setColors] = useState<string[]>(["All"]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 12;

    // Mobile Modal State
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    // Fetch reliability: track abort controller and request generation
    // so stale responses from superseded requests never update state.
    const [fetchError, setFetchError] = useState(false);
    const fetchControllerRef = useRef<AbortController | null>(null);
    const fetchGenerationRef = useRef(0);

    useEffect(() => {
        fetchProducts();
    }, [categoryFilter, collectionFilter, sizeFilter, colorFilter, dropFilter, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, collectionFilter, sizeFilter, colorFilter, dropFilter, sortBy]);

    const paginatedProducts = products.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalPages = Math.ceil(products.length / rowsPerPage);

    async function fetchMetadata() {
        // These values do not depend on the selected filters. Loading them on
        // every filter change caused four extra database requests per change.
        const [catsResult, collsResult, colorsResult, dropsResult] = await Promise.all([
            supabase.from('categories').select('name'),
            supabase.from('collections').select('name'),
            supabase.from('product_variants').select('color'),
            supabase.from('products').select('drop'),
        ]);
        const { data: cats } = catsResult;
        const { data: colls } = collsResult;
        const { data: vColors } = colorsResult;
        const { data: prodDrops } = dropsResult;

        if (cats) setCategories(["All", ...cats.map(c => c.name)]);
        if (colls) setCollections(["All", ...colls.map(c => c.name)]);
        if (vColors) {
            const uniqueColors = Array.from(new Set(vColors.map(v => v.color)));
            setColors(["All", ...uniqueColors]);
        }
        if (prodDrops) {
            const uniqueDrops = Array.from(new Set(prodDrops.map(p => p.drop).filter(Boolean)));
            setDrops(["All", ...uniqueDrops]);
        }
    }

    useEffect(() => {
        void fetchMetadata();
    }, []);

    async function fetchProducts(attempt = 1) {
        // ── Abort any in-flight request ──────────────────────────────────
        if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
        }
        // Stamp this invocation so we can discard results from stale calls
        fetchGenerationRef.current += 1;
        const myGeneration = fetchGenerationRef.current;

        const controller = new AbortController();
        fetchControllerRef.current = controller;

        setIsLoading(true);
        setFetchError(false);

        try {
            const selectStr = `
                *,
                categories${categoryFilter !== "All" ? "!inner" : ""}(name),
                collections${collectionFilter !== "All" ? "!inner" : ""}(name),
                product_variants(
                    id,
                    sku,
                    price,
                    size,
                    color,
                    inventory(quantity_available)
                ),
                product_images(image_url)
            `;

            let query = supabase.from('products').select(selectStr);
            if (categoryFilter !== "All") query = query.eq('categories.name', categoryFilter);
            if (collectionFilter !== "All") query = query.eq('collections.name', collectionFilter);
            if (dropFilter !== "All") query = query.eq('drop', dropFilter);
            if (sortBy === "newest") query = query.order('created_at', { ascending: false });

            // Abort the actual Supabase request, not just the UI promise.
            // The shared client timeout is a second line of defence.
            const timeout = setTimeout(() => controller.abort(), 8_000);
            const { data, error } = await query.abortSignal(controller.signal);
            clearTimeout(timeout);

            // A newer request has started — discard these results.
            if (myGeneration !== fetchGenerationRef.current) return;

            if (error) throw error;

            if (data) {
                const processedProducts = (data as any[]).map(p => {
                    let variants = p.product_variants || [];
                    if (sizeFilter !== "All") variants = variants.filter((v: any) => v.size === sizeFilter);
                    if (colorFilter !== "All") variants = variants.filter((v: any) => v.color === colorFilter);
                    if (variants.length === 0 && (sizeFilter !== "All" || colorFilter !== "All")) return null;

                    const sortedPrice = variants.length > 0
                        ? variants.map((v: any) => v.price).sort((a: any, b: any) => a - b)
                        : [0];
                    const minPrice = sortedPrice[0];
                    const availableSizes = Array.from(new Set(variants.map((v: any) => v.size)));

                    return {
                        ...p,
                        minPrice,
                        primaryImage: p.product_images?.[0]?.image_url || "/placeholder-image.jpg",
                        availableSizes,
                        variants
                    };
                }).filter(p => p !== null);

                let finalProducts = processedProducts;
                if (sortBy === "price_low") finalProducts.sort((a, b) => a.minPrice - b.minPrice);
                if (sortBy === "price_high") finalProducts.sort((a, b) => b.minPrice - a.minPrice);
                setProducts(finalProducts);
            }
        } catch (err: any) {
            // A newer request already started — discard this error.
            if (myGeneration !== fetchGenerationRef.current) return;

            if (attempt < 2) {
                // Auto-retry once after 1.5 seconds before showing error to user.
                console.warn(`Fetch attempt ${attempt} failed, retrying...`, err.message);
                await new Promise(resolve => setTimeout(resolve, 1500));
                if (myGeneration !== fetchGenerationRef.current) return;
                return fetchProducts(attempt + 1);
            }

            console.error("Error fetching products (all attempts failed):", err);
            setFetchError(true);
        } finally {
            if (myGeneration === fetchGenerationRef.current) {
                setIsLoading(false);
            }
        }
    }

    const FilterOptions = () => (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Sort By</label>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-transparent border-b border-white/20 pb-2 text-sm font-bold uppercase tracking-wider outline-none focus:border-white transition-colors cursor-pointer appearance-none"
                >
                    <option value="newest" className="bg-background-dark">Newest First</option>
                    <option value="price_low" className="bg-background-dark">Price: Low to High</option>
                    <option value="price_high" className="bg-background-dark">Price: High to Low</option>
                </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Category</label>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-transparent border-b border-white/20 pb-2 text-sm font-bold uppercase tracking-wider outline-none focus:border-white transition-colors cursor-pointer appearance-none"
                >
                    {categories.map(c => <option key={c} className="bg-background-dark">{c}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Collection</label>
                <select
                    value={collectionFilter}
                    onChange={e => setCollectionFilter(e.target.value)}
                    className="bg-transparent border-b border-white/20 pb-2 text-sm font-bold uppercase tracking-wider outline-none focus:border-white transition-colors cursor-pointer appearance-none"
                >
                    {collections.map(c => <option key={c} className="bg-background-dark">{c}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Drop</label>
                <select
                    value={dropFilter}
                    onChange={e => setDropFilter(e.target.value)}
                    className="bg-transparent border-b border-white/20 pb-2 text-sm font-bold uppercase tracking-wider outline-none focus:border-white transition-colors cursor-pointer appearance-none"
                >
                    {drops.map(d => <option key={d} className="bg-background-dark">{d}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Size</label>
                <div className="grid grid-cols-4 gap-2">
                    {sizes.map(s => (
                        <button
                            key={s}
                            onClick={() => setSizeFilter(s)}
                            className={`py-2 text-[10px] uppercase font-bold tracking-widest border transition-all ${sizeFilter === s ? 'border-white bg-white text-black' : 'border-white/20 hover:border-white/60'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black tracking-widest uppercase text-white/50">Color</label>
                <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setColorFilter(c)}
                            className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-all ${colorFilter === c ? 'border-white bg-white text-black' : 'border-white/20 hover:border-white/60'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );

    return (
        <div className="min-h-screen pb-12">
            <div className="container mx-auto px-4 md:px-0">

                {/* Header */}
                <div className="relative mb-12 md:mb-24 overflow-hidden">
                    <div className="absolute -top-10 -left-8 opacity-[0.03] select-none pointer-events-none">
                        <H1 className="text-[15rem] md:text-[20rem] lg:text-[25rem] leading-none tracking-tighter font-black">EXPLORE</H1>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-12 md:pt-20">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="h-px w-8 bg-white/30"></span>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Our Inventory</p>
                            </div>
                            <H1 className="text-6xl md:text-8xl lg:text-9xl mb-2 tracking-tighter">EXPLORE ALL</H1>
                            <p className="text-white/30 uppercase tracking-[0.3em] font-bold text-[10px] md:text-xs">High-performance streetwear // Forged in iron</p>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setIsMobileModalOpen(true)}
                            className="lg:hidden flex items-center gap-3 border border-white/20 px-6 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em] font-black text-[10px] bg-white/5 backdrop-blur-sm"
                        >
                            <FiFilter className="text-sm" /> Filter Collection
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Desktop Sidebar Filters */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24">
                            <H3 className="mb-6 uppercase tracking-widest">Filters</H3>
                            <FilterOptions />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-32 gap-4">
                                <div className="animate-spin size-12 border-4 border-white/20 border-t-white rounded-full"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading collection...</p>
                            </div>
                        ) : fetchError ? (
                            <div className="text-center py-32 border border-white/10">
                                <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">wifi_off</span>
                                <H3 className="text-white/50 mb-2">FAILED TO LOAD</H3>
                                <p className="text-sm font-bold uppercase tracking-widest text-white/30 mb-6">Connection timed out. Please check your network and try again.</p>
                                <button
                                    onClick={() => fetchProducts()}
                                    className="border border-white px-6 py-3 text-xs font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-32 border border-white/10">
                                <H3 className="text-white/50 mb-2">NO PRODUCTS FOUND</H3>
                                <p className="text-sm font-bold uppercase tracking-widest text-white/30">Try adjusting your filters</p>
                                <button
                                    onClick={() => {
                                        setCategoryFilter("All");
                                        setCollectionFilter("All");
                                        setSizeFilter("All");
                                        setColorFilter("All");
                                        setDropFilter("All");
                                        setSortBy("newest");
                                    }}
                                    className="mt-6 border border-white px-6 py-3 text-xs font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                                {paginatedProducts.map((p) => (
                                    <ProductCard
                                        key={p.id}
                                        id={p.id}
                                        name={p.name}
                                        price={`₹${p.minPrice.toLocaleString()}`}
                                        image={p.primaryImage}
                                        description={p.description}
                                        sizes={p.availableSizes}
                                        variants={p.variants}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <FiChevronLeft />
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`size-10 flex items-center justify-center text-xs font-bold transition-colors ${currentPage === p ? 'bg-white text-black' : 'border border-white/20 hover:bg-white/10'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {isMobileModalOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileModalOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-background-dark border-l border-white/10 flex flex-col animation-slide-left">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <H3 className="uppercase tracking-widest text-lg">Filters</H3>
                            <button onClick={() => setIsMobileModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <FilterOptions />
                        </div>
                        <div className="p-6 border-t border-white/10 flex gap-4 bg-background-dark">
                            <button
                                onClick={() => {
                                    setCategoryFilter("All");
                                    setCollectionFilter("All");
                                    setSizeFilter("All");
                                    setColorFilter("All");
                                    setDropFilter("All");
                                    setSortBy("newest");
                                }}
                                className="flex-1 py-4 border border-white/20 text-xs font-black tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsMobileModalOpen(false)}
                                className="flex-1 py-4 bg-white text-black text-xs font-black tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
