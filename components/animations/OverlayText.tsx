"use client";

import { useState } from "react";
import {
  motion,
  MotionValue,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

/**
 * Cinematic overlay UI for the HeroScroll canvas animation.
 * Ported from mm-v2. Shows product headings + glassmorphism feature cards
 * that slide in once the canvas spin animation begins (progress >= 0.25).
 *
 * Uses mm-merged's own Syncopate display font for the main heading
 * (--font-display) instead of mm-v2's Kaushan_Script, so the style
 * aligns with the existing brand identity.
 */
export default function OverlayText({
  scrollYProgress,
  topHeading,
  bottomHeading,
  leftHeading,
  rightHeading,
}: {
  scrollYProgress: MotionValue<number>;
  topHeading: React.ReactNode;
  bottomHeading: React.ReactNode;
  leftHeading: React.ReactNode;
  rightHeading: React.ReactNode;
}) {
  // Track whether the canvas spin animation has started (progress >= 0.25)
  const [spinStarted, setSpinStarted] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setSpinStarted(progress >= 0.25);
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-10 uppercase">
      {/* Top and Bottom gradient blends */}
      <div className="absolute top-0 inset-x-0 h-40 bg-linear-to-b from-background-dark to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-linear-to-t from-background-dark to-transparent z-10" />

      {/* --- WIDESCREEN LAYOUT (>= 16:9) --- */}
      <div className="hidden [@media(min-aspect-ratio:4/3)]:block">
        {/* WIDESCREEN LEFT SIDE (Heading & Button) */}
        <div
          className="absolute inset-y-0 left-0 p-8 md:pl-16 lg:pl-24 flex flex-col items-start justify-center w-full md:w-5/12 z-20 pointer-events-auto"
          style={{
            transition: "opacity 1s ease-out, transform 1s ease-out",
            opacity: spinStarted ? 1 : 0,
            transform: spinStarted ? "translateX(0)" : "translateX(-50px)",
          }}
        >
          <h2
            className="text-4xl lg:text-6xl text-white tracking-wide text-left drop-shadow-2xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {topHeading}
          </h2>
          <p className="text-white/60 tracking-widest text-sm md:text-base font-medium mb-8">
            UNISEX OVERSIZED TEE
          </p>
          <button className="px-8 py-3.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-300 rounded-full tracking-widest text-xs lg:text-sm font-semibold backdrop-blur-md shadow-lg hover:shadow-white/20 cursor-pointer pointer-events-auto">
            VIEW PRODUCT
          </button>
        </div>

        {/* WIDESCREEN RIGHT SIDE (Feature Cards) */}
        <div
          className="absolute inset-y-0 right-0 p-8 md:pr-16 lg:pr-24 flex flex-col items-end justify-center gap-5 w-full md:w-1/3 z-20 pointer-events-auto"
          style={{
            transition: "opacity 1s ease-out, transform 1s ease-out",
            opacity: spinStarted ? 1 : 0,
            transform: spinStarted ? "translateX(0)" : "translateX(50px)",
          }}
        >
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
            <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
              {leftHeading}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
            <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
              {rightHeading}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[280px]">
            <p className="text-sm lg:text-base text-white tracking-wider font-light leading-snug text-center">
              {bottomHeading}
            </p>
          </div>
        </div>
      </div>

      {/* --- PORTRAIT / SQUARE LAYOUT (< 16:9) --- */}
      <div className="block [@media(min-aspect-ratio:4/3)]:hidden">
        {/* PORTRAIT TOP SIDE (Main Heading & Button) */}
        <div
          className="absolute top-8 md:top-12 inset-x-0 p-4 flex flex-col items-center justify-start w-full z-20 pointer-events-auto"
          style={{
            transition: "opacity 1s ease-out, transform 1s ease-out",
            opacity: spinStarted ? 1 : 0,
            transform: spinStarted ? "translateY(0)" : "translateY(-50px)",
          }}
        >
          <h2
            className="text-3xl md:text-5xl text-white tracking-wide text-center drop-shadow-2xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {topHeading}
          </h2>
          <button className="px-6 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-300 rounded-full tracking-widest text-[10px] md:text-xs font-semibold backdrop-blur-md shadow-lg hover:shadow-white/20 cursor-pointer pointer-events-auto">
            VIEW PRODUCT
          </button>
        </div>

        {/* PORTRAIT BOTTOM SIDE (Horizontal Feature Cards) */}
        <div
          className="absolute bottom-8 md:bottom-12 inset-x-0 p-4 flex flex-row items-stretch justify-center gap-2 md:gap-4 w-full z-20 pointer-events-auto"
          style={{
            transition: "opacity 1s ease-out, transform 1s ease-out",
            opacity: spinStarted ? 1 : 0,
            transform: spinStarted ? "translateY(0)" : "translateY(50px)",
          }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
            <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center wrap-break-word">
              {leftHeading}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
            <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center wrap-break-word">
              {rightHeading}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl flex-1 max-w-[140px] flex items-center justify-center">
            <p className="text-[9px] md:text-xs text-white tracking-wider font-light leading-snug text-center wrap-break-word">
              {bottomHeading}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
