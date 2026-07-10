"use client";
import React, { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-white/80">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
                    className={`w-full p-4 bg-transparent border border-white/20 text-white focus:ring-1 focus:ring-white focus:border-white text-base tracking-widest placeholder:text-white/20 outline-none transition-all ${isPasswordType ? 'pr-12' : ''} ${className}`}
                    {...props}
                />
                {isPasswordType && (
                    <button
                        type="button"
                        onClick={handleTogglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors flex items-center justify-center p-1 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-lg leading-none">
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};
