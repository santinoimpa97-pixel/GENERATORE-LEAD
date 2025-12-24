
import React from 'react';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';

const App: React.FC = () => {
    const { session, loading: authLoading } = useAuth();

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

    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col">
            <Dashboard />
        </div>
    );
};

export default App;
