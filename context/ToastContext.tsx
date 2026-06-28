"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-24 right-6 z-[100] flex flex-col gap-4 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto min-w-[300px] p-4 bg-black border border-white/20 shadow-2xl animate-in slide-in-from-right fade-in duration-300 flex items-center gap-4"
                    >
                        <span className={`material-symbols-outlined text-xl ${toast.type === 'success' ? 'text-green-500' :
                            toast.type === 'error' ? 'text-red-500' : 'text-white'
                            }`}>
                            {toast.type === 'success' ? 'check_circle' :
                                toast.type === 'error' ? 'error' : 'info'}
                        </span>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="ml-auto text-white/40 hover:text-white">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
