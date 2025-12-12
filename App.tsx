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
                <div className="w-full max-w-3xl text-center bg-card border border-destructive rounded-lg p-8 shadow-2xl">
                    <i className="fas fa-server text-5xl text-destructive mb-4"></i>
                    <h1 className="text-2xl font-bold text-card-foreground mb-2">Configurazione Cloud Necessaria</h1>
                    <p className="text-muted-foreground mb-6">
                        L'app è online (GitHub/Cloud) ma non ha accesso alle chiavi segrete.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                            <h3 className="font-bold text-destructive mb-2"><i className="fas fa-copy mr-2"></i>1. Cosa Copiare</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Apri il file <strong>env_config.txt</strong> che vedi nella lista dei file e copia i nomi delle chiavi e i tuoi valori.
                            </p>
                            <code className="block bg-black/10 p-2 rounded text-xs font-mono">
                                API_KEY=...<br/>
                                SUPABASE_URL=...<br/>
                                SUPABASE_ANON_KEY=...
                            </code>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <h3 className="font-bold text-primary mb-2"><i className="fas fa-cog mr-2"></i>2. Dove Incollare</h3>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>
                                    <strong>Vercel/Netlify:</strong> Vai su <em>Settings</em> &rarr; <em>Environment Variables</em>.
                                </li>
                                <li>
                                    <strong>StackBlitz/Codespaces:</strong> Cerca l'icona "Secrets" o "Env" nella barra laterale.
                                </li>
                                <li>
                                    <strong>GitHub Repo:</strong> Vai su <em>Settings</em> &rarr; <em>Secrets and variables</em> &rarr; <em>Actions</em> (se usi CI/CD).
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            Errore tecnico rilevato: <span className="font-mono text-destructive">{connectionError}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Dopo aver salvato le variabili nel pannello del tuo hosting, riavvia o ridistribuisci (Redeploy) l'applicazione.
                        </p>
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