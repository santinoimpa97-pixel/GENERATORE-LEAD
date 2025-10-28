import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface LoginProps {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('crm_remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            if (rememberMe) {
                localStorage.setItem('crm_remembered_email', email);
            } else {
                localStorage.removeItem('crm_remembered_email');
            }

        } catch (err) {
            if (err instanceof Error) {
                setError("Credenziali non valide. Riprova.");
            } else {
                setError('Si è verificato un errore sconosciuto.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Login</h2>
            {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">{error}</p>}
            <div>
                <label htmlFor="email-login" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                    type="email"
                    id="email-login"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                    placeholder="tua@email.com"
                />
            </div>
            <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                <input
                    type="password"
                    id="password-login"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                />
            </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input 
                        id="remember-me" 
                        name="remember-me" 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-primary bg-transparent border-input rounded focus:ring-primary" 
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">Ricordami</label>
                </div>
                <div className="text-sm">
                    <button type="button" onClick={onForgotPassword} className="font-medium text-primary hover:underline">Password dimenticata?</button>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50">
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
            <div className="text-center text-sm">
                Non hai un account? <button type="button" onClick={onSwitchToRegister} className="text-primary hover:underline">Registrati</button>
            </div>
        </form>
    );
};

export default Login;