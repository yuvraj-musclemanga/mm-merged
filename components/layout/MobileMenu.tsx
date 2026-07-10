"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginOpen: () => void;
}

import { Portal } from '@/components/ui/Portal';

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onLoginOpen }) => {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const handleStoryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        onClose();
        if (pathname === '/') {
            e.preventDefault();
            const element = document.getElementById('our-story');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] lg:hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    onClick={onClose}
                ></div>

                {/* Drawer */}
                <div className="absolute left-0 top-0 h-full w-full max-w-md bg-black border-r border-white/40 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between p-8 border-b border-white/10">
                        <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter">Menu</h2>
                        <button onClick={onClose} className="material-symbols-outlined text-white/60 hover:text-white transition-colors">close</button>
                    </div>

                    <nav className="grow overflow-y-auto p-8 flex flex-col gap-10">
                        <Link
                            href="/explore"
                            onClick={onClose}
                            className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tighter hover:text-white/60 transition-colors"
                        >
                            Shop
                        </Link>
                        <Link
                            href="/#our-story"
                            onClick={handleStoryClick}
                            className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tighter hover:text-white/60 transition-colors"
                        >
                            Story
                        </Link>
                    </nav>

                    <div className="p-8 border-t border-white/10 bg-black">
                        <div className="space-y-4">
                            {user ? (
                                <>
                                    <Link href="/account" onClick={onClose} className="flex items-center justify-between group w-full text-white hover:text-white/60 transition-colors">
                                        <span className="text-xs font-black uppercase tracking-[0.3em]">Account</span>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">person</span>
                                    </Link>
                                    <button onClick={() => logout()} className="flex items-center justify-between group w-full text-red-500/80 hover:text-red-500 transition-colors">
                                        <span className="text-xs font-black uppercase tracking-[0.3em]">Logout</span>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">logout</span>
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { onClose(); onLoginOpen(); }} className="flex items-center justify-between group w-full">
                                    <span className="text-xs font-black uppercase tracking-[0.3em]">Login / Account</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">person</span>
                                </button>
                            )}
                            <Link href="/cart" onClick={onClose} className="flex items-center justify-between group">
                                <span className="text-xs font-black uppercase tracking-[0.3em]">View Bag</span>
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 pt-4">Musclemanga &copy; 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

