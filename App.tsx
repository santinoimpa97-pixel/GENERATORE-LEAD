
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import { supabaseConfigInfo } from './services/supabaseClient';

const App: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');

    // Fix: Completed API key check logic. Exclusive reliance on process.env.API_KEY is preferred.
    useEffect(() => {
        const checkKeys = async () => {
            try {
                const win = window as any;
                const key = process.env.API_KEY;
                
                if (key && key.length > 5) {
                    setApiKeyStatus('found');
                } else if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
                    const hasKey = await win.aistudio.hasSelectedApiKey();
                    setApiKeyStatus(hasKey ? 'found' : 'missing');
                } else {
                    // Ritardiamo leggermente la marcatura come "missing" per gestire eventuali caricamenti asincroni di script-injection
                    setTimeout(() => setApiKeyStatus(prev => prev === 'checking' ? 'missing' : prev), 1000);
                }
            } catch (e) {
                setApiKeyStatus('missing');
            }
        };

        checkKeys();
    }, [session]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <i className="fas fa-circle-notch fa-spin text-4xl text-primary mb-4"></i>
                <p className="text-muted-foreground animate-pulse font-medium">Inizializzazione Lead CRM...</p>
            </div>
        );
    }

    if (!session) {
        return <AuthPage />;
    }

    // Fix: Added method to trigger API key selection dialog as per guidelines.
    const handleSelectKey = async () => {
        const win = window as any;
        if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
            await win.aistudio.openSelectKey();
            // Guidelines: assume the key selection was successful after triggering openSelectKey()
            setApiKeyStatus('found');
        }
    };

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            {/* Banner di avviso solo se effettivamente mancano le chiavi e non siamo in fase di check */}
            {apiKeyStatus === 'missing' && (
                <div className="bg-yellow-500 text-white text-center p-2 text-xs font-bold z-50 flex items-center justify-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Attenzione: Chiave API Gemini non trovata. Le funzioni di generazione lead intelligente potrebbero non funzionare.</span>
                    <button onClick={handleSelectKey} className="underline font-black hover:opacity-80 transition-opacity">Configura Ora</button>
                </div>
            )}
            <Dashboard />
        </div>
    );
};

// Fix: Added missing default export.
export default App;
