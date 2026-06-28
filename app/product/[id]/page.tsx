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

export default function ProductPage() {
    const { id } = useParams() as { id: string };
    const [product, setProduct] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const isWishlisted = isInWishlist(id);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_images(image_url, position),
                        product_variants(*)
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error fetching product:', error);
                    showToast("Product not found", "error");
                } else {
                    setProduct(data);
                    // Set initial active image
                    const initialImage = data.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.image_url;
                    setActiveImage(initialImage || '');
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, showToast]);

    if (loading) {
        return (
            <main className="max-w-[1800px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 flex items-center justify-center min-h-[60vh]">
                <Label>Loading product details...</Label>
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
    const sizes = Array.from(new Set(product.product_variants?.map((v: any) => v.size) || [])) as string[];
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
                                <button className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-white/20 hover:border-white transition-colors pb-1">Size Guide</button>
                            </div>
                            {sizes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-16 border-2 flex items-center justify-center font-bold text-xs transition-all uppercase tracking-widest ${selectedSize === size ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white hover:bg-white/5'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
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
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Hang dry in shade only to maintain structure, color, and longevity. </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-2 h-2 bg-white rotate-45"></span>Avoid ironing directly over prints or embellishments. </li>
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
        </main>
    );
}
