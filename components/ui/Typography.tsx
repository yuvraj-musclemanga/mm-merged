import React, { HTMLAttributes } from 'react';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

export const H1: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
    <h1 className={`font-display font-bold uppercase tracking-tighter leading-none ${className}`} {...props}>
        {children}
    </h1>
);

export const H2: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
    <h2 className={`font-display font-bold uppercase tracking-tighter ${className}`} {...props}>
        {children}
    </h2>
);

export const H3: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
    <h3 className={`font-display font-bold uppercase tracking-tighter ${className}`} {...props}>
        {children}
    </h3>
);

export const Label: React.FC<TypographyProps> = ({ children, className = '', ...props }) => (
    <span className={`font-black uppercase tracking-[0.2em] text-[10px] md:text-xs ${className}`} {...props}>
        {children}
    </span>
);
