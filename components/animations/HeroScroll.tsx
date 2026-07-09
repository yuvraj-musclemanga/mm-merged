"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import OverlayText from "./OverlayText";
import { useScrollContainer } from "@/context/ScrollContainerContext";

/**
 * Cinematic canvas-based image-sequence scroll animation.
 * Ported from mm-v2.
 *
 * The component occupies 400vh of scroll space. Within that space:
 * - The inner <div> is sticky-positioned to stay at top-0 / h-screen.
 * - A canvas draws the correct image frame in real time as scroll progresses.
 * - OverlayText shows glassmorphism cards once the animation is underway.
 *
 * Scroll offset: ["start end", "end end"]
 *   → animation begins when this section's top enters the bottom of the
 *     viewport, and finishes when its bottom reaches the viewport bottom.
 *   → frame playback is mapped across scrollYProgress 0.25 → 0.75.
 */

interface HeroScrollProps {
  totalFrames: number;
  framePrefix: string;
  folderPath: string;
  topHeading: React.ReactNode;
  bottomHeading: React.ReactNode;
  leftHeading: React.ReactNode;
  rightHeading: React.ReactNode;
  frameStep?: number;
  frameExtension?: string;
  reverse?: boolean;
  backgroundImage?: string;
  padNumber?: number;
  objectFit?: "contain" | "cover";
}

export default function HeroScroll({
  totalFrames,
  framePrefix,
  folderPath,
  topHeading,
  bottomHeading,
  leftHeading,
  rightHeading,
  frameStep = 50,
  frameExtension = ".JPG",
  reverse = false,
  backgroundImage,
  padNumber = 0,
  objectFit = "contain",
}: HeroScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The content div (from Layout) is the scroll container.
  // Without this, useScroll tracks the window which no longer scrolls.
  const scrollContainerRef = useScrollContainer();

  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const framePath = useCallback(
    (index: number) => {
      let finalIndex = index;
      if (mounted && !isDesktop) {
        // Use the exact middle frame for mobile/tablet
        finalIndex = Math.floor(totalFrames / 2);
      } else {
        const actualFrameNumber = (index - 1) * frameStep;
        finalIndex = frameStep === 1 ? index : actualFrameNumber;
      }

      const finalNumberString =
        padNumber > 0
          ? finalIndex.toString().padStart(padNumber, "0")
          : finalIndex.toString();

      return `${folderPath}/${framePrefix}${finalNumberString}${frameExtension}`;
    },
    [folderPath, framePrefix, frameStep, frameExtension, padNumber, mounted, isDesktop, totalFrames]
  );

  const framesToLoad = !mounted ? 0 : (isDesktop ? totalFrames : 1);
  const { images, loaded } = useImagePreloader(framesToLoad, framePath);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    ...(scrollContainerRef ? { container: scrollContainerRef } : {}),
    // Desktop: 4-viewport scroll space to play the full image sequence.
    // Mobile: section fills screen immediately on snap, so we track from
    //         "start start" so progress fires as the element enters the top.
    offset: isDesktop
      ? (["start end", "end end"] as const)
      : (["start start", "end end"] as const),
  });

  const currentIndex = useTransform(
    scrollYProgress,
    [0.25, 0.75],
    isDesktop
      ? (reverse ? [totalFrames - 1, 0] : [0, totalFrames - 1])
      : [0, 0]
  );

  const renderCanvas = useCallback(
    (index: number) => {
      if (!images || images.length === 0 || !images[index]) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentImg = images[index];

      // Handle high-DPI displays for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Set actual memory size scaled by pixel density
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Normalize coordinate system to CSS pixels
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Dynamic object-fit matching for canvas drawing
      const imgRatio = currentImg.width / currentImg.height;
      const canvasRatio = rect.width / rect.height;

      let drawWidth: number,
        drawHeight: number,
        offsetX: number,
        offsetY: number;

      if (objectFit === "contain") {
        if (imgRatio > canvasRatio) {
          drawWidth = rect.width;
          drawHeight = rect.width / imgRatio;
          offsetX = 0;
          offsetY = (rect.height - drawHeight) / 2;
        } else {
          drawHeight = rect.height;
          drawWidth = rect.height * imgRatio;
          offsetY = 0;
          offsetX = (rect.width - drawWidth) / 2;
        }
      } else {
        // cover
        if (imgRatio > canvasRatio) {
          drawHeight = rect.height;
          drawWidth = rect.height * imgRatio;
          offsetY = 0;
          offsetX = (rect.width - drawWidth) / 2;
        } else {
          drawWidth = rect.width;
          drawHeight = rect.width / imgRatio;
          offsetX = 0;
          offsetY = (rect.height - drawHeight) / 2;
        }
      }

      ctx.drawImage(currentImg, offsetX, offsetY, drawWidth, drawHeight);
    },
    [images, objectFit]
  );

  useMotionValueEvent(currentIndex, "change", (latest) => {
    requestAnimationFrame(() => renderCanvas(Math.round(latest)));
  });

  // Render first frame as soon as images are loaded
  useEffect(() => {
    if (loaded && images.length > 0) {
      renderCanvas(0);
    }
  }, [loaded, images, renderCanvas]);

  // Re-render on window resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => renderCanvas(Math.round(currentIndex.get())));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [loaded, images, currentIndex, renderCanvas]);

  const heightMultiplier = isDesktop ? 4 : 1.0;
  // Mobile: snap makes the section fill the screen at ~0.35 progress.
  // We show the overlay text as soon as the section is snapped in.
  const triggerThreshold = isDesktop ? 0.25 : 0.35;

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: `calc(${heightMultiplier} * var(--scroll-content-height, 100vh))` }}
    >
      <div
        className="sticky top-0 w-full flex items-center justify-center overflow-hidden bg-background-dark"
        style={{
          height: "var(--scroll-content-height, 100vh)",
          backgroundImage: backgroundImage
            ? `url('${backgroundImage}')`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background-dark z-50 transition-opacity duration-1000">
            <span className="text-white/30 tracking-[0.2em] text-sm font-medium animate-pulse">
              LOADING EXPERIENCE...
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full pointer-events-none"
          style={{ willChange: "transform" }}
        />

        {/* Cinematic UI overlays synchronized to scroll */}
        <OverlayText
          scrollYProgress={scrollYProgress}
          topHeading={topHeading}
          bottomHeading={bottomHeading}
          leftHeading={leftHeading}
          rightHeading={rightHeading}
          triggerThreshold={triggerThreshold}
        />
      </div>
    </div>
  );
}
