"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { H1, Label } from '@/components/ui/Typography';
import { Marquee } from '@/components/ui/Marquee';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/context/WishlistContext';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { Portal } from '@/components/ui/Portal';

export default function ProductPage() {
    const { id } = useParams() as { id: string };
    const [product, setProduct] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const isWishlisted = isInWishlist(id);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;

            // 15-second timeout so the page never hangs forever on bad networks.
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            setLoading(true);
            setFetchError(false);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_images(image_url, position),
                        product_variants(*, inventory(quantity_available))
                    `)
                    .eq('id', id)
                    .abortSignal(controller.signal)
                    .single();

                clearTimeout(timeoutId);

                if (error) {
                    console.error('Error fetching product:', error);
                    showToast("Product not found", "error");
                    setFetchError(true);
                } else {
                    setProduct(data);
                    const initialImage = data.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.image_url;
                    setActiveImage(initialImage || '');
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error('Unexpected error:', err);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, showToast]);

    if (loading) {
        return (
            <main className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="animate-spin size-12 border-4 border-white/20 border-t-white rounded-full"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading product details...</p>
            </main>
        );
    }

    if (fetchError) {
        return (
            <main className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <span className="material-symbols-outlined text-4xl text-white/20">wifi_off</span>
                <Label className="text-white/50">Connection timed out. Please check your network.</Label>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 border border-white px-6 py-3 text-xs font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
                >
                    Retry
                </button>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 flex items-center justify-center min-h-[60vh]">
                <Label>Product not found.</Label>
            </main>
        );
    }

    const gallery = product.product_images?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.image_url) || [];
    const rawSizes = Array.from(new Set(product.product_variants?.map((v: any) => v.size) || [])) as string[];
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const sizes = rawSizes.sort((a, b) => {
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    const displayPrice = product.product_variants?.[0]?.price ? `₹${product.product_variants[0].price}` : 'TBA';

    const handleAddToBag = () => {
        if (!selectedSize) {
            showToast("Please select a size first", "error");
            return;
        }

        const variant = product.product_variants.find((v: any) => v.size === selectedSize);
        const price = variant?.price || 0;

        addToCart({
            id: product.id,
            variant_id: variant?.id, // Pass the database variant_id
            name: product.name,
            price: price,
            image: activeImage || gallery[0] || '',
            size: selectedSize,
            description: product.description
        });

        showToast("Added to bag", "success");
    };

    return (
        <main className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
                {/* Gallery */}
                <div className="lg:col-span-7">
                    <div className="flex flex-col gap-6 lg:gap-10">
                        <div className="aspect-[4/5] bg-neutral-900 border border-white/5 overflow-hidden relative">
                            <div className="w-full h-full bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url("${activeImage}")` }}></div>
                        </div>
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-2 gap-6 lg:gap-10">
                                {gallery.filter((img: string) => img !== activeImage).map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className="aspect-[4/5] bg-neutral-900 border border-white/5 cursor-pointer hover:border-white/20 transition-all duration-300 overflow-hidden relative"
                                    >
                                        <div className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-110" style={{ backgroundImage: `url("${img}")` }}></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="lg:sticky lg:top-48">
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-4 mb-8">
                                <span className="h-[2px] w-10 bg-white"></span>
                                <Label>Drop-01 / Core Pieces</Label>
                            </div>
                            <H1 className="text-4xl md:text-5xl xl:text-7xl leading-[0.9] mb-8">
                                {product.name}
                            </H1>
                            <p className="text-3xl font-display font-bold text-white mb-12" onClick={() => console.log(product)}>{displayPrice}</p>

                        </div>

                        {/* Size Selector */}
                        <div className="mb-12">
                            <div className="flex justify-between items-end mb-6">
                                <Label>Select Size</Label>
                                <button
                                    onClick={() => setIsSizeGuideOpen(true)}
                                    className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-white/20 hover:border-white transition-colors pb-1 cursor-pointer"
                                >
                                    Size Guide
                                </button>
                            </div>
                            {sizes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {sizes.map((size) => {
                                        const variant = product.product_variants?.find((v: any) => v.size === size);
                                        const inv = Array.isArray(variant?.inventory) ? variant.inventory[0] : variant?.inventory;
                                        const stock = inv?.quantity_available || 0;
                                        const isOutOfStock = stock <= 0;

                                        return (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                disabled={isOutOfStock}
                                                className={`h-16 border-2 flex items-center justify-center font-bold text-xs transition-all uppercase tracking-widest relative ${
                                                    isOutOfStock 
                                                        ? 'border-white/5 text-white/20 cursor-not-allowed' 
                                                        : selectedSize === size 
                                                            ? 'bg-white text-black border-white' 
                                                            : 'border-white/10 hover:border-white hover:bg-white/5'
                                                }`}
                                            >
                                                {size}
                                                {isOutOfStock && <span className="absolute inset-0 w-full h-[1px] bg-white/20 top-1/2 -translate-y-1/2 rotate-[-15deg]"></span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-white/40 text-xs uppercase tracking-widest">No sizes available</p>
                            )}
                        </div>

                        <Button
                            fullWidth
                            className="mb-4 tracking-[0.4em]"
                            onClick={handleAddToBag}
                        >
                            Add to Bag
                        </Button>

                        <Button
                            fullWidth
                            variant="secondary"
                            className="mb-16 tracking-[0.4em]"
                            onClick={() => toggleWishlist(product.id)}
                        >
                            {isWishlisted ? 'IN WISHLIST' : 'ADD TO WISHLIST'}
                        </Button>

                        <div className="space-y-8 text-white/50 leading-relaxed text-sm xl:text-base max-w-xl mb-12">
                            <p className="text-white">{product.description}</p>
                            {product.features && product.features.length > 0 && (
                                <ul className="space-y-4 list-none p-0 text-xs font-bold uppercase tracking-widest">
                                    {product.features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span> {feature}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Details Accordions */}
                        <div className="border-t border-white/20">
                            <details className="group border-b border-white/20">
                                <summary className="flex items-center justify-between py-8 cursor-pointer list-none">
                                    <Label>Shipping & Returns</Label>
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-lg">expand_more</span>
                                </summary>
                                <div className="pb-8 text-xs font-bold uppercase tracking-[0.15em] text-white/40 leading-loose">
                                    <ul className="space-y-4 list-none p-0 text-xs font-bold uppercase tracking-widest">
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>We offer Pan India shipping, with deliveries typically arriving within 7-10 business days. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Orders are processed and dispatched within 48 hours of placement. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>All orders are shipped and tracked via premium courier partners. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>As part of our commitment to exclusivity and quality control, we do not offer returns. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Size exchanges are permitted, subject to stock availability. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Requests for exchanges must be raised within 24 hours of delivery. </li>
                                    </ul>
                                </div>
                            </details>
                            <details className="group border-b border-white/20">
                                <summary className="flex items-center justify-between py-8 cursor-pointer list-none">
                                    <Label>Materials & Care</Label>
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-lg">expand_more</span>
                                </summary>
                                <div className="pb-8 text-xs font-bold uppercase tracking-[0.15em] text-white/40 leading-loose">
                                    <ul className="space-y-4 list-none p-0 text-xs font-bold uppercase tracking-widest">
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Wash cold, inside out, to preserve the integrity of the fabric and detailing. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Hang dry in shade to maintain structure, color, and longevity. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Avoid ironing directly over prints or embellishments. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Wash seperately, avoid machine wash.</li>
                                    </ul>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-20">
                <Marquee className="bg-white text-black py-4">
                    <p className="text-2xl font-display font-bold uppercase tracking-tighter mx-12">Musclemanga // Drop-01 // Pure Strength // Limited Runs //</p>
                </Marquee>
            </div>

            {/* Size Guide Modal */}
            {isSizeGuideOpen && (
                <Portal>
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="relative w-full max-w-xl bg-black border-4 border-white p-8 md:p-12 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] overflow-y-auto max-h-[90vh]">
                            <button
                                onClick={() => setIsSizeGuideOpen(false)}
                                className="absolute top-4 right-4 text-white hover:text-white/60 transition-colors"
                            >
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                            <div className="mb-8">
                                <Label className="mb-2 block">Fit Specifications</Label>
                                <H1 className="text-2xl md:text-4xl leading-none">Size Guide</H1>
                                <div className="h-1 w-20 bg-white mt-4"></div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse border border-white/10 uppercase text-xs tracking-widest font-black">
                                    <thead>
                                        <tr className="border-b border-white bg-white text-black">
                                            <th className="p-4 font-black">Size</th>
                                            <th className="p-4 font-black text-right">Chest (in)</th>
                                            <th className="p-4 font-black text-right">Length (in)</th>
                                            <th className="p-4 font-black text-right">Shoulder (in)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 text-white">
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-black">S</td>
                                            <td className="p-4 text-right">44</td>
                                            <td className="p-4 text-right">26</td>
                                            <td className="p-4 text-right">21</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-black">M</td>
                                            <td className="p-4 text-right">46</td>
                                            <td className="p-4 text-right">27</td>
                                            <td className="p-4 text-right">22</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-black">L</td>
                                            <td className="p-4 text-right">48</td>
                                            <td className="p-4 text-right">28</td>
                                            <td className="p-4 text-right">23</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-black">XL</td>
                                            <td className="p-4 text-right">50</td>
                                            <td className="p-4 text-right">29</td>
                                            <td className="p-4 text-right">24</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 leading-relaxed">
                                Note: All measurements are in inches. Standard oversized boxy fit. We recommend ordering your normal size.
                            </p>
                        </div>
                    </div>
                </Portal>
            )}
        </main>
    );
}
