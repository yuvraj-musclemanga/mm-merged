"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EditProfileModal } from '@/components/features/EditProfileModal';
import { ChangePasswordModal } from '@/components/features/ChangePasswordModal';
import { AddressModal } from '@/components/features/AddressModal';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, Address, getUserOrders, getWishlist } from '@/lib/supabase';
import { ProductCard } from '@/components/features/ProductCard';

export default function AccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'profile' | 'wishlist' | 'orders' | 'wallet'>('profile');
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

    useEffect(() => {
        if (user === null) {
            router.push('/');
        } else {
            fetchAddresses();

            // Handle deep linking to sections (e.g., /account?section=orders)
            const params = new URLSearchParams(window.location.search);
            const section = params.get('section');
            if (section === 'orders') setActiveTab('orders');
            else if (section === 'wishlist') setActiveTab('wishlist');
            else if (section === 'wallet') setActiveTab('wallet');
            else if (section === 'profile') setActiveTab('profile');
        }
    }, [user, router]);

    const fetchAddresses = async () => {
        if (!user) return;
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

        // If this is the first address, or specifically requested, make it default
        const shouldBeDefault = addresses.length === 0 || data.is_default;
        addressData.is_default = shouldBeDefault;

        if (addressId) {
            const { data: updated, error } = await updateAddress(addressId, addressData);
            if (error) {
                alert(`FAILED TO UPDATE ADDRESS: ${error.message}\n${error.hint || ''}`);
                return;
            }
            if (updated) {
                if (shouldBeDefault) {
                    await handleSetDefault(updated.id);
                } else {
                    await fetchAddresses();
                }
            }
        } else {
            const { data: created, error } = await addAddress(addressData);
            if (error) {
                alert(`FAILED TO SAVE ADDRESS: ${error.message}\n${error.hint || ''}\n\nThis usually happens if your user record is missing in the database. Run the sync SQL script to fix this.`);
                return;
            }
            if (created) {
                if (shouldBeDefault) {
                    await handleSetDefault(created.id);
                } else {
                    await fetchAddresses();
                }
            }
        }
        setIsAddressModalOpen(false);
        setEditingAddress(null);
    };

    const handleDeleteAddress = async (id: string) => {
        const { error } = await deleteAddress(id);
        if (!error) {
            const deletedWasDefault = addresses.find(a => a.id === id)?.is_default;
            const remainingAddresses = addresses.filter(a => a.id !== id);

            if (deletedWasDefault && remainingAddresses.length > 0) {
                // Set the next available address as default
                await handleSetDefault(remainingAddresses[0].id);
            } else {
                setAddresses(remainingAddresses);
            }
        }
    };

    const handleSetDefault = async (id: string) => {
        if (!user) return;
        const { error } = await setDefaultAddress(user.uid, id);
        if (!error) {
            await fetchAddresses();
        }
    };

    const fetchOrders = async () => {
        if (!user) return;
        setIsLoadingOrders(true);
        const { data, error } = await getUserOrders(user.uid);
        if (!error && data) {
            setOrders(data);
        }
        setIsLoadingOrders(false);
    };

    const fetchWishlistItems = async () => {
        if (!user) return;
        setIsLoadingWishlist(true);
        const { data, error } = await getWishlist(user.uid);
        if (!error && data) {
            // Data has 'products' joined
            setWishlistProducts(data.map(item => item.products));
        }
        setIsLoadingWishlist(false);
    };

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'wishlist') {
            fetchWishlistItems();
        }
    }, [activeTab]);

    if (!user) return null;

    return (
        <div className="flex w-full max-w-[1600px] mx-auto z-10 min-h-screen relative">

            {/* SideNavBar */}
            <aside className="hidden md:flex flex-col pt-12 pb-10 sticky top-0 h-screen w-64 border-r border-white/10 shrink-0">
                <div className="px-8 mb-12">
                    <h2 className="font-display text-white font-black tracking-[0.3em] text-[12px] uppercase" onClick={() => console.log(user)}>
                        {user.username || 'GUEST USER'}
                    </h2>
                    <p className="font-display text-white/40 font-black tracking-[0.3em] text-[10px] uppercase mt-2">
                        STANDARD_MEMBER
                    </p>
                </div>

                <nav className="flex flex-col grow">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-8 py-4 flex items-center gap-4 transition-all duration-200 ease-in-out font-display tracking-[0.3em] text-[10px] font-black uppercase ${activeTab === 'profile' ? 'text-black bg-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">person</span> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('wishlist')}
                        className={`px-8 py-4 flex items-center gap-4 transition-all duration-200 ease-in-out font-display tracking-[0.3em] text-[10px] font-black uppercase ${activeTab === 'wishlist' ? 'text-black bg-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">favorite</span> Wishlist
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-8 py-4 flex items-center gap-4 transition-all duration-200 ease-in-out font-display tracking-[0.3em] text-[10px] font-black uppercase ${activeTab === 'orders' ? 'text-black bg-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">package_2</span> Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`px-8 py-4 flex items-center gap-4 transition-all duration-200 ease-in-out font-display tracking-[0.3em] text-[10px] font-black uppercase ${activeTab === 'wallet' ? 'text-black bg-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span> Wallet
                    </button>

                    <div className="mt-auto px-8">
                        <button
                            onClick={logout}
                            className="w-full bg-white text-black py-4 font-display font-black tracking-[0.3em] text-[10px] uppercase hover:bg-white/80 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Mobile Tab Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-black border-t border-white/20 flex overflow-x-auto no-scrollbar scroll-smooth shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1 transition-all font-display tracking-[0.1em] text-[8px] font-black uppercase ${activeTab === 'profile' ? 'text-black bg-white' : 'text-white/40'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span>Profile</span>
                </button>
                <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1 transition-all font-display tracking-[0.1em] text-[8px] font-black uppercase ${activeTab === 'wishlist' ? 'text-black bg-white' : 'text-white/40'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span>Wishlist</span>
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1 transition-all font-display tracking-[0.1em] text-[8px] font-black uppercase ${activeTab === 'orders' ? 'text-black bg-white' : 'text-white/40'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">package_2</span>
                    <span>Orders</span>
                </button>
                <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1 transition-all font-display tracking-[0.1em] text-[8px] font-black uppercase ${activeTab === 'wallet' ? 'text-black bg-white' : 'text-white/40'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    <span>Wallet</span>
                </button>
                <button
                    onClick={logout}
                    className="flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1 transition-all font-display tracking-[0.1em] text-[8px] font-black uppercase text-white/40"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Logout</span>
                </button>
            </nav>

            {/* Main Content Canvas */}
            <main className="flex-1 p-6 md:p-12 pb-24 md:pb-12 w-full max-w-full overflow-hidden">

                {/* Header Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px w-12 bg-white/30"></div>
                        <span className="font-display text-[10px] tracking-[0.5em] text-white/50 uppercase break-all">
                            Account Dashboard
                        </span>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl font-black tracking-[-0.05em] uppercase leading-none mb-4 wrap-break-word">
                        {user.username || 'GUEST USER'} <br className="hidden md:block" />
                        {/* <span className="text-outline block md:inline">STANDARD PROFILE</span> */}
                    </h1>
                </section>

                {/* Bento Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Profile Section - Visible on Profile tab */}
                    {activeTab === 'profile' && (
                        <div className="lg:col-span-12 flex flex-col gap-8">
                            <div className="bg-background-dark p-8 border border-white/10">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase">01 / Profile Information</h3>
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="text-[10px] font-black tracking-[0.3em] uppercase border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="border-b border-white/10 pb-2">
                                            <label className="block text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-1">Username</label>
                                            <p className="font-display font-bold text-lg md:text-xl uppercase tracking-tight break-all">
                                                {user.username || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="border-b border-white/10 pb-2">
                                            <label className="block text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-1">Email Address</label>
                                            <p className="font-display font-bold text-lg md:text-xl uppercase tracking-tight break-all">
                                                {user.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="border-b border-white/10 pb-2">
                                            <label className="block text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-1">Phone Number</label>
                                            <p className="font-display font-bold text-lg md:text-xl uppercase tracking-tight break-all">
                                                {user.phone || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="border-b border-white/10 pb-2 flex items-center">
                                            <button
                                                onClick={() => setIsChangePasswordModalOpen(true)}
                                                className="flex-1 mb-1 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase hover:text-white transition-colors flex items-center gap-2 pb-1"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">lock_reset</span> Change Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses Section for Profile View */}
                            <div className="bg-card-dark p-8 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-[150px]">location_on</span>
                                </div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase">02 / Saved Addresses</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className="bg-black p-4 border border-white/20 relative group/card">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-2">
                                                    {addr.is_default && (
                                                        <span className="px-2 py-0.5 bg-white text-black text-[8px] font-black tracking-[0.2em] uppercase">Default</span>
                                                    )}
                                                    {!addr.is_default && (
                                                        <button
                                                            onClick={() => handleSetDefault(addr.id)}
                                                            className="px-2 py-0.5 border border-white/20 text-white/40 text-[8px] font-black tracking-[0.2em] uppercase hover:text-white hover:border-white transition-colors"
                                                        >
                                                            Set Default
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAddress(addr);
                                                            setIsAddressModalOpen(true);
                                                        }}
                                                        className="material-symbols-outlined text-white/40 hover:text-white transition-colors text-[16px]"
                                                    >
                                                        edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="material-symbols-outlined text-white/40 hover:text-red-500 transition-colors text-[16px]"
                                                    >
                                                        delete
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="font-display font-bold uppercase tracking-tight text-white/80 text-xs">
                                                {addr.receiver_name}
                                            </p>
                                            <p className="text-white/40 text-[10px] font-medium leading-relaxed mt-1">
                                                {addr.house_building_name}, {addr.area_sector}<br />
                                                {addr.city}, {addr.state} - {addr.postal_code}<br />
                                                {addr.country}
                                            </p>
                                        </div>
                                    ))}

                                    {/* Add New Address Placeholder */}
                                    <button
                                        onClick={() => {
                                            setEditingAddress(null);
                                            setIsAddressModalOpen(true);
                                        }}
                                        className="border border-dashed border-white/10 p-4 flex flex-col items-center justify-center gap-2 group/add hover:border-white/30 transition-colors bg-white/2 min-h-[120px]"
                                    >
                                        <span className="material-symbols-outlined text-white/20 group-hover/add:text-white transition-colors">add_location_alt</span>
                                        <span className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase group-hover/add:text-white transition-colors">Add New Address</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wallet Section (Standalone in Wallet Tab) */}
                    {activeTab === 'wallet' && (
                        <div className="lg:col-span-12 space-y-8">
                            <div className="bg-card-dark p-8 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors max-w-2xl">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-[200px]">account_balance_wallet</span>
                                </div>
                                <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase mb-8 relative z-10">Wallet Management</h3>

                                <div className="mb-4 relative z-10">
                                    <label className="block text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-2">Available Balance</label>
                                    <p className="font-display text-7xl font-black tracking-tighter text-white">₹0.00</p>
                                </div>
                            </div>

                            <div className="bg-background-dark p-8 border border-white/10 max-w-4xl">
                                <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase mb-8">Recent Transactions</h3>
                                <div className="overflow-x-auto w-full no-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="pb-4 font-display text-[10px] font-black tracking-[0.4em] uppercase text-white/40">Description</th>
                                                <th className="pb-4 font-display text-[10px] font-black tracking-[0.4em] uppercase text-white/40">Date</th>
                                                <th className="pb-4 font-display text-[10px] font-black tracking-[0.4em] uppercase text-white/40 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-display font-bold uppercase tracking-tight text-white/60 text-xs">REGISTRATION_CREDIT</td>
                                                <td className="py-4 font-display font-bold uppercase tracking-tight text-white/30 text-xs">2026-04-04</td>
                                                <td className="py-4 text-right font-display font-bold text-green-500 text-xs">+₹0.00</td>
                                            </tr>
                                            {/* Other 4 rows as mock placeholders */}
                                            {[...Array(4)].map((_, i) => (
                                                <tr key={i} className="opacity-20">
                                                    <td className="py-4 font-display font-bold uppercase tracking-tight text-white/60 text-xs">- - -</td>
                                                    <td className="py-4 font-display font-bold uppercase tracking-tight text-white/30 text-xs">- - -</td>
                                                    <td className="py-4 text-right font-display font-bold text-white/30 text-xs">₹0.00</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Orders Section */}
                    {activeTab === 'orders' && (
                        <div className="lg:col-span-12 bg-background-dark p-8 border border-white/10">
                            <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase mb-8">03 / Order History</h3>

                            {isLoadingOrders ? (
                                <div className="py-20 text-center">
                                    <p className="text-[10px] font-black tracking-widest text-white/20 uppercase animate-pulse">Fetching Secure Records...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="py-20 text-center border border-dashed border-white/10">
                                    <p className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-4">No orders found.</p>
                                    <button onClick={() => router.push('/explore')} className="text-[10px] font-black tracking-widest border-b border-white hover:text-white/60 transition-colors uppercase">Start Shopping</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => {
                                        const isExpanded = expandedOrderId === order.id;
                                        return (
                                            <div
                                                key={order.id}
                                                className={`border border-white/10 bg-white/2 transition-all duration-300 ${isExpanded ? 'bg-white/5' : 'hover:bg-white/5 cursor-pointer'}`}
                                                onClick={() => !isExpanded && setExpandedOrderId(order.id)}
                                            >
                                                {/* Collapsed Header / Visual Card */}
                                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-6 flex-1">
                                                        {/* Thumbnail Gallery */}
                                                        <div className="flex -space-x-4">
                                                            {order.order_items?.slice(0, 3).map((item: any, idx: number) => {
                                                                const imgUrl = item.product_variants?.products?.product_images?.[0]?.image_url;
                                                                return (
                                                                    <div key={idx} className="w-16 h-20 bg-neutral-900 border border-white/10 relative overflow-hidden shrink-0 shadow-2xl">
                                                                        {imgUrl ? (
                                                                            <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover opacity-80" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/10 uppercase">N/A</div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {order.order_items?.length > 3 && (
                                                                <div className="w-16 h-20 bg-neutral-900 border border-white/10 flex items-center justify-center relative shadow-2xl">
                                                                    <span className="text-[10px] font-black text-white/40">+{order.order_items.length - 3}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Names and Summary */}
                                                        <div>
                                                            <h4 className="font-display font-black text-xs md:text-sm uppercase tracking-widest text-white line-clamp-1 mb-2">
                                                                {order.order_items?.map((item: any) => item.product_name).join(', ')}
                                                            </h4>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`px-2 py-0.5 text-[8px] font-black tracking-[0.2em] uppercase ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                        order.status === 'pending' ? 'bg-white/10 text-white' :
                                                                            'bg-white/5 text-white/30'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                                                                    {order.order_items?.length} {order.order_items?.length === 1 ? 'ITEM' : 'ITEMS'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                                        <div className="text-right">
                                                            <div className="font-display font-black text-sm text-white uppercase tracking-tighter">
                                                                ₹{order.total.toFixed(2)}
                                                            </div>
                                                            <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">
                                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        </div>
                                                        {!isExpanded && (
                                                            <span className="material-symbols-outlined text-white/20">expand_more</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="px-6 pb-6 pt-0 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-white/5 mb-8">
                                                            <div>
                                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Order Identification</p>
                                                                <p className="font-mono text-xs text-white uppercase tracking-widest">{order.order_number}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Payment Details</p>
                                                                <p className="text-xs text-white uppercase tracking-widest">{order.payment_status} / RAZORPAY</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Detailed Manifest</p>
                                                            {order.order_items?.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between text-xs py-2 group/item">
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-white/20 font-black">x{item.quantity}</span>
                                                                        <div>
                                                                            <p className="font-black text-white uppercase tracking-widest">{item.product_name}</p>
                                                                            <p className="text-[9px] font-bold text-white/30 uppercase">{item.variant_label}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="font-black text-white">₹{item.total_price.toFixed(2)}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-8 flex justify-end">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedOrderId(null);
                                                                }}
                                                                className="text-[10px] font-black tracking-widest text-white/40 hover:text-white uppercase flex items-center gap-2 transition-colors"
                                                            >
                                                                Collapse Details <span className="material-symbols-outlined text-sm">expand_less</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Wishlist Section */}
                    {activeTab === 'wishlist' && (
                        <div className="lg:col-span-12">
                            <h3 className="font-display text-xl font-black tracking-[-0.02em] uppercase mb-8">04 / Wishlist Items</h3>

                            {isLoadingWishlist ? (
                                <div className="py-20 text-center">
                                    <p className="text-[10px] font-black tracking-widest text-white/20 uppercase animate-pulse">Accessing Vault...</p>
                                </div>
                            ) : wishlistProducts.length === 0 ? (
                                <div className="py-20 text-center border border-dashed border-white/10">
                                    <p className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-4">Your vault is empty.</p>
                                    <button onClick={() => router.push('/explore')} className="text-[10px] font-black tracking-widest border-b border-white hover:text-white/60 transition-colors uppercase">Explore Archive</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {wishlistProducts.map((product) => {
                                        const gallery = product.product_images?.sort((a: any, b: any) => a.position - b.position) || [];
                                        const sizes = Array.from(new Set(product.product_variants?.map((v: any) => v.size) || [])) as string[];
                                        const displayPrice = product.product_variants?.[0]?.price ? `₹${product.product_variants[0].price}` : 'TBA';

                                        return (
                                            <ProductCard
                                                key={product.id}
                                                id={product.id}
                                                name={product.name}
                                                price={displayPrice}
                                                image={gallery[0]?.image_url || '/placeholder.jpg'}
                                                description={product.description}
                                                sizes={sizes}
                                                variants={product.product_variants || []}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <EditProfileModal
                isOpen={isEditProfileModalOpen}
                onClose={() => setIsEditProfileModalOpen(false)}
            />
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                }}
                initialData={editingAddress}
                onSave={handleSaveAddress}
            />
        </div>
    );
}
