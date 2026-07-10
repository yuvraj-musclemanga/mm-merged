"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { H2, H3, Label } from '@/components/ui/Typography';
import { AddressModal } from '@/components/features/AddressModal';
import { AddressForm } from '@/components/features/AddressForm';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getAddresses, addAddress, updateAddress, setDefaultAddress, Address, supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { PaymentSuccessModal } from '@/components/features/PaymentSuccessModal';

export default function CartPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const { items, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

    // Checkout states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percentage: number } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<string>('');
    const { toggleWishlist } = useWishlist();
    const [removingItem, setRemovingItem] = useState<string | null>(null);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code.');
            setAppliedCoupon(null);
            return;
        }

        setIsValidatingCoupon(true);
        setCouponError('');
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ couponCode: couponCode.trim() })
            });

            const data = await res.json();
            if (res.ok) {
                setAppliedCoupon({
                    code: data.code,
                    discount_percentage: data.discount_percentage
                });
            } else {
                setCouponError(data.error || 'Invalid coupon code.');
                setAppliedCoupon(null);
            }
        } catch (err) {
            console.error('Failed to validate coupon', err);
            setCouponError('Could not validate coupon.');
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handleMoveToWishlist = async (id: string, size: string) => {
        await toggleWishlist(id);
        removeFromCart(id, size);
        setRemovingItem(null);
    };

    const [guestAddress, setGuestAddress] = useState<Omit<Address, 'id' | 'created_at'>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('guestAddress');
            return saved ? JSON.parse(saved) : {
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
            };
        }
        return {
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
        };
    });

    useEffect(() => {
        fetchAddresses();
    }, [user]);

    useEffect(() => {
        if (!user && guestAddress) {
            localStorage.setItem('guestAddress', JSON.stringify(guestAddress));
        }
    }, [guestAddress, user]);

    useEffect(() => {
        const syncAddress = async () => {
            if (user && !isLoadingAddresses) {
                const savedGuestAddress = localStorage.getItem('guestAddress');
                if (savedGuestAddress) {
                    try {
                        const address = JSON.parse(savedGuestAddress);
                        const isFilled = address.house_building_name && address.postal_code && address.city;
                        if (isFilled && addresses.length === 0) {
                            await handleSaveAddress(address);
                        }
                    } catch (e) {
                        console.error("Failed to sync guest address", e);
                    }
                    localStorage.removeItem('guestAddress');
                }
            }
        };
        syncAddress();
    }, [user, isLoadingAddresses, addresses]);

    const fetchAddresses = async () => {
        if (!user) {
            setIsLoadingAddresses(false);
            setAddresses([]);
            return;
        }
        setIsLoadingAddresses(true);
        const { data, error } = await getAddresses(user.uid);
        if (!error && data) {
            setAddresses(data);
        }
        setIsLoadingAddresses(false);
    };

    const handleSaveAddress = async (data: Omit<Address, 'id' | 'created_at'>, addressId?: string) => {
        if (!user) return;
        const addressData = { ...data, user_id: user.uid };
        const shouldBeDefault = addresses.length === 0 || data.is_default;
        addressData.is_default = shouldBeDefault;

        if (addressId) {
            const { error } = await updateAddress(addressId, addressData);
            if (error) {
                alert(`FAILED TO UPDATE ADDRESS: ${error.message}\n${error.hint || ''}`);
                return;
            }
        } else {
            const { data: created, error } = await addAddress(addressData);
            if (error) {
                alert(`FAILED TO SAVE ADDRESS: ${error.message}\n${error.hint || ''}\n\nThis usually happens if your user record is missing in the database. Run the sync SQL script to fix this.`);
                return;
            }
            if (created && shouldBeDefault) {
                await setDefaultAddress(user.uid, created.id);
            }
        }
        await fetchAddresses();
        setIsAddressModalOpen(false);
        setEditingAddress(null);
    };

    const handleSelectDefault = async (id: string) => {
        if (!user) return;
        await setDefaultAddress(user.uid, id);
        await fetchAddresses();
    };

    // --- Razorpay Payment Logic ---
    const initializeRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCheckout = async () => {
        if (!user) {
            alert('Please login to place an order.');
            return;
        }

        const selectedAddress = addresses.find(a => a.is_default) || addresses[0];
        if (!selectedAddress) {
            alert("Please save or select a shipping address first.");
            return;
        }

        if (items.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        setIsProcessingPayment(true);
        let paymentFlowInitiated = false;
        try {
            const isScriptLoaded = await initializeRazorpay();
            if (!isScriptLoaded) {
                alert("Payment gateway failed to load. Please check your connection.");
                setIsProcessingPayment(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                alert("Session expired. Please log in again.");
                setIsProcessingPayment(false);
                return;
            }

            // 1. Create Order securely
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    addressId: selectedAddress.id,
                    couponCode: appliedCoupon ? appliedCoupon.code : ''
                })
            });

            const orderData = await res.json();
            if (!res.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }


            // 2. Setup Razorpay Frontend options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "MuscleManga",
                description: "Order Checkout",
                order_id: orderData.razorpayOrderId,
                handler: async function (response: any) {
                    // Re-assert processing overlay since Razorpay modal closed
                    setIsProcessingPayment(true);

                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                internalOrderId: orderData.orderId
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            setSuccessOrderId(orderData.orderId);
                            setIsPaymentSuccessModalOpen(true);
                            setIsProcessingPayment(false);
                        } else {
                            alert(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
                            console.error(verifyData.error);
                            setIsProcessingPayment(false);
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("An error occurred during payment verification.");
                        setIsProcessingPayment(false);
                    }
                },
                prefill: {
                    name: user.username || selectedAddress.receiver_name || '',
                    email: user.email || selectedAddress.receiver_email || '',
                    contact: user.phone || selectedAddress.receiver_phone || ''
                },
                theme: { color: "#FFFFFF" },
                modal: {
                    ondismiss: function () {
                        // If they dismiss the Razorpay checkout, remove overlay
                        setIsProcessingPayment(false);
                    }
                }
            };

            paymentFlowInitiated = true;
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error("Payment failed", response.error);
                alert("Payment Failed. Try again.");
                setIsProcessingPayment(false);
            });
            rzp.open();

        } catch (error: any) {
            console.error(error);
            alert(`Checkout Error: ${error.message}`);
            setIsProcessingPayment(false);
        } finally {
            // Only turn off processing overlay if we failed BEFORE launching Razorpay.
            // If Razorpay opened, let the Razorpay event handlers / verify endpoint control isProcessingPayment.
            if (!paymentFlowInitiated) {
                setIsProcessingPayment(false);
            }
        }
    };


    return (
        <main className="relative z-10 max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20 grow">
            <div className="mb-10">
                <Link href="/" className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest border-b border-transparent hover:border-white transition-all w-fit">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Continue Shopping
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-20">
                    <section>
                        <div className="flex items-end justify-between mb-10 pb-4 border-b border-white/10">
                            <H2 className="text-3xl">Your Bag <span className="text-white/40 ml-2">({cartCount})</span></H2>
                        </div>

                        <div className="space-y-0">
                            {items.length === 0 ? (
                                <div className="py-20 text-center border-b border-white/10">
                                    <p className="text-white/40 font-bold uppercase tracking-widest">Your bag is empty.</p>
                                    <Link href="/explore" className="inline-block mt-4 text-xs font-black uppercase tracking-widest border-b border-white hover:text-white/60 transition-colors">Start Shopping</Link>
                                </div>
                            ) : (
                                items.map((item, index) => {
                                    const itemId = `${item.id}-${item.size}`;
                                    const isRemoving = removingItem === itemId;

                                    return (
                                        <div key={itemId} className="py-8 flex gap-8 items-start border-b border-white/10 last:border-0">
                                            <div className="w-32 h-40 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url("${item.image}")` }}></div>
                                            <div className="flex-grow flex flex-col md:flex-row justify-between gap-6">
                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-black tracking-[0.1em]">{item.name}</h3>
                                                    <p className="text-[10px] text-white/40 font-bold tracking-[0.15em]">Size: {item.size}</p>
                                                    <p className="text-xs font-display font-bold mt-4">₹{item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-12">
                                                    {!isRemoving && (
                                                        <div className="flex items-center border border-white/20">
                                                            <button onClick={() => updateQuantity(item.id, item.size, -1)} className="p-2 hover:bg-white hover:text-black transition-colors">
                                                                <span className="material-symbols-outlined text-sm">remove</span>
                                                            </button>
                                                            <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, item.size, 1)} className="p-2 hover:bg-white hover:text-black transition-colors">
                                                                <span className="material-symbols-outlined text-sm">add</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4">
                                                        {isRemoving ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleMoveToWishlist(item.id, item.size)}
                                                                    className="text-[9px] font-black tracking-widest text-white border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all"
                                                                >
                                                                    SAVE TO WISHLIST
                                                                </button>
                                                                <button
                                                                    onClick={() => { removeFromCart(item.id, item.size); setRemovingItem(null); }}
                                                                    className="text-[9px] font-black tracking-widest text-red-500 border border-red-500/20 px-4 py-2 hover:bg-red-500 hover:text-white transition-all"
                                                                >
                                                                    DELETE
                                                                </button>
                                                                <button
                                                                    onClick={() => setRemovingItem(null)}
                                                                    className="material-symbols-outlined text-white/20 hover:text-white"
                                                                >
                                                                    close
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => setRemovingItem(itemId)}
                                                                className="text-[10px] font-black tracking-widest text-white/40 hover:text-white underline decoration-white/20 underline-offset-4"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-10">
                            <H2 className="text-2xl">{user ? 'Saved Addresses' : 'Shipping Details'}</H2>
                            {user && (
                                <button onClick={() => setIsAddressModalOpen(true)} className="text-[10px] font-black tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all">
                                    + Add New Address
                                </button>
                            )}
                        </div>

                        {!user ? (
                            <div className="bg-card-dark border border-white/10 p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                                <span className="material-symbols-outlined text-4xl text-white/20 mb-4">lock</span>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.25em] leading-relaxed mb-6 max-w-sm">
                                    Please log in to add shipping details and proceed to checkout.
                                </p>
                                <Button 
                                    className="tracking-[0.2em]"
                                    onClick={() => window.dispatchEvent(new Event('open-login-modal'))}
                                >
                                    LOG IN TO CHECKOUT
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isLoadingAddresses ? (
                                    <div className="col-span-2 py-10 text-center border border-dashed border-white/10">
                                        <p className="text-[10px] font-black tracking-widest text-white/20 uppercase">Loading Addresses...</p>
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="col-span-2 py-10 text-center border border-dashed border-white/10">
                                        <p className="text-[10px] font-black tracking-widest text-white/20 uppercase">No addresses found</p>
                                    </div>
                                ) : (
                                    addresses.map((addr) => (
                                        <div key={addr.id} className={`p-6 relative transition-all cursor-pointer ${addr.is_default ? 'border-2 border-white bg-white/5' : 'border border-white/10 hover:border-white/40'}`} onClick={() => !addr.is_default && handleSelectDefault(addr.id)}>
                                            {addr.is_default && (
                                                <div className="absolute top-4 right-4">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
                                                    {addr.is_default ? 'Default Shipping' : 'Shipping Address'}
                                                </h4>
                                                {addr.label && <span className="text-[9px] font-bold bg-white/10 px-2 py-1 rounded tracking-widest">{addr.label}</span>}
                                            </div>
                                            <p className="text-xs font-bold tracking-widest leading-loose">
                                                <strong className="text-white">{addr.receiver_name}</strong><br />
                                                {addr.house_building_name}, {addr.area_sector}<br />
                                                {addr.city}, {addr.state} - {addr.postal_code}<br />
                                                {addr.country}<br />
                                                <span className="text-[10px] text-white/50">{addr.receiver_phone}</span>
                                            </p>
                                            <div className="flex gap-4 mt-8">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingAddress(addr); setIsAddressModalOpen(true); }} className={`flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all ${addr.is_default ? 'bg-white text-black' : 'border border-white/20 text-white hover:bg-white hover:text-black'}`}>
                                                    {addr.is_default ? 'Selected' : 'Select'}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingAddress(addr); setIsAddressModalOpen(true); }} className="px-4 border border-white/20 text-white/40 hover:text-white transition-colors flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-4">
                    <div className="sticky top-40 bg-card-dark border border-white/10 p-8 lg:p-10">
                        <H3 className="text-lg mb-8 pb-4 border-b border-white/10">Order Summary</H3>
                        {(() => {
                            const discountAmount = appliedCoupon ? cartTotal * (appliedCoupon.discount_percentage / 100) : 0;
                            const finalTotal = cartTotal - discountAmount;

                            return (
                                <>
                                    <div className="space-y-4 mb-10">
                                        <div className="flex justify-between text-[10px] font-black tracking-widest text-white/60">
                                            <span>Subtotal</span>
                                            <span>₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-[10px] font-black tracking-widest text-green-400">
                                                <span>Discount ({appliedCoupon.code} - {appliedCoupon.discount_percentage}%)</span>
                                                <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[10px] font-black tracking-widest text-white/60">
                                            <span>Shipping</span>
                                            <span>FREE</span>
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                                            <span className="text-xs font-black tracking-[0.2em]">Total</span>
                                            <span className="text-2xl font-display font-bold">
                                                ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <Label className="mb-2 block">Discount Code</Label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                className="flex-grow min-w-0 p-4 bg-transparent border border-white/20 text-base tracking-widest outline-none focus:border-white disabled:opacity-50"
                                                placeholder="Enter code"
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value);
                                                    if (couponError) setCouponError('');
                                                }}
                                                disabled={isValidatingCoupon || isProcessingPayment || !!appliedCoupon}
                                            />
                                            {appliedCoupon ? (
                                                <button
                                                    onClick={handleRemoveCoupon}
                                                    className="shrink-0 px-4 py-3 sm:py-0 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                                                    type="button"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="shrink-0 px-4 py-3 sm:py-0 border border-white text-white hover:bg-white hover:text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                    disabled={isValidatingCoupon || isProcessingPayment || !couponCode.trim()}
                                                    type="button"
                                                >
                                                    {isValidatingCoupon ? '...' : 'Apply'}
                                                </button>
                                            )}
                                        </div>
                                        {couponError && (
                                            <p className="mt-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">{couponError}</p>
                                        )}
                                        {appliedCoupon && (
                                            <p className="mt-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">✓ Coupon code applied successfully</p>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        <Button
                            fullWidth
                            className="tracking-[0.3em] mb-4"
                            onClick={handleCheckout}
                            disabled={isProcessingPayment || items.length === 0 || !user}
                        >
                            {isProcessingPayment ? 'PROCESSING SECURELY...' : 'PROCEED TO PAYMENT'}
                        </Button>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[9px] font-bold text-white/40 tracking-widest">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Secure 256-bit SSL Encrypted Payment
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold text-white/40 tracking-widest">
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                Ships within 48 hours
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                }}
                initialData={editingAddress}
                onSave={handleSaveAddress}
            />
            <PaymentSuccessModal
                isOpen={isPaymentSuccessModalOpen}
                orderId={successOrderId}
            />

            {/* Full-screen Payment Processing Overlay */}
            {isProcessingPayment && (
                <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center select-none cursor-wait">
                    {/* Inline CSS to disable scroll when overlay is active */}
                    <style jsx global>{`
                        html, body {
                            overflow: hidden !important;
                            touch-action: none !important;
                        }
                    `}</style>
                    <div className="animate-spin size-12 border-4 border-white/20 border-t-white rounded-full mb-8"></div>
                    <H2 className="text-xl md:text-2xl mb-4 tracking-[0.2em] uppercase font-bold text-white">
                        Processing Secure Payment
                    </H2>
                    <div className="h-1 w-20 bg-white mb-6"></div>
                    <p className="text-xs md:text-sm font-black uppercase tracking-[0.15em] text-red-500 max-w-md leading-relaxed animate-pulse">
                        ⚠️ DO NOT PRESS THE BACK BUTTON, REFRESH THE PAGE, OR CLOSE THE BROWSER.
                    </p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40 mt-4 max-w-sm">
                        Securing your transaction with Razorpay. This might take a few moments.
                    </p>
                </div>
            )}
        </main>
    );
}

