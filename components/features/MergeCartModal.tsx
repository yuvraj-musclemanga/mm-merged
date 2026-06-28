import React from 'react';

interface MergeCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMerge: () => void;
    onReplace: () => void;
}

export const MergeCartModal: React.FC<MergeCartModalProps> = ({ 
    isOpen, 
    onClose, 
    onMerge, 
    onReplace 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card-dark border border-white/10 w-full max-w-lg p-8 relative flex flex-col items-center text-center">
                
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl text-white">shopping_cart_checkout</span>
                </div>

                <h3 className="text-xl font-display font-bold mb-4 uppercase tracking-[0.1em]">
                    Cart Conflict Detected
                </h3>
                
                <p className="text-sm font-bold text-white/50 tracking-widest leading-relaxed mb-8">
                    We found items in your previous shopping and your current guest cart. How would you like to handle them?
                </p>

                <div className="flex flex-col w-full gap-4">
                    <button 
                        onClick={onMerge} 
                        className="w-full py-4 bg-white text-black text-xs font-black tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
                    >
                        Merge Carts
                    </button>
                    
                    <button 
                        onClick={onReplace} 
                        className="w-full py-4 border border-white/20 text-white text-xs font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
                    >
                        Replace Previous Cart
                    </button>

                    <button 
                        onClick={onClose} 
                        className="mt-4 text-[10px] text-white/40 tracking-widest uppercase hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                    >
                        Keep Existing Cart & Clear Guest Cart
                    </button>
                </div>
            </div>
        </div>
    );
};
