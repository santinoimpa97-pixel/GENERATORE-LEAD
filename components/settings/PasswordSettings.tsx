import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import Toast from '../Toast';

const PasswordSettings: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('Le nuove password non corrispondono.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('La nuova password deve essere di almeno 6 caratteri.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            showToast('Password aggiornata con successo!', 'success');
            setNewPassword('');
            setConfirmPassword('');
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
                    <label htmlFor="new-password" className="block text-sm font-medium text-muted-foreground mb-1">Nuova Password</label>
                    <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full p-2 bg-transparent border border-input rounded-md"
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-muted-foreground mb-1">Conferma Nuova Password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full p-2 bg-transparent border border-input rounded-md"
                    />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition duration-300 disabled:opacity-50">
                        {isLoading ? 'Aggiornamento...' : 'Cambia Password'}
                    </button>
                </div>
            </form>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default PasswordSettings;
