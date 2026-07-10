"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H2 } from '@/components/ui/Typography';
import { supabase } from '@/lib/supabase';

import { Portal } from '@/components/ui/Portal';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ViewState = 'login' | 'register_step1' | 'register_step2';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    // ... rest of logic ...
    const [view, setView] = useState<ViewState>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    
    // Register states
    const [email, setEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [username, setUsername] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [phone, setPhone] = useState('');

    // Realtime Check States
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    // Password Checks
    const passwordChecks = [
        { label: "Min 8 chars", valid: registerPassword.length >= 8 },
        { label: "1 uppercase", valid: /[A-Z]/.test(registerPassword) },
        { label: "1 number", valid: /[0-9]/.test(registerPassword) },
        { label: "1 special char", valid: /[^A-Za-z0-9]/.test(registerPassword) },
    ];
    const isPasswordValid = passwordChecks.every(c => c.valid);

    const countryCodes = [
        { code: '+91', label: 'IND (+91)' },
        { code: '+1', label: 'USA (+1)' },
        { code: '+44', label: 'UK (+44)' },
        { code: '+971', label: 'UAE (+971)' },
        { code: '+61', label: 'AUS (+61)' },
    ];

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setView('login');
            setLoading(false);
            setError(null);
            setIdentifier('');
            setPassword('');
            setEmail('');
            setRegisterPassword('');
            setUsername('');
            setCountryCode('+91');
            setPhone('');
            setEmailStatus('idle');
            setUsernameStatus('idle');
        }
    }, [isOpen]);

    // Real-time Email Check (Debounced)
    useEffect(() => {
        if (!email || !email.includes('@') || !email.includes('.')) {
            setEmailStatus('idle');
            return;
        }

        setEmailStatus('checking');
        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data, error } = await supabase.from('users').select('email').eq('email', email);
                if (!error && data && data.length > 0) {
                    setEmailStatus('taken');
                } else {
                    setEmailStatus('available');
                }
            } catch (e) {
                console.error("Error checking email availability:", e);
                setEmailStatus('idle');
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [email]);

    // Real-time Username Check (Debounced)
    useEffect(() => {
        if (!username || username.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');
        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data, error } = await supabase.from('users').select('username').eq('username', username);
                if (!error && data && data.length > 0) {
                    setUsernameStatus('taken');
                } else {
                    setUsernameStatus('available');
                }
            } catch (e) {
                console.error("Error checking username availability:", e);
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [username]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let loginEmail = identifier;
            
            // If the identifier is a mobile number (only digits, 5+ length)
            if (/^\d{5,}$/.test(identifier)) {
                throw new Error("Mobile login is not supported yet. Please use your Username or Email.");
            }

            if (!identifier.includes('@')) {
                const { data, error: lookupError } = await supabase
                    .from('users')
                    .select('email')
                    .eq('username', identifier)
                    .single();
                
                if (lookupError || !data) {
                    throw new Error('Member ID (Username) not found. Please check your credentials or register.');
                }
                loginEmail = data.email;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: password,
            });

            if (signInError) {
                // Handle common Supabase Auth errors
                if (signInError.message.includes('Invalid login credentials')) {
                    throw new Error("ACCESS DENIED: Invalid credentials. Check your Member ID and Password.");
                }
                throw signInError;
            }
            
            onClose();
        } catch (err: any) {
            console.error("Login attempt failed:", err);
            
            // Catch generic browser "load failed" (CORS/Network/Adblock)
            if (err.message?.toLowerCase().includes('load failed') || err.message?.toLowerCase().includes('failed to fetch')) {
                setError("CONNECTION FAILED: The database is unreachable. Please disable ad-blockers (like uBlock Origin) and check if your Supabase project is active.");
            } else {
                setError(err.message || "AUTHENTICATION FAILED: Ensure your credentials are correct and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailStatus === 'taken') {
            setError("This email is already registered.");
            return;
        }
        if (!isPasswordValid) {
            setError("Please ensure your password meets all requirements.");
            return;
        }
        setError(null);
        setView('register_step2');
    };

    const handleRegisterStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 5 || !username) {
            setError("Please provide a valid username and phone number.");
            return;
        }
        
        if (usernameStatus === 'taken') {
            setError("Username is already taken. Please choose another.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            // Create Supabase Auth user and pass extra info into metadata
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password: registerPassword,
                options: {
                    data: {
                        username: username,
                        phone: `${countryCode}${phone}`,
                    }
                }
            });

            if (signUpError) throw signUpError;
            
            alert("Account created successfully!\n\nPlease check your inbox and verify your email address using the link sent to you before trying to log in.");
            onClose();
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 15) {
            setPhone(value);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <div className="relative w-full max-w-md bg-black border-4 border-white p-8 md:p-12 shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] overflow-y-auto max-h-[90vh]">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-white/60 transition-colors"
                        disabled={loading}
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <div className="mb-8">
                        <H2 className="text-2xl md:text-3xl leading-none">
                            {view === 'login' ? 'Login' : 'Register'}
                        </H2>
                        <div className="h-1 w-20 bg-white mt-4"></div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            {error}
                        </div>
                    )}

                    {view === 'login' && (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <Input
                                    id="login-identifier"
                                    label="Username or Email"
                                    placeholder="john_doe or john@example.com"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value.toLowerCase().trim())}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div>
                                <Input
                                    id="login-password"
                                    label="Password"
                                    placeholder="********"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="pt-2">
                                <Button type="submit" fullWidth className="tracking-[0.3em]" disabled={loading}>
                                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                                </Button>
                            </div>
                            <div className="text-center mt-6">
                                <p className="text-xs text-white/50 font-bold tracking-widest uppercase">
                                    DON&#39;T HAVE AN ACCOUNT?{' '}
                                    <button type="button" onClick={() => setView('register_step1')} className="text-white hover:underline transition-all ml-1">
                                        REGISTER
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {view === 'register_step1' && (
                        <form className="space-y-6" onSubmit={handleRegisterStep1}>
                            <div className="text-white/60 text-xs font-black uppercase tracking-widest mb-4">
                                Step 1 of 2: Account Details
                            </div>
                            <div>
                                <Input
                                    id="register-email"
                                    label="Email Address"
                                    placeholder="john@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                                    disabled={loading}
                                    required
                                />
                                {email && (
                                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        {emailStatus === 'checking' && <span className="text-yellow-500">Checking availability...</span>}
                                        {emailStatus === 'taken' && <span className="text-red-500">Email already registered</span>}
                                        {emailStatus === 'available' && <span className="text-green-500 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check_circle</span> Email available</span>}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Input
                                    id="register-password"
                                    label="Password"
                                    placeholder="Min 8 characters"
                                    type="password"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                {registerPassword && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-widest">
                                        {passwordChecks.map((check, i) => (
                                            <div key={i} className={`flex items-center gap-1 ${check.valid ? 'text-green-500' : 'text-white/40'}`}>
                                                <span className="material-symbols-outlined text-[12px]">
                                                    {check.valid ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                {check.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="pt-4">
                                <Button type="submit" fullWidth className="tracking-[0.3em]" disabled={loading || !isPasswordValid || emailStatus === 'taken'}>
                                    CONTINUE
                                </Button>
                            </div>
                            <div className="text-center mt-6">
                                <p className="text-xs text-white/50 font-bold tracking-widest uppercase">
                                    ALREADY HAVE AN ACCOUNT?{' '}
                                    <button type="button" onClick={() => setView('login')} className="text-white hover:underline transition-all ml-1">
                                        LOGIN
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {view === 'register_step2' && (
                        <form className="space-y-6" onSubmit={handleRegisterStep2}>
                            <div className="text-white/60 text-xs font-black uppercase tracking-widest mb-4">
                                Step 2 of 2: Profile Info
                            </div>
                            <div>
                                <Input
                                    id="register-username"
                                    label="Username"
                                    placeholder="your_unique_username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''))}
                                    disabled={loading}
                                    required
                                />
                                {username && username.length >= 3 && (
                                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        {usernameStatus === 'checking' && <span className="text-yellow-500">Checking availability...</span>}
                                        {usernameStatus === 'taken' && <span className="text-red-500">Username is taken</span>}
                                        {usernameStatus === 'available' && <span className="text-green-500 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check_circle</span> Username available</span>}
                                    </div>
                                )}
                                {username && username.length < 3 && (
                                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        Min 3 characters
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-white/80">
                                    Mobile Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-1/3 min-w-[100px]">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            disabled={loading}
                                            className="w-full p-4 bg-transparent border border-white/20 text-white focus:ring-1 focus:ring-white focus:border-white uppercase text-xs tracking-widest outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            {countryCodes.map((c) => (
                                                <option key={c.code} value={c.code} className="bg-black text-white">
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            id="register-phone"
                                            placeholder="9876543210"
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            disabled={loading}
                                            required
                                            className="w-full p-4 bg-transparent border border-white/20 text-white focus:ring-1 focus:ring-white focus:border-white uppercase text-xs tracking-widest placeholder:text-white/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex flex-col gap-4">
                                <Button type="submit" fullWidth className="tracking-[0.3em]" disabled={loading || usernameStatus !== 'available' || phone.length < 10}>
                                    {loading ? 'CREATING...' : 'COMPETE REGISTRATION'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setView('register_step1')}
                                    disabled={loading}
                                    className="text-xs font-black uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors text-center"
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Portal>
    );
};

