import { useState, useEffect } from "react";

/**
 * Preloads a sequence of images and returns them as HTMLImageElement objects.
 * Ported from mm-v2 for the cinematic scroll animations.
 *
 * @param totalFrames Number of frames to load
 * @param framePath Function to resolve a frame index to a URL path
 * @returns { images: HTMLImageElement[], loaded: boolean }
 */
export function useImagePreloader(
  totalFrames: number,
  framePath: (index: number) => string
) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, [totalFrames, framePath]);

  return { images, loaded };
}
