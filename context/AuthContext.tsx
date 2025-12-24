
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase, supabaseConnectionError } from '../services/supabaseClient';

type Session = any;
type User = any;

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
        // Se c'è un errore di connessione palese, non tentare l'auth
        if (supabaseConnectionError || !supabase.auth) {
            setLoading(false);
            return;
        }

        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Auth timeout: sblocco manuale");
                setLoading(false);
            }
        }, 5000);

        try {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                clearTimeout(timeout);
            });

            supabase.auth.getSession().then(({ data: { session } }: any) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                clearTimeout(timeout);
            }).catch((err: any) => {
                console.error("Auth Session Error:", err);
                setLoading(false);
            });

            return () => {
                subscription?.unsubscribe();
                clearTimeout(timeout);
            };
        } catch (e) {
            console.error("Eccezione in AuthProvider useEffect:", e);
            setLoading(false);
        }
    }, []);

    const logout = async () => {
        if (supabaseConnectionError || !supabase.auth) return;
        if (user) localStorage.removeItem(`crm_cache_${user.id}`);
        await supabase.auth.signOut();
    };
    
    const updateUserMetadata = async (metadata: { name?: string }) => {
        if (supabaseConnectionError || !supabase.auth) throw new Error("Supabase non configurato.");
        const { error } = await supabase.auth.updateUser({ data: metadata });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, logout, updateUserMetadata }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
