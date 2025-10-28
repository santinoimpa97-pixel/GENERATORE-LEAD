import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

interface ForgotPasswordProps {
    onSwitchToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // O una pagina specifica per il reset
            });

            if (error) throw error;
            setMessage('Se un account con questa email esiste, abbiamo inviato le istruzioni per il reset.');
        } catch (err) {
             if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Si è verificato un errore sconosciuto.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Recupera Password</h2>
            {message && <p className="bg-green-100 text-green-800 text-sm p-3 rounded-lg text-center">{message}</p>}
            {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">{error}</p>}

            {!message && <p className="text-muted-foreground text-sm text-center">Inserisci la tua email per ricevere le istruzioni di recupero.</p>}
            
            <div>
                <label htmlFor="email-forgot" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                    type="email"
                    id="email-forgot"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                    placeholder="tua@email.com"
                    disabled={isLoading || !!message}
                />
            </div>
            <button type="submit" disabled={isLoading || !!message} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50">
                {isLoading ? 'Invio in corso...' : 'Invia Istruzioni'}
            </button>
            <div className="text-center text-sm">
                Ricordi la password? <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">Torna al Login</button>
            </div>
        </form>
    );
};

export default ForgotPassword;
