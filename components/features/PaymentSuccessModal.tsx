"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PaymentSuccessModalProps {
    isOpen: boolean;
    orderId?: string;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ isOpen, orderId }) => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, router]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl"></div>
            
            {/* Background Typography Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-col justify-center select-none">
                <div className="text-[20vw] font-black text-white/5 whitespace-nowrap leading-none -ml-20">SUCCESS SUCCESS</div>
                <div className="text-[20vw] font-black text-outline opacity-10 whitespace-nowrap leading-none">CHECKOUT OK</div>
                <div className="text-[20vw] font-black text-white/5 whitespace-nowrap leading-none -ml-40">ORDER COMPLETE</div>
            </div>

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-2xl px-6 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-5xl text-white">check</span>
                    </div>
                </div>

                <h2 className="font-display text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 text-white">
                    Order Placed
                </h2>
                <p className="font-display text-xs md:text-sm font-black tracking-[0.4em] text-white/40 uppercase mb-12">
                    Order ID: <span className="text-white">{orderId || 'PROCESSING...'}</span>
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center mb-16">
                    <Button 
                        onClick={() => router.push('/explore')}
                        className="min-w-[240px] tracking-[0.3em] bg-white text-black hover:bg-white/90"
                    >
                        CONTINUE SHOPPING
                    </Button>
                    <Button 
                        onClick={() => router.push('/account?section=orders')}
                        variant="secondary"
                        className="min-w-[240px] tracking-[0.3em] border-white/20 hover:border-white text-white"
                    >
                        GO TO ORDERS
                    </Button>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 10) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase mt-2">
                        Redirecting to home in <span className="text-white">{countdown}s</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
