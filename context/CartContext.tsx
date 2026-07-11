"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDBCartItems, syncDBCartItems, updateDBCartItem, deleteDBCartItem } from '@/lib/supabase';
import { MergeCartModal } from '@/components/features/MergeCartModal';

export interface CartItem {
    id: string; // product_id
    variant_id?: string; // specific variant id
    dbId?: string; // cart_item id in DB
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    description: string;
}

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (item: Omit<CartItem, 'quantity'>) => void;
    removeFromCart: (id: string, size: string) => void;
    updateQuantity: (id: string, size: string, delta: number) => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartId, setCartId] = useState<string | null>(null);

    // Conflict state
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [guestItemsCache, setGuestItemsCache] = useState<CartItem[]>([]);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    // --- Loading Logic ---
    useEffect(() => {
        const initializeCart = async () => {
            const lsCartStr = localStorage.getItem('guest_cart') || localStorage.getItem('cart');
            const lsItems: CartItem[] = lsCartStr ? JSON.parse(lsCartStr) : [];

            if (!user) {
                // Not authenticated, use LocalStorage exclusively
                setItems(lsItems);
            } else {
                try {
                    // Authenticated, fetch from DB
                    const { items: dbItems, cartId: dbCartId } = await getDBCartItems(user.uid);
                    setCartId(dbCartId);

                    if (lsItems.length > 0) {
                        if (dbItems.length > 0) {
                            // Conflict! Need user input
                            setGuestItemsCache(lsItems);
                            setItems(dbItems); // Default to showing DB items while resolving
                            setShowConflictModal(true);
                        } else {
                            // DB empty, LS full -> Migrate cleanly
                            setItems(lsItems);
                            if (dbCartId) {
                                await syncDBCartItems(dbCartId, lsItems);
                            }
                            localStorage.removeItem('guest_cart');
                            localStorage.removeItem('cart');
                        }
                    } else {
                        // No LS cart, just DB cart
                        setItems(dbItems);
                    }
                } catch (error) {
                    // Keep the customer able to browse and retain their guest cart
                    // when the database is unavailable rather than leaving the UI stale.
                    console.error('Unable to load database cart:', error);
                    setItems(lsItems);
                    setCartId(null);
                }
            }
        };

        initializeCart();
    }, [user]);

    // --- Auth Sync Logic ---
    const commitToDB = async (updatedItems: CartItem[]) => {
        if (!user || !cartId) return;
        await syncDBCartItems(cartId, updatedItems);
    };

    // Debounce syncing to database
    useEffect(() => {
        if (!user || !cartId) return;
        
        // Skip syncing on initial mount to avoid overwriting DB with empty LS
        const timer = setTimeout(() => {
            syncDBCartItems(cartId, items);
        }, 800);

        return () => clearTimeout(timer);
    }, [items, user, cartId]);

    const addToCart = async (newItem: Omit<CartItem, 'quantity'> & { variant_id?: string }) => {
        setItems(prev => {
            const existingItemIndex = prev.findIndex(item => 
                item.id === newItem.id && item.size === newItem.size
            );
            
            let newItems;
            if (existingItemIndex > -1) {
                newItems = prev.map((item, index) => 
                    index === existingItemIndex 
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                newItems = [...prev, { ...newItem, quantity: 1 }];
            }

            if (!user) localStorage.setItem('guest_cart', JSON.stringify(newItems));
            // No direct commitToDB here anymore, the useEffect handles it
            return newItems;
        });
    };

    const removeFromCart = async (id: string, size: string) => {
        setItems(prev => {
            const newItems = prev.filter(item => !(item.id === id && item.size === size));
            
            if (!user) {
                localStorage.setItem('guest_cart', JSON.stringify(newItems));
            }

            return newItems;
        });
    };

    const updateQuantity = async (id: string, size: string, delta: number) => {
        setItems(prev => {
            const newItems = prev.map(item => {
                if (item.id === id && item.size === size) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            });

            if (!user) {
                localStorage.setItem('guest_cart', JSON.stringify(newItems));
            }

            return newItems;
        });
    };

    // --- Conflict Handlers ---
    const handleMergeCarts = async () => {
        // Simple append if not duplicate. If duplicate, add quantities.
        const merged = [...items];
        guestItemsCache.forEach(gItem => {
            const existing = merged.find(i => i.id === gItem.id && i.size === gItem.size);
            if (existing) existing.quantity += gItem.quantity;
            else merged.push(gItem);
        });

        setItems(merged);
        localStorage.removeItem('guest_cart');
        localStorage.removeItem('cart');
        setShowConflictModal(false);
    };

    const handleReplaceCart = async () => {
        setItems(guestItemsCache);
        localStorage.removeItem('guest_cart');
        localStorage.removeItem('cart');
        setShowConflictModal(false);
    };

    const handleKeepExisting = () => {
        // Keeps DB cart as is, clears guest cache
        localStorage.removeItem('guest_cart');
        localStorage.removeItem('cart');
        setShowConflictModal(false);
    };

    const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            isCartOpen,
            openCart,
            closeCart,
            addToCart,
            removeFromCart,
            updateQuantity,
            cartTotal,
            cartCount
        }}>
            {children}
            <MergeCartModal
                isOpen={showConflictModal}
                onMerge={handleMergeCarts}
                onReplace={handleReplaceCart}
                onClose={handleKeepExisting}
            />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
