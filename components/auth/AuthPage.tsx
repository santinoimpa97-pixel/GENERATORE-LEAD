import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthPage: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');

    const renderView = () => {
        switch (view) {
            case 'register':
                return <Register onSwitchToLogin={() => setView('login')} />;
            case 'forgot-password':
                return <ForgotPassword onSwitchToLogin={() => setView('login')} />;
            case 'login':
            default:
                return <Login onSwitchToRegister={() => setView('register')} onForgotPassword={() => setView('forgot-password')} />;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="w-full max-w-md">
                 <div className="text-center mb-6">
                    <i className="fas fa-bullseye-pointer text-5xl text-primary"></i>
                    <h1 className="text-3xl font-bold text-card-foreground mt-2">Lead CRM</h1>
                    <p className="text-muted-foreground">Accedi per gestire i tuoi lead.</p>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-lg p-8">
                    {renderView()}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
