import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';


interface RegisterProps {
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        if (password.length < 6) {
            setError("La password deve essere di almeno 6 caratteri.");
            setIsLoading(false);
            return;
        }
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name
                    }
                }
            });
            if (error) throw error;
            setSuccessMessage("Registrazione completata! Controlla la tua email per la conferma.");

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
            <h2 className="text-2xl font-bold text-center">Crea un Account</h2>
            {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">{error}</p>}
            {successMessage && <p className="bg-green-100 text-green-800 text-sm p-3 rounded-lg text-center">{successMessage}</p>}
            <div>
                <label htmlFor="name-register" className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                <input
                    type="text"
                    id="name-register"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                    placeholder="Il tuo nome"
                    disabled={!!successMessage}
                />
            </div>
            <div>
                <label htmlFor="email-register" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                    type="email"
                    id="email-register"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                    placeholder="tua@email.com"
                    disabled={!!successMessage}
                />
            </div>
            <div>
                <label htmlFor="password-register" className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                <input
                    type="password"
                    id="password-register"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2.5 bg-transparent border border-input rounded-lg"
                    placeholder="Minimo 6 caratteri"
                    disabled={!!successMessage}
                />
            </div>
            <button type="submit" disabled={isLoading || !!successMessage} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50">
                {isLoading ? 'Creazione in corso...' : 'Registrati'}
            </button>
            <div className="text-center text-sm">
                Hai già un account? <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">Accedi</button>
            </div>
        </form>
    );
};

export default Register;
