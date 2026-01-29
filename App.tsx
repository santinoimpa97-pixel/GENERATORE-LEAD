
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
                // Controllo esteso della chiave per bypassare eventuali shadowing dei bundler
                const envKey = process.env.API_KEY || (window as any).process?.env?.API_KEY || "";
                
                if (envKey && envKey.length > 5) {
                    setApiKeyStatus('found');
                    return;
                }

                // Controllo tramite l'estensione AI Studio se disponibile
                const win = window as any;
                if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
                    const hasKey = await win.aistudio.hasSelectedApiKey();
                    if (hasKey) {
                        setApiKeyStatus('found');
                        return;
                    }
                }
                
                setApiKeyStatus('missing');
            } catch (e) {
                console.error("Errore durante il controllo della chiave:", e);
                setApiKeyStatus('missing');
            }
        };

        checkKeys();
        
        // Polling per rilevare cambiamenti dinamici (es. selezione chiave da dialogo)
        const interval = setInterval(checkKeys, 2000);
        return () => clearInterval(interval);
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
            // Come da linee guida: assumiamo successo dopo l'apertura del dialogo
            setApiKeyStatus('found');
        } else {
            alert("⚠️ ISTRUZIONI VERCEL:\n\n1. Vai su Vercel Dashboard -> Settings -> Environment Variables.\n2. Aggiungi VITE_API_KEY (il prefisso VITE_ è obbligatorio).\n3. Salva e fai il REDEPLOY del progetto.");
        }
    };

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            {apiKeyStatus === 'missing' && (
                <div className="bg-amber-600 text-white text-center p-3 text-xs font-bold z-[100] flex flex-col sm:flex-row items-center justify-center gap-2 shadow-lg animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Configurazione incompleta: chiave Gemini non rilevata.</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSelectKey} className="bg-white text-amber-700 px-3 py-1 rounded-full hover:bg-amber-50 transition-colors">Configura Ora</button>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Ottieni Chiave</a>
                    </div>
                </div>
            )}
            <Dashboard />
        </div>
    );
};

export default App;
