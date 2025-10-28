import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase, supabaseConnectionError } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserMetadata: (metadata: { name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Supabase isn't configured, don't try to set up auth listeners.
        // This prevents the app from crashing and allows the error message to be shown.
        if (supabaseConnectionError) {
            setLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const logout = async () => {
        if (supabaseConnectionError) return;
        
        // Pulisce la cache dei dati dell'utente prima del logout.
        if (user) {
            localStorage.removeItem(`crm_cache_${user.id}`);
        }

        await supabase.auth.signOut();
    };
    
    const updateUserMetadata = async (metadata: { name?: string }) => {
        if (supabaseConnectionError) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.updateUser({ data: metadata });
        if (error) throw error;
    };


    const value = {
        session,
        user,
        loading,
        logout,
        updateUserMetadata,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* The loading check here prevents children from rendering before the initial session is loaded (or error is handled) */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};