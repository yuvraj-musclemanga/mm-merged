"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, updateUserProfile, verifyAndChangePassword, withSupabaseTimeout } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
    uid: string;
    email: string | null;
    username?: string;
    phone?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    updateProfile: (updates: { username?: string; phone?: string }) => Promise<{ success: boolean; error?: any }>;
    changePassword: (current: string, next: string) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    updateProfile: async () => ({ success: false }),
    changePassword: async () => ({ success: false }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const fetchSession = async () => {
            try {
                const { data: { session } } = await withSupabaseTimeout(
                    'Restoring your session',
                    supabase.auth.getSession(),
                );
                if (isActive) await handleSession(session);
            } catch (error) {
                // A timed-out auth request must not block the entire app shell.
                console.error("Unable to restore Supabase session:", error);
                setUser(null);
                setLoading(false);
            }
        };
        
        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Never await another Supabase call from this callback. The SDK can
            // hold its auth lock while dispatching this event, which otherwise
            // causes session refreshes and subsequent API calls to deadlock.
            setTimeout(() => {
                if (isActive) void handleSession(session);
            }, 0);
        });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSession = async (session: Session | null) => {
        if (session && session.user) {
            try {
                console.log("Supabase Auth ID (Permanent):", session.user.id);
                // Fetch additional user details from Supabase users table
                const { data, error } = await withSupabaseTimeout(
                    'Loading your profile',
                    supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single(),
                );

                if (!error && data) {
                    console.log("Database Match Found:", data.id);
                    setUser({
                        uid: session.user.id,
                        email: session.user.email ?? null,
                        username: data.username || session.user.user_metadata?.username,
                        phone: data.phone || session.user.user_metadata?.phone,
                    });
                } else {
                    console.warn("Database Mismatch or Row Missing for Auth ID:", session.user.id, error);
                    setUser({
                        uid: session.user.id,
                        email: session.user.email ?? null,
                        username: session.user.user_metadata?.username,
                        phone: session.user.user_metadata?.phone,
                    });
                }
            } catch (error) {
                console.error("Error fetching user data from Supabase:", error);
                setUser({
                    uid: session.user.id,
                    email: session.user.email ?? null,
                });
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    const updateProfile = async (updates: { username?: string; phone?: string }) => {
        if (!user) return { success: false, error: 'User not logged in' };
        
        try {
            const { error } = await updateUserProfile(user.uid, updates);
            if (error) throw error;

            // Update local state immediately
            setUser(prev => prev ? { ...prev, ...updates } : null);
            
            // Also update Supabase Auth metadata for consistency
            await withSupabaseTimeout('Updating your account', supabase.auth.updateUser({ data: updates }));

            return { success: true };
        } catch (error) {
            console.error("Error updating profile:", error);
            return { success: false, error };
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await withSupabaseTimeout('Signing out', supabase.auth.signOut());
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setUser(null);
            setLoading(false);
            window.location.href = '/';
        }
    };

    const changePassword = async (current: string, next: string) => {
        if (!user || !user.email) return { success: false, error: 'Email not found' };
        
        try {
            const result = await verifyAndChangePassword(user.email, current, next);
            return result;
        } catch (error) {
            console.error("Error changing password:", error);
            return { success: false, error };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, updateProfile, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
