"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/supabase';
import { useToast } from './ToastContext';

interface WishlistContextType {
    wishlistItems: string[]; // Array of product_ids
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) {
                setWishlistItems([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const { data, error } = await getWishlist(user.uid);
            if (!error && data) {
                setWishlistItems(data.map(item => item.product_id));
            }
            setIsLoading(false);
        };

        fetchWishlist();
    }, [user]);

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            showToast("PLEASE LOGIN TO SAVE TO WISHLIST", "error");
            return;
        }

        const isCurrentlyIn = wishlistItems.includes(productId);

        if (isCurrentlyIn) {
            // Remove
            const { error } = await removeFromWishlist(user.uid, productId);
            if (!error) {
                setWishlistItems(prev => prev.filter(id => id !== productId));
                showToast("REMOVED FROM WISHLIST", "success");
            } else {
                showToast("FAILED TO REMOVE FROM WISHLIST", "error");
            }
        } else {
            // Add
            const { error } = await addToWishlist(user.uid, productId);
            if (!error) {
                setWishlistItems(prev => [...prev, productId]);
                showToast("ADDED TO WISHLIST", "success");
            } else {
                showToast("FAILED TO ADD TO WISHLIST", "error");
            }
        }
    };

    const isInWishlist = (productId: string) => wishlistItems.includes(productId);

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, isLoading }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
