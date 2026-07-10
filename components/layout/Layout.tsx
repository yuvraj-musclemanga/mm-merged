"use client";

/**
 * Layout
 *
 * Simple single-flow layout:
 *  - Navbar is sticky (position: sticky, top: 0) — stays visible while the
 *    page scrolls normally.
 *  - Page content and Footer follow in normal document flow.
 *  - Body/html scroll freely — no Lenis, no wrapper div, no overflow tricks.
 *
 * Fixed overlays (CartDrawer, LoginModal, MobileMenu) use position:fixed so
 * they render correctly on top of everything.
 */

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../features/CartDrawer';
import { CartProvider, useCart } from '@/context/CartContext';
import { LoginModal } from '../features/LoginModal';
import { MobileMenu } from './MobileMenu';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';

// ─── Inner layout (consumes CartContext etc.) ──────────────────────────────────
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isCartOpen, openCart, closeCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

    React.useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href === '#our-story' || href === '/#our-story') {
                    if (window.location.pathname === '/') {
                        e.preventDefault();
                        const element = document.getElementById('our-story');
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);
        return () => document.removeEventListener('click', handleAnchorClick);
    }, []);

    return (
        <>
            {/* Sticky navbar — sticks to viewport top as the page scrolls */}
            <Navbar
                onCartOpen={openCart}
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                onLoginOpen={() => setIsLoginModalOpen(true)}
            />

            {/* Page content in normal document flow */}
            {children}

            <Footer />

            {/* Fixed overlays */}
            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onLoginOpen={() => setIsLoginModalOpen(true)}
            />
        </>
    );
};

// ─── Public Layout (provider tree) ────────────────────────────────────────────
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <LayoutContent>{children}</LayoutContent>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </ToastProvider>
    );
};
