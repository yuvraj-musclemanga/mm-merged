"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H2 } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';

import { Portal } from '@/components/ui/Portal';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                phone: user.phone || '',
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await updateProfile(formData);

        if (result.success) {
            onClose();
        } else {
            setError(result.error?.message || 'Failed to update profile');
        }
        setIsSubmitting(false);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
                <div className="relative w-full max-w-xl bg-black border-4 border-white p-8 md:p-12 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-white/60 transition-colors">
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px w-8 bg-white/30"></div>
                            <span className="font-display text-[10px] tracking-[0.5em] text-white/50 uppercase">Settings</span>
                        </div>
                        <H2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none uppercase">Edit Profile</H2>
                        <div className="h-2 w-20 bg-white mt-4"></div>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-[10px] font-black tracking-widest uppercase">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <Input
                                id="edit-username"
                                label="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="YOUR_USERNAME"
                                required
                            />
                            <Input
                                id="edit-phone"
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+44 0000 000000"
                                type="tel"
                            />
                        </div>

                        <div className="pt-4 flex flex-col md:flex-row gap-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 tracking-[0.3em]"
                            >
                                {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                            </Button>
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="secondary"
                                className="md:w-1/3 tracking-[0.3em] opacity-50 hover:opacity-100"
                            >
                                CANCEL
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
};

