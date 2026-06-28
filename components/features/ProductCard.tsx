"use client";
import React from 'react';
import { H3, Label } from '@/components/ui/Typography';
import Link from 'next/link';

import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useWishlist } from '@/context/WishlistContext';
import { FiHeart } from "react-icons/fi";

interface ProductCardProps {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    fullWidth?: boolean;
    sizes: string[];
    variants: any[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    name,
    price,
    image,
    description,
    fullWidth = false,
    sizes = [],
    variants = []
}) => {
    const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const isWishlisted = isInWishlist(id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedSize) {
            showToast("Please select a size first", "error");
            return;
        }

        const variant = variants.find((v: any) => v.size === selectedSize);
        const numericPrice = variant?.price || 0;

        addToCart({
            id,
            variant_id: variant?.id, // Pass the database variant_id
            name,
            price: numericPrice,
            image,
            size: selectedSize,
            description
        });

        showToast("Added to bag", "success");
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(id);
    };

    return (
        <div className={`group flex flex-col ${fullWidth ? 'lg:mt-12' : ''}`}>
            <div className="relative bg-card-dark border border-white/10 overflow-hidden aspect-[3/4] mb-6">
                {/* Wishlist Heart Icon */}
                <button 
                    onClick={handleWishlistClick}
                    className="absolute top-4 right-4 z-20 w-10 h-10 border border-white/10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group/heart transition-all active:scale-95 hover:border-white"
                >
                    <FiHeart 
                        className={`text-lg transition-all ${isWishlisted ? 'fill-white text-white' : 'text-white/60 group-hover/heart:text-white'}`} 
                    />
                </button>

                <Link href={`/product/${id}`} className="block w-full h-full relative z-0">
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url("${image}")` }}
                    ></div>
                </Link>
            </div>
            <Link href={`/product/${id}`} className="flex justify-between items-start cursor-pointer hover:opacity-80 transition-opacity mb-4">
                <div>
                    <H3 className="text-lg mb-1">{name}</H3>
                </div>
                <span className="font-display font-bold text-lg text-white">{price}</span>
            </Link>

            {/* Sizes Selection */}
            <div className="mb-4">
                <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size) => (
                        <button
                            key={size}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedSize(size);
                            }}
                            className={`h-8 border flex items-center justify-center font-bold text-[10px] transition-all uppercase tracking-widest ${selectedSize === size ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white hover:bg-white/5'}`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
                {sizes.length === 0 && <p className="text-white/40 text-[10px] uppercase tracking-widest">No sizes available</p>}
            </div>

            <button
                onClick={handleAddToCart}
                className="w-full bg-white text-black py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-200 transition-colors"
            >
                Add to Bag
            </button>
        </div>
    );
};
