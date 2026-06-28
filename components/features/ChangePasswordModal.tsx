"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H2 } from '@/components/ui/Typography';
import { useAuth } from '@/context/AuthContext';

import { Portal } from '@/components/ui/Portal';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { changePassword } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        // ... rest of logic ...
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            setIsSubmitting(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            setIsSubmitting(false);
            return;
        }

        const result = await changePassword(formData.currentPassword, formData.newPassword);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }, 2000);
        } else {
            setError(result.error?.message || 'Failed to update password');
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
                            <span className="font-display text-[10px] tracking-[0.5em] text-white/50 uppercase">Security</span>
                        </div>
                        <H2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none uppercase">Change Password</H2>
                        <div className="h-2 w-20 bg-white mt-4"></div>
                    </div>

                    {success ? (
                        <div className="py-12 text-center space-y-6">
                            <div className="w-20 h-20 border-4 border-green-500 rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-green-500 text-5xl">check</span>
                            </div>
                            <p className="font-display font-black tracking-widest text-xl uppercase">Password Updated</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Security session refreshed</p>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-[10px] font-black tracking-widest uppercase">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6">
                                <Input
                                    id="current-password"
                                    label="Current Password"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                                <div className="h-px w-full bg-white/10" />
                                <Input
                                    id="new-password"
                                    label="New Password"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                                <Input
                                    id="confirm-password"
                                    label="Confirm New Password"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="pt-4 flex flex-col md:flex-row gap-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 tracking-[0.3em]"
                                >
                                    {isSubmitting ? 'VERIFYING...' : 'UPDATE PASSWORD'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Portal>
    );
};

