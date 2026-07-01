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
 * The content div ref is provided via ScrollContainerContext so that
 * HeroScroll can pass it to framer-motion's useScroll({ container })
 * and have scroll-driven animations track against this div.
 *
 * Lenis is initialised in wrapper-mode on the content div so smooth
 * scrolling continues to work. The wrapper uses overflow-hidden (Lenis
 * manages the visual translation); an inner content div is the target
 * Lenis translates.
 *
 * CartDrawer, LoginModal, MobileMenu are fixed/absolute so they render
 * correctly regardless of where they live in the tree.
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
import Lenis from '@studio-freight/lenis';

// ─── Inner layout (consumes CartContext etc.) ─────────────────────────────────
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isCartOpen, openCart, closeCart } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);

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

    // Lenis smooth-scroll initialised in wrapper-mode on the content div.
    // We intentionally keep wrapper mode so sticky elements inside the scroll
    // container work correctly (sticky: top:0 snaps to the div, not the page).
    // For iOS touch compatibility we must set `eventsTarget` to the wrapper.
    useEffect(() => {
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
            // iOS Safari: touch events must be heard on the wrapper itself,
            // not on window, because the body is overflow:hidden.
            eventsTarget: wrapper,
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
    }, []);

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
                {/*
                 * overflow-y-auto here so iOS Safari receives native touch
                 * events on the wrapper div. Lenis takes over from there.
                 * overflow-x-hidden prevents horizontal bounce.
                 * The no-scrollbar utility hides the native scrollbar.
                 * sticky elements inside this div naturally stick to its top,
                 * which is already below the navbar — headings are fully visible.
                 */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
                    style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
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
// SmoothScroll wrapper removed — Lenis is now initialised directly in
// LayoutContent against the content div, not the window.
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
