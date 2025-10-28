import React from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import { supabaseConnectionError } from './services/supabaseClient';
import { geminiConnectionError } from './services/geminiService';

const App: React.FC = () => {
    // Combina tutti gli errori di connessione per un messaggio di avvio completo.
    const connectionError = [supabaseConnectionError, geminiConnectionError].filter(Boolean).join('\n');

    if (connectionError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-8">
                <div className="w-full max-w-2xl text-center bg-card border border-destructive rounded-lg p-8 shadow-2xl">
                    <i className="fas fa-exclamation-triangle text-5xl text-destructive mb-4"></i>
                    <h1 className="text-2xl font-bold text-card-foreground mb-2">Errore di Configurazione</h1>
                    <p className="text-muted-foreground mb-6">
                        L'applicazione non può avviarsi perché mancano delle chiavi di connessione essenziali.
                    </p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
                        <p className="text-sm font-semibold text-destructive mb-2">Dettagli dell'errore:</p>
                        <pre className="whitespace-pre-wrap">
                            <code className="font-mono text-sm text-destructive">
                                {connectionError}
                            </code>
                        </pre>
                    </div>
                    <div className="text-xs text-muted-foreground mt-6 text-left">
                        <p><strong>Come risolvere:</strong> Vai nelle impostazioni del tuo progetto su Vercel (o altro servizio di hosting) e assicurati che le seguenti variabili d'ambiente siano impostate:</p>
                        <ul className="list-disc list-inside mt-2 font-mono text-destructive/80 bg-destructive/10 p-2 rounded-md">
                            <li>API_KEY</li>
                            <li>SUPABASE_URL</li>
                            <li>SUPABASE_ANON_KEY</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
    
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground min-h-screen">
            {session ? <Dashboard /> : <AuthPage />}
        </div>
    );
};

export default App;