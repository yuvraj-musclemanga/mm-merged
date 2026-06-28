import React, { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonBaseProps = {
    variant?: 'primary' | 'secondary' | 'text';
    fullWidth?: boolean;
    className?: string;
    children: React.ReactNode;
};

// Types for button vs link usage
type ButtonAsButton = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
    as?: never;
};

type ButtonAsLink = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    as?: React.ElementType; // Allow 'as' but ignore it since we use Next Link
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    fullWidth = false,
    className = '',
    href,
    ...props
}) => {
    const baseStyles = "font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex";

    const variants = {
        primary: "bg-white text-black hover:bg-neutral-200 py-4 px-8 text-xs md:text-sm",
        secondary: "border border-white/20 hover:border-white text-white py-4 px-8 text-xs md:text-sm",
        text: "text-white/60 hover:text-white bg-transparent py-2 text-xs"
    };

    const widthClass = fullWidth ? "w-full" : "";
    const combinedClassName = `${baseStyles} ${variants[variant]} ${widthClass} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClassName} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
                {children}
            </Link>
        );
    }

    return (
        <button
            className={combinedClassName}
            {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            {children}
        </button>
    );
};
