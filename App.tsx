import React from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import { supabaseConnectionError } from './services/supabaseClient';

const App: React.FC = () => {
    const { session, loading } = useAuth();

    // Gestione errori critici database
    if (supabaseConnectionError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <div className="bg-card border border-destructive/50 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <i className="fas fa-database text-5xl text-destructive mb-4"></i>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Errore Database</h1>
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-6 text-left">
                        <p>{supabaseConnectionError}</p>
                    </div>
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
                    <p className="text-muted-foreground font-medium">Avvio in corso...</p>
                </div>
            </div>
        );
    }

    // Nota: Non blocchiamo più l'app per la chiave AI qui. 
    // L'errore verrà gestito localmente nel LeadGenerator se la chiave dovesse mancare al momento della chiamata.
    return (
        <div className="bg-background text-foreground min-h-screen">
            {session ? <Dashboard /> : <AuthPage />}
        </div>
    );
};

export default App;