import React from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import { supabaseConnectionError } from './services/supabaseClient';
import { geminiConnectionError } from './services/geminiService';

const App: React.FC = () => {
    const { session, loading } = useAuth();

    // Priorità agli errori di configurazione database
    if (supabaseConnectionError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <div className="bg-card border border-destructive/50 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <i className="fas fa-database text-5xl text-destructive mb-4"></i>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Connessione Database Mancante</h1>
                    <p className="text-muted-foreground mb-6">
                        L'applicazione non può connettersi a Supabase perché mancano le credenziali.
                    </p>
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-6 text-left">
                        <p className="font-bold mb-2">Errore:</p>
                        <p>{supabaseConnectionError}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                         Verifica di aver impostato <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> nel file <code>.env</code> o nelle impostazioni del progetto.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-primary/90 transition duration-300"
                    >
                        Ricarica Pagina
                    </button>
                </div>
            </div>
        );
    }

    // Controllo errori Gemini AI
    if (geminiConnectionError) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <div className="bg-card border border-yellow-500/50 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <i className="fas fa-robot text-5xl text-yellow-500 mb-4"></i>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Chiave AI Mancante</h1>
                    <p className="text-muted-foreground mb-6">
                        L'applicazione richiede Gemini AI per funzionare.
                    </p>
                     <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm p-4 rounded-lg mb-6 text-left">
                        <p className="font-bold mb-2">Errore:</p>
                        <p>{geminiConnectionError}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                         Verifica di aver impostato <code>VITE_API_KEY</code> nel file <code>.env</code>.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-primary/90 transition duration-300"
                    >
                        Ricarica Pagina
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center animate-pulse">
                    <i className="fas fa-circle-notch fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-muted-foreground font-medium">Avvio applicazione...</p>
                </div>
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