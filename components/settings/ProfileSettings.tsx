import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../Toast';

const ProfileSettings: React.FC = () => {
    const { user, updateUserMetadata } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateUserMetadata({ name });
            showToast('Profilo aggiornato con successo!', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Errore sconosciuto";
            showToast(`Errore: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name-settings" className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                    <input
                        id="name-settings"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full p-2 bg-transparent border border-input rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="email-settings" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                    <input
                        id="email-settings"
                        type="email"
                        value={email}
                        disabled
                        className="w-full p-2 bg-muted/50 border border-input rounded-md cursor-not-allowed"
                    />
                     <p className="text-xs text-muted-foreground mt-1">L'email non può essere modificata da qui.</p>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50">
                        {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
            </form>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default ProfileSettings;
