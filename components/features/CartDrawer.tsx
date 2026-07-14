"use client";
import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

import { Portal } from '@/components/ui/Portal';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { items, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between p-8 border-b border-white/10">
                        <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter">Your Bag ({cartCount})</h2>
                        <button onClick={onClose} className="material-symbols-outlined text-white/60 hover:text-white transition-colors">close</button>
                    </div>

                    <div className="grow overflow-y-auto p-8 space-y-8">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/40">
                                <span className="material-symbols-outlined text-4xl mb-4">shopping_bag</span>
                                <p className="text-xs font-bold uppercase tracking-widest">Your bag is empty</p>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <div key={`${item.id}-${item.size}-${index}`} className="flex gap-6 items-start">
                                    <div className="w-24 aspect-3/4 bg-card-dark border border-white/10 overflow-hidden shrink-0">
                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${item.image}")` }}></div>
                                    </div>
                                    <div className="grow flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-black uppercase tracking-widest leading-tight">{item.name}</h3>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.size)}
                                                className="material-symbols-outlined text-sm text-white/40 hover:text-white transition-colors">
                                                delete
                                            </button>
                                        </div>
                                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-4">Size: {item.size}</p>
                                        <div className="mt-auto flex justify-between items-center">
                                            <div className="flex items-center border border-white/20">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, -1)}
                                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors border-r border-white/20 text-xs"
                                                >-</button>
                                                <span className="w-8 text-center text-[10px] font-black">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.size, 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors border-l border-white/20 text-xs"
                                                >+</button>
                                            </div>
                                            <span className="text-sm font-display font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 border-t border-white/10 bg-black">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Subtotal</span>
                            <span className="text-xl font-display font-bold">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <Link href="/cart" onClick={onClose} className="w-full block text-center py-6 bg-white text-black font-black uppercase text-sm tracking-[0.2em] hover:bg-neutral-200 transition-all mb-4">
                            Checkout
                        </Link>
                        <div className="text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Shipping within India only</p>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

