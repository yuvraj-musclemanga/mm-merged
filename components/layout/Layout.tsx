"use client";

/**
 * Layout
 *
 * Two-div viewport structure:
 *  ┌──────────────────────────┐  ← h-screen, flex-col, overflow-hidden
 *  │  Navbar (fixed height)   │  ← Div 1: never scrolls
 *  ├──────────────────────────┤
 *  │                          │
 *  │  Content (flex-1,        │  ← Div 2: the ONLY thing that scrolls
 *  │  overflow-y-scroll)      │    sticky elements inside stick to
 *  │                          │    the TOP of THIS div, which is
 *  │                          │    already below the navbar — so
 *  │  OverlayText headings    │    overlay text is never hidden.
 *  │  are fully visible ✓     │
 *  └──────────────────────────┘
 *
 * DESKTOP (≥ 1024px):
 *   Lenis smooth-scroll is wired to the content div (wrapper mode).
 *   The wrapper uses overflow-hidden; Lenis translates the content child.
 *
 * MOBILE / TABLET (< 1024px):
 *   Lenis is NOT used. The content div uses overflow-y-auto + native
 *   scroll-snap-type: y mandatory so that CSS scroll snapping works
 *   natively between full-screen sections. Lenis would bypass the
 *   browser's snap algorithm, which is why it's skipped on mobile.
 *
 * CartDrawer, LoginModal, MobileMenu are fixed/absolute so they render
 * correctly regardless of where they live in the tree.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../features/CartDrawer';
import { CartProvider, useCart } from '@/context/CartContext';
import { LoginModal } from '../features/LoginModal';
import { MobileMenu } from './MobileMenu';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ScrollContainerContext } from '@/context/ScrollContainerContext';
import Lenis from '@studio-freight/lenis';

// ─── Inner layout (consumes CartContext etc.) ─────────────────────────────────
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isCartOpen, openCart, closeCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

    // Detect desktop vs mobile/tablet. We default to true (desktop) to match
    // SSR output and avoid layout flash; the real check runs after mount.
    const [isDesktop, setIsDesktop] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // This ref is attached to the scrollable content div and shared via context
    // so HeroScroll can use it as the framer-motion scroll container.
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Track the content div's actual height and expose it as a CSS custom
    // property so HeroScroll's sticky panel can size itself correctly.
    // (The content div is 100vh - navbarHeight, not 100vh.)
    useEffect(() => {
        const updateHeight = () => {
            if (scrollContainerRef.current) {
                const h = scrollContainerRef.current.clientHeight;
                document.documentElement.style.setProperty('--scroll-content-height', `${h}px`);
            }
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        if (scrollContainerRef.current) ro.observe(scrollContainerRef.current);
        return () => ro.disconnect();
    }, []);

    // Lenis smooth-scroll — DESKTOP ONLY.
    // On mobile/tablet we skip Lenis so that the browser's native scroll snap
    // algorithm can operate without interference.
    useEffect(() => {
        if (!mounted || !isDesktop) return;

        const wrapper = scrollContainerRef.current;
        if (!wrapper) return;

        const lenis = new Lenis({
            wrapper,
            // Lenis needs the immediate child as its "content" element
            content: wrapper.firstElementChild as HTMLElement,
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        let rafId: number;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, [mounted, isDesktop]);

    // On mobile: native scroll with CSS snap.
    // On desktop: Lenis wrapper mode requires overflow-hidden.
    const scrollContainerClass = mounted && !isDesktop
        ? 'flex-1 overflow-y-auto no-scrollbar'
        : 'flex-1 overflow-hidden no-scrollbar';

    const scrollContainerStyle: React.CSSProperties = mounted && !isDesktop
        ? { scrollSnapType: 'y proximity', WebkitOverflowScrolling: 'touch' }
        : {};

    return (
        <ScrollContainerContext.Provider value={scrollContainerRef}>
            {/*
             * Outer shell: fills the full viewport, does NOT scroll itself.
             * body/html also have overflow:hidden (set in globals.css) so the
             * page-level scroll is fully disabled.
             */}
            <div className="flex flex-col h-screen w-full overflow-hidden">

                {/* ── DIV 1: Navbar ──────────────────────────────────────── */}
                {/* Takes its natural height. Stays at the top, never moves. */}
                <Navbar
                    onCartOpen={openCart}
                    onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                    onLoginOpen={() => setIsLoginModalOpen(true)}
                />

                {/* ── DIV 2: Scrollable content area ─────────────────────── */}
                <div
                    ref={scrollContainerRef}
                    className={scrollContainerClass}
                    style={scrollContainerStyle}
                >
                    {/* Lenis content target — must be direct child of wrapper */}
                    <div>
                        {children}
                        <Footer />
                    </div>
                </div>
            </div>

            {/* Fixed overlays — position:fixed so they work outside the scroll container */}
            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onLoginOpen={() => setIsLoginModalOpen(true)}
            />
        </ScrollContainerContext.Provider>
    );
};

// ─── Public Layout (provider tree) ───────────────────────────────────────────
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

