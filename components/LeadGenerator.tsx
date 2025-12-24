
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

    const handleSelectNewKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            window.location.reload(); // Ricarichiamo per pulire lo stato
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        onGenerationStart();

        try {
            const searchQuery = location ? `${query} a ${location}` : query;
            const newLeads = await generateLeads(searchQuery, count, existingLeads);
            
            if (newLeads.length === 0) {
                onGenerationEnd(false, "Nessun nuovo lead trovato per questa ricerca.");
            } else {
                onLeadsGenerated(newLeads);
                onGenerationEnd(true, `${newLeads.length} lead trovati con successo!`);
                setQuery('');
            }
        } catch (err: any) {
            console.error(err);
            if (err.message === "AUTH_REQUIRED") {
                onGenerationEnd(false, "La chiave API è scaduta o non valida. Clicca 'Chiave API' per aggiornarla.");
            } else {
                onGenerationEnd(false, err.message || "Errore durante la generazione.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-xl h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleSelectNewKey}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                    <i className="fas fa-cog"></i> Chiave API
                </button>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <i className="fas fa-magic text-primary"></i> 
                    Ricerca Lead Intelligente
                </h3>
                <p className="text-sm text-muted-foreground">L'AI cercherà aziende reali sul web per te.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1 ml-1">Cosa cerchi?</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Es. Studi Architettura, Hotel, Officine..."
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1 ml-1">Quantità</label>
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
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1 ml-1">Dove?</label>
                    <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Città o Regione (es. Milano)"
                            className="w-full p-3 pl-10 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-circle-notch fa-spin"></i>
                            Analisi in corso...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-search"></i>
                            Avvia Generazione Lead
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LeadGenerator;
