
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
        setStatusMessage('Avvio ricerca rapida...');
        onGenerationStart();

        // Messaggi più veloci per riflettere il nuovo modello
        const messages = [
            'Accesso a Google Search...',
            'Scansione mappe e siti web...',
            'Estrazione contatti verificati...',
            'Finalizzazione dati...'
        ];
        let msgIdx = 0;
        const statusInterval = setInterval(() => {
            setStatusMessage(messages[msgIdx]);
            msgIdx = (msgIdx + 1) % messages.length;
        }, 2000);

        try {
            const searchQuery = location ? `${query} a ${location}` : query;
            const newLeads = await generateLeads(searchQuery, count, existingLeads);
            
            clearInterval(statusInterval);
            if (newLeads.length === 0) {
                onGenerationEnd(false, "Nessun lead trovato. Prova a semplificare la ricerca.");
            } else {
                onLeadsGenerated(newLeads);
                onGenerationEnd(true, `Generati ${newLeads.length} lead in tempo reale!`);
                setQuery('');
            }
        } catch (err: any) {
            clearInterval(statusInterval);
            console.error(err);
            if (err.message === "QUOTA_EXHAUSTED") {
                onGenerationEnd(false, "Limite raggiunto. Attendi un momento.");
            } else if (err.message === "AUTH_REQUIRED") {
                onGenerationEnd(false, "Chiave API mancante. Configurala nelle impostazioni.");
            } else {
                onGenerationEnd(false, "Errore durante la ricerca. Riprova.");
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
                    <i className="fas fa-bolt text-yellow-500"></i> 
                    Lead Generator Istantaneo
                </h3>
                <p className="text-sm text-muted-foreground">Ricerca rapida potenziata da Gemini 3 Flash.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Settore o Azienda</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Es: Ristoranti, Carrozzieri..."
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Quantità</label>
                        <select
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Città / Località</label>
                    <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Es: Milano, Roma..."
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
                            <i className="fas fa-magic"></i>
                            Trova Lead Ora
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LeadGenerator;
