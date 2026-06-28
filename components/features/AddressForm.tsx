"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Address } from '@/lib/supabase';

interface AddressFormProps {
    initialData?: Partial<Address> | null;
    onSave?: (data: Omit<Address, 'id' | 'created_at'>) => Promise<void>;
    onChange?: (data: Omit<Address, 'id' | 'created_at'>) => void;
    isSubmitting?: boolean;
    submitButtonText?: string;
    showSubmitButton?: boolean;
    hideDefaultCheckbox?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    initialData,
    onSave,
    onChange,
    isSubmitting: externalIsSubmitting,
    submitButtonText = "Save Address",
    showSubmitButton = true,
    hideDefaultCheckbox = false
}) => {
    const [formData, setFormData] = useState({
        label: '',
        receiver_name: '',
        receiver_email: '',
        receiver_phone: '',
        house_building_name: '',
        area_sector: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        is_default: false,
    });
    const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

    const isSubmitting = externalIsSubmitting ?? internalIsSubmitting;

    useEffect(() => {
        if (initialData) {
            setFormData({
                label: initialData.label || '',
                receiver_name: initialData.receiver_name || '',
                receiver_email: initialData.receiver_email || '',
                receiver_phone: initialData.receiver_phone || '',
                house_building_name: initialData.house_building_name || '',
                area_sector: initialData.area_sector || '',
                city: initialData.city || '',
                state: initialData.state || '',
                postal_code: initialData.postal_code || '',
                country: initialData.country || 'India',
                is_default: initialData.is_default || false,
            });
        }
    }, [initialData]);

    const handleChange = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        if (onChange) {
            onChange(newData as any);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;

        setInternalIsSubmitting(true);
        try {
            await onSave(formData as any);
        } catch (error) {
            console.error("Failed to save address:", error);
        } finally {
            setInternalIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                    <Input
                        id="form-label"
                        label="Address Label (Nickname)"
                        placeholder="e.g. Home, Office"
                        value={formData.label}
                        onChange={(e) => handleChange('label', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-receiver-name"
                        label="Receiver Name"
                        placeholder="FULL NAME"
                        value={formData.receiver_name}
                        onChange={(e) => handleChange('receiver_name', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-receiver-email"
                        label="Receiver Email"
                        placeholder="EMAIL@DOMAIN.COM"
                        type="email"
                        value={formData.receiver_email}
                        onChange={(e) => handleChange('receiver_email', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-receiver-phone"
                        label="Receiver Phone"
                        placeholder="+91..."
                        type="tel"
                        value={formData.receiver_phone}
                        onChange={(e) => handleChange('receiver_phone', e.target.value)}
                        required
                    />
                </div>
                
                <div className="md:col-span-2 mt-4 pt-4 border-t border-white/10">
                    <label className="block text-xs font-black tracking-widest text-white/50 mb-4 uppercase">Address Details</label>
                </div>

                <div className="md:col-span-2">
                    <Input
                        id="form-house-building"
                        label="House Number & Building Name"
                        placeholder="FLAT 101, TOWER A, SUNSHINE APTS"
                        value={formData.house_building_name}
                        onChange={(e) => handleChange('house_building_name', e.target.value)}
                        required
                    />
                </div>
                <div className="md:col-span-2">
                    <Input
                        id="form-area"
                        label="Area, Sector or Colony"
                        placeholder="SECTOR 62, INDUSTRIAL AREA"
                        value={formData.area_sector}
                        onChange={(e) => handleChange('area_sector', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-city"
                        label="City"
                        placeholder="CITY"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-state"
                        label="State"
                        placeholder="STATE"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Input
                        id="form-postcode"
                        label="PIN Code"
                        placeholder="POSTCODE/PIN"
                        value={formData.postal_code}
                        onChange={(e) => handleChange('postal_code', e.target.value)}
                        required
                    />
                </div>
            </div>

            {!hideDefaultCheckbox && (
                <div className="flex items-center gap-3 py-2 md:py-4">
                    <input
                        type="checkbox"
                        id="form-set-default"
                        className="w-4 h-4 border-2 border-white bg-black checked:bg-white accent-white cursor-pointer"
                        checked={formData.is_default}
                        onChange={(e) => handleChange('is_default', e.target.checked)}
                    />
                    <label htmlFor="form-set-default" className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase cursor-pointer select-none">
                        Set as default shipping address
                    </label>
                </div>
            )}

            {showSubmitButton && (
                <div className="pt-4 md:pt-6 pb-2">
                    <Button type="submit" fullWidth className="tracking-[0.3em]" disabled={isSubmitting}>
                        {isSubmitting ? 'SAVING...' : submitButtonText}
                    </Button>
                </div>
            )}
        </form>
    );
};
