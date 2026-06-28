import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-white/80">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full p-4 bg-transparent border border-white/20 text-white focus:ring-1 focus:ring-white focus:border-white uppercase text-xs tracking-widest placeholder:text-white/20 outline-none transition-all resize-y ${className}`}
                {...props}
            />
        </div>
    );
};
