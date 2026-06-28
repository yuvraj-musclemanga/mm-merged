"use client";

/**
 * ScrollContainerContext
 *
 * Provides a ref to the main scrollable content div so that child
 * components (HeroScroll) can pass it as the `container` option to
 * framer-motion's useScroll — enabling scroll-driven animations to
 * track against the content div instead of the window.
 */

import { createContext, useContext, MutableRefObject } from 'react';

export const ScrollContainerContext = createContext<MutableRefObject<HTMLDivElement | null> | null>(null);

export const useScrollContainer = () => useContext(ScrollContainerContext);
