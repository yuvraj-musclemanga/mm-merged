import React from 'react';

interface MarqueeProps {
    children: React.ReactNode;
    className?: string;
    reverse?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({ children, className = "", reverse = false }) => {
    return (
        <div className={`w-full overflow-hidden whitespace-nowrap ${className}`}>
            <div className={`flex w-max ${reverse ? 'animate-marquee-reverse-direct' : 'animate-marquee-direct'}`}>
                <div className="flex shrink-0 gap-4">
                    {children} {children} {children} {children}
                </div>
                <div className="flex shrink-0 gap-4">
                    {children} {children} {children} {children}
                </div>
            </div>
        </div>
    );
};
