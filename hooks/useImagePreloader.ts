import { useState, useEffect } from "react";

/**
 * Preloads a sequence of images and returns them as HTMLImageElement objects.
 * Ported from mm-v2 for the cinematic scroll animations.
 *
 * @param totalFrames  Number of frames to load
 * @param framePath    Function to resolve a frame index to a URL path
 * @param enabled      Set to true to begin loading (default: true).
 *                     Pass false to defer loading until the section is near
 *                     the viewport — critical on mobile to avoid OOM crashes.
 * @returns { images: HTMLImageElement[], loaded: boolean }
 */
export function useImagePreloader(
  totalFrames: number,
  framePath: (index: number) => string,
  enabled: boolean = true
) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Do not start loading until the caller says it's safe to do so.
    // This prevents loading all ~288 frames at page startup on mobile.
    if (!enabled) return;

    let isCancelled = false;
    const imgArray: HTMLImageElement[] = [];

    const loadImages = async () => {
      const promises = [];

      for (let i = 1; i <= totalFrames; i++) {
        const img = new window.Image();
        const src = framePath(i);
        img.src = src;

        // Many browsers limit concurrent decode() calls.
        // We catch and swallow EncodingErrors and fall back to onload.
        const p = new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();

          img.decode().then(resolve).catch(() => {
            // Silently swallow decode errors (resource limits); rely on onload
          });
        });

        imgArray.push(img);
        promises.push(p);
      }

      await Promise.all(promises);

      if (!isCancelled) {
        setImages(imgArray);
        setLoaded(true);
      }
    };

    loadImages();

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, framePath, enabled]);

  return { images, loaded };
}
