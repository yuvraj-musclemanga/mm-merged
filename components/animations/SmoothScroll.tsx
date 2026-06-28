"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

/**
 * Lenis smooth-scroll provider.
 * Ported from mm-v2 and wired into mm-merged's Layout.
 *
 * This component initialises a Lenis instance and drives it via rAF.
 * It adds no visible DOM — it purely enhances native scroll behaviour.
 *
 * NOTE: The Lenis CSS reset classes (html.lenis, .lenis-smooth, etc.)
 * must also be present in globals.css for correct behaviour.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
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
  }, []);

  return <>{children}</>;
}
