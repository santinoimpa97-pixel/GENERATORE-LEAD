
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';

const App: React.FC = () => {
    const { session, loading: authLoading } = useAuth();
    const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');

    useEffect(() => {
        const checkKeys = async () => {
            try {
                const win = window as any;
                // Controlliamo process.env.API_KEY che ora è popolato dal ponte in index.html
                const key = process.env.API_KEY;
                
                if (key && key.length > 5) {
                    setApiKeyStatus('found');
                } else if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
                    const hasKey = await win.aistudio.hasSelectedApiKey();
                    setApiKeyStatus(hasKey ? 'found' : 'missing');
                } else {
                    // Se siamo su Vercel e ancora non c'è, diamo un secondo di tempo per eventuali caricamenti asincroni
                    setTimeout(() => {
                        const lateKey = process.env.API_KEY;
                        setApiKeyStatus(lateKey && lateKey.length > 5 ? 'found' : 'missing');
                    }, 500);
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

    const handleSelectKey = async () => {
        const win = window as any;
        if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
            await win.aistudio.openSelectKey();
            setApiKeyStatus('found');
        } else {
            // Se non siamo in AI Studio, mostriamo un alert informativo
            alert("Per configurare la chiave su Vercel, vai nelle impostazioni del progetto (Environment Variables) e aggiungi API_KEY.");
        }
    };

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            {apiKeyStatus === 'missing' && (
                <div className="bg-yellow-500 text-white text-center p-2 text-xs font-bold z-50 flex items-center justify-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Attenzione: Chiave API Gemini non trovata nelle variabili d'ambiente.</span>
                    <button onClick={handleSelectKey} className="underline font-black hover:opacity-80 transition-opacity">Configura Ora</button>
                </div>
            )}
            <Dashboard />
        </div>
    );
};

export default App;
