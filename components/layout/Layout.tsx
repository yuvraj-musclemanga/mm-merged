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
 *  │                          │    the TOP of THIS div (already below
 *  │  OverlayText headings    │    the navbar) → headings fully visible.
 *  │  are fully visible ✓     │
 *  └──────────────────────────┘
 *
 * WHY NO LENIS?
 * Lenis in wrapper-mode requires overflow:hidden on the wrapper and
 * achieves scrolling via CSS transforms. This silently breaks
 * position:sticky inside the wrapper (sticky requires a scrollable
 * overflow ancestor, not a transform-translated one), and the rAF
 * loop adds extra GPU pressure on mobile. Native overflow-y-scroll is
 * simpler and sticky just works.
 *
 * The content div ref is provided via ScrollContainerContext so that
 * HeroScroll can pass it as container to framer-motion's useScroll.
 */

import React, { useRef, useEffect } from 'react';
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

// ─── Inner layout (consumes CartContext etc.) ─────────────────────────────────
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isCartOpen, openCart, closeCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

    // Ref shared via context so HeroScroll can use it as the framer-motion
    // scroll container (useScroll({ container: scrollContainerRef })).
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Measure the content div's actual rendered height and expose it as
    // --scroll-content-height so HeroScroll's sticky panel (and the
    // negative-margin overlap trick in AnimatedSequencesSection) can size
    // themselves to exactly the visible content area, not 100vh.
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

    return (
        <ScrollContainerContext.Provider value={scrollContainerRef}>
            {/*
             * Outer shell: fills the full viewport, does NOT scroll itself.
             * html/body also have overflow:hidden (globals.css) so there
             * is no page-level scroll at all.
             */}
            <div className="flex flex-col h-screen w-full overflow-hidden">

                {/* ── DIV 1: Navbar ─────────────────────────────────────── */}
                {/* Takes its natural height. Stays at top, never moves.    */}
                <Navbar
                    onCartOpen={openCart}
                    onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                    onLoginOpen={() => setIsLoginModalOpen(true)}
                />

                {/* ── DIV 2: Scrollable content area ────────────────────── */}
                {/*
                 * overflow-y-scroll: native scroll so position:sticky works
                 * correctly inside. no-scrollbar hides the native scrollbar.
                 * This div is the scroll container that HeroScroll targets.
                 */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-scroll overflow-x-hidden no-scrollbar"
                >
                    {children}
                    <Footer />
                </div>
            </div>

            {/* Fixed overlays — position:fixed keeps them viewport-relative */}
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
