
import React, { useState } from 'react';
import { generateLeads } from '../services/geminiService';
import { Lead } from '../types';

interface LeadGeneratorProps {
    existingLeads: { name: string; location: string }[];
    onLeadsGenerated: (newLeads: any[]) => void;
    onGenerationStart: () => void;
    onGenerationEnd: (success: boolean, message?: string) => void;
}

const LeadGenerator: React.FC<LeadGeneratorProps> = ({ existingLeads, onLeadsGenerated, onGenerationStart, onGenerationEnd }) => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [count, setCount] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setStatusMessage('Inizializzazione ricerca verificata...');
        onGenerationStart();

        const statusInterval = setInterval(() => {
            const messages = [
                'Interrogando il database di Google...',
                'Filtrando solo aziende con indirizzo fisico...',
                'Verificando numeri di cellulare e WhatsApp...',
                'Incrociando i dati Maps e Web per la massima precisione...',
                'Validando l\'esistenza reale dell\'attività...'
            ];
            setStatusMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 3500);

        try {
            const searchQuery = location ? `${query} a ${location}` : query;
            const newLeads = await generateLeads(searchQuery, count, existingLeads);
            
            clearInterval(statusInterval);
            if (newLeads.length === 0) {
                onGenerationEnd(false, "Nessuna azienda reale trovata con questi criteri. Prova a cambiare zona.");
            } else {
                onLeadsGenerated(newLeads);
                onGenerationEnd(true, `Trovati ${newLeads.length} lead reali verificati!`);
                setQuery('');
            }
        } catch (err: any) {
            clearInterval(statusInterval);
            console.error(err);
            if (err.message === "QUOTA_EXHAUSTED") {
                onGenerationEnd(false, "Limite API raggiunto. Attendi 60 secondi e riprova.");
            } else if (err.message === "AUTH_REQUIRED") {
                onGenerationEnd(false, "Errore API: Verifica la chiave nelle variabili d'ambiente.");
            } else {
                onGenerationEnd(false, "Errore di connessione durante la ricerca dei dati reali.");
            }
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-xl h-full relative overflow-hidden">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <i className="fas fa-check-double text-primary"></i> 
                    Ricerca Lead Reali (Gemini 3 Pro)
                </h3>
                <p className="text-sm text-muted-foreground">L'AI verifica l'esistenza fisica delle aziende prima di salvarle.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Cosa cerchi?</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Es: Officine Meccaniche, Studi Legali..."
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Lead</label>
                        <select
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                            <option value={8}>8</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Dove? (Città o Provincia)</label>
                    <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Es: Bologna, Torino Centro..."
                            className="w-full p-3 pl-10 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-circle-notch fa-spin"></i>
                            {statusMessage}
                        </>
                    ) : (
                        <>
                            <i className="fas fa-search"></i>
                            Avvia Ricerca Verificata
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LeadGenerator;
