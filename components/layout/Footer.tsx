import React from 'react';
import Link from 'next/link';
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export const Footer: React.FC = () => {
    return (
        <footer className="bg-black border-t border-white/10 pt-12 pb-12 px-6 lg:px-12 w-full">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-display font-bold tracking-tighter uppercase mb-8">Musclemanga</h2>
                    <p className="text-white/40 max-w-sm mb-12 text-sm leading-loose">
                        High-performance streetwear for those who live for the grind. Limited quantity drops. Zero compromise on quality.
                    </p>
                    <div className="flex gap-6">
                        <a href="https://www.instagram.com/musclemanga.in?igsh=MXQ4bTMwNGlwMmNmeA%3D%3D&utm_source=qr" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                            <FaInstagram className='w-6 h-6' />
                        </a>
                        <a href="https://api.whatsapp.com/send/?phone=9988770439&text&type=phone_number&app_absent=0" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                            <FaWhatsapp className='w-6 h-6' />
                        </a>
                        <a href="/contact" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                            <span className="material-symbols-outlined text-sm">alternate_email</span>
                        </a>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-10">Navigation</h4>
                    <ul className="space-y-6 text-xs font-bold uppercase tracking-widest text-white/40">
                        <li><Link href="/explore" className="hover:text-white transition-colors">Shop All</Link></li>
                        <li><Link href="/about" className="hover:text-white transition-colors">Account</Link></li>
                        <li><Link href="/archive" className="hover:text-white transition-colors">Cart</Link></li>
                        <li><Link href="/newsletter" className="hover:text-white transition-colors">Our story</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-10">Support</h4>
                    <ul className="space-y-6 text-xs font-bold uppercase tracking-widest text-white/40">
                        <li><Link href="/contact" className="hover:text-white transition-colors">Contact us</Link></li>
                        <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                        <li><Link href="https://www.instagram.com/musclemanga.in?igsh=MXQ4bTMwNGlwMmNmeA%3D%3D&utm_source=qr" className="hover:text-white transition-colors flex gap-2 items-center"><FaInstagram /> Connect on Instagram</Link></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-12 pt-8 border-t border-white/5 flex justify-center gap-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2024 Musclemanga Drop-01. All rights reserved.</p>
            </div>
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </footer>
    );
};
