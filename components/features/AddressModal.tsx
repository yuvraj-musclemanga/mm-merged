"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H2 } from '@/components/ui/Typography';
import { Address } from '@/lib/supabase';

import { Portal } from '@/components/ui/Portal';

import { AddressForm } from './AddressForm';

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Address | null;
    onSave: (data: Omit<Address, 'id' | 'created_at'>, addressId?: string) => Promise<void>;
}

export const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
    if (!isOpen) return null;

    const handleSave = async (data: Omit<Address, 'id' | 'created_at'>) => {
        await onSave(data, initialData?.id);
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
                <div className="relative w-full max-w-2xl bg-black border-4 border-white p-6 md:p-12 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] max-h-[90vh] overflow-y-auto no-scrollbar">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-white/60 transition-colors z-10">
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <div className="mb-6 md:mb-10">
                        <H2 className="text-2xl md:text-3xl leading-none uppercase">
                            {initialData ? '02 / Edit Address' : '02 / Add New Address'}
                        </H2>
                        <div className="h-1 w-20 bg-white mt-4"></div>
                    </div>
                    
                    <AddressForm 
                        initialData={initialData} 
                        onSave={handleSave} 
                        submitButtonText={initialData ? 'Update Address' : 'Save Address'}
                    />
                </div>
            </div>
        </Portal>
    );
};

