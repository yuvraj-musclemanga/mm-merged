"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
    onCartOpen: () => void;
    onMobileMenuOpen: () => void;
    onLoginOpen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartOpen, onMobileMenuOpen, onLoginOpen }) => {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleStoryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname === '/') {
            e.preventDefault();
            const element = document.getElementById('our-story');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 px-6 lg:px-12 py-6 shrink-0">
            <nav className="relative max-w-[1600px] mx-auto flex items-center justify-between h-10">
                {/* Mobile Hamburger - Hidden on lg */}
                <div className="flex items-center lg:hidden">
                    <button onClick={onMobileMenuOpen} className="flex items-center">
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                </div>

                {/* Logo & Brand Name 
                    Mobile: Absolute centered Logo
                    >=sm: Shifted to left, Brand Name becomes visible
                    >=lg: Stays on left
                */}
                <div className="flex items-center gap-4 transition-all duration-300 absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
                    <Link href="/" className="flex items-center gap-4 cursor-pointer group">
                        <div className="w-10 h-10 relative overflow-hidden">
                            <img src="/logo.png" alt="Musclemanga Logo" className="object-contain w-full h-full scale-110 group-hover:scale-125 transition-transform duration-500" />
                        </div>
                        <h1 className="hidden xs:block text-2xl md:text-3xl font-display font-bold tracking-tighter uppercase leading-none">Musclemanga</h1>
                    </Link>

                    {/* Desktop Links - Visible only on lg+ */}
                    <div className="hidden lg:flex items-center gap-10 ml-8">
                        <Link href="/explore" className="text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors">Shop</Link>
                        <Link href="/#our-story" onClick={handleStoryClick} className="text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors">Our Story</Link>
                    </div>
                </div>

                {/* Right Section: Cart and Login */}
                <div className="flex items-center gap-10">
                    <div className="hidden lg:block">
                        {mounted && user ? (
                            <Link href="/account" className="flex items-center group gap-2">
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">person</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
                            </Link>
                        ) : (
                            <button onClick={onLoginOpen} className="flex items-center group gap-2">
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">person</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Login</span>
                            </button>
                        )}
                    </div>
                    <button onClick={onCartOpen} className="flex items-center gap-2 group">
                        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shopping_bag</span>
                        <span className="text-xs font-black uppercase tracking-widest hidden lg:block">Cart ({mounted ? cartCount : 0})</span>
                    </button>
                </div>
            </nav>
        </header>
    );
};
