
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import { supabaseConfigInfo } from './services/supabaseClient';

const App: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');

    useEffect(() => {
        const checkGeminiKey = async () => {
            const win = window as any;
            const key = process.env.VITE_API_KEY || 
                        process.env.API_KEY || 
                        win.process?.env?.VITE_API_KEY || 
                        win.process?.env?.API_KEY;
            
            if (key && key.length > 10) {
                setApiKeyStatus('found');
            } else if (win.aistudio && await win.aistudio.hasSelectedApiKey()) {
                setApiKeyStatus('found');
            } else {
                setApiKeyStatus('missing');
            }
        };

        checkGeminiKey();
        
        // Timeout di sicurezza per lo stato delle chiavi
        const timer = setTimeout(() => {
            setApiKeyStatus(prev => prev === 'checking' ? 'missing' : prev);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [session]);

    // 1. Gestione Errore Configurazione Supabase (Bloccante)
    if (!supabaseConfigInfo.isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="bg-card border border-destructive/30 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <i className="fas fa-database text-destructive text-5xl mb-6"></i>
                    <h1 className="text-2xl font-bold mb-4">Configurazione Database Mancante</h1>
                    <div className="text-left bg-muted/50 p-4 rounded-lg mb-6 text-sm space-y-2">
                        <p className="flex items-center gap-2">
                            {supabaseConfigInfo.missingUrl ? <i className="fas fa-times text-destructive"></i> : <i className="fas fa-check text-green-500"></i>}
                            VITE_SUPABASE_URL
                        </p>
                        <p className="flex items-center gap-2">
                            {supabaseConfigInfo.missingKey ? <i className="fas fa-times text-destructive"></i> : <i className="fas fa-check text-green-500"></i>}
                            VITE_SUPABASE_ANON_KEY
                        </p>
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">
                        Aggiungi queste variabili nella dashboard di Vercel e fai un nuovo deploy.
                    </p>
                    <button onClick={() => window.location.reload()} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold">Riprova</button>
                </div>
            </div>
        );
    }

    // 2. Caricamento Iniziale
    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <i className="fas fa-circle-notch fa-spin text-4xl text-primary mb-4"></i>
                <p className="text-muted-foreground animate-pulse font-medium">Connessione ai servizi...</p>
            </div>
        );
    }

    // 3. Login
    if (!session) {
        return <AuthPage />;
    }

    // 4. Gestione Chiave Gemini Mancante (Non bloccante per la dashboard, ma avvisa)
    if (apiKeyStatus === 'missing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="bg-card border border-border p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-robot text-3xl text-primary"></i>
                    </div>
                    <h1 className="text-2xl font-bold mb-3">IA non configurata</h1>
                    <p className="text-muted-foreground mb-8">
                        Supabase è connesso correttamente, ma non abbiamo trovato la chiave <strong>VITE_API_KEY</strong> per l'intelligenza artificiale.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={async () => {
                                if ((window as any).aistudio?.openSelectKey) {
                                    await (window as any).aistudio.openSelectKey();
                                    setApiKeyStatus('found');
                                }
                            }}
                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3"
                        >
                            <i className="fas fa-key"></i> Collega Chiave API Gemini
                        </button>
                        <button 
                            onClick={() => setApiKeyStatus('found')}
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Ignora e vai alla Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Dashboard />
        </div>
    );
};

export default App;
