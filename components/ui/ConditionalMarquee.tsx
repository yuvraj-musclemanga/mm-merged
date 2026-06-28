"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Marquee } from './Marquee';

interface ConditionalMarqueeProps {
    children: React.ReactNode;
    className?: string; // Allow passing styles like text-outline
}

export const ConditionalMarquee: React.FC<ConditionalMarqueeProps> = ({ children, className = '' }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const textWidth = textRef.current.scrollWidth;

                // User requested: "if the unbrekable span width is more than the parent h1 width"
                // Since this component is a child of H1 and has w-full, containerWidth === parent H1 width.
                // We add a small 1px buffer to avoid sub-pixel rounding errors.
                setIsOverflowing(textWidth > containerWidth + 1);
            }
        };

        // Check initially
        checkOverflow();

        // Check after fonts have loaded
        if (document.fonts) {
            document.fonts.ready.then(() => {
                checkOverflow();
            });
        }

        // Check on resize
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    if (isOverflowing) {
        return (
            <Marquee className={className}>
                <span className="mr-8 inline-block">{children}</span>
            </Marquee>
        );
    }

    // When not overflowing, we use w-full to match parent width, 
    // ensuring clientWidth measurement is accurate to the parent's constraint.
    return (
        <div className={`w-full whitespace-nowrap overflow-hidden ${className}`} ref={containerRef}>
            <span ref={textRef} className="inline-block">
                {children}
            </span>
        </div>
    );
};
