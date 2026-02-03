
import React, { useState } from 'react';
import { generateLeads } from '../services/geminiService';

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
        setStatusMessage('Inizializzazione...');
        onGenerationStart();

        try {
            const searchQuery = location ? `${query} a ${location}` : query;
            const newLeads = await generateLeads(searchQuery, count, existingLeads);
            
            if (newLeads.length === 0) {
                onGenerationEnd(false, "Nessun risultato trovato. Prova con termini più generici.");
            } else {
                onLeadsGenerated(newLeads);
                onGenerationEnd(true, `Trovati ${newLeads.length} nuovi lead.`);
                setQuery('');
            }
        } catch (err: any) {
            console.error(err);
            if (err.message === "MISSING_SERVER_CONFIG") {
                onGenerationEnd(false, "Errore: Variabile API_KEY non configurata nel server.");
            } else if (err.status === 429) {
                onGenerationEnd(false, "Limite di richieste raggiunto. Riprova tra un minuto.");
            } else {
                onGenerationEnd(false, "Impossibile completare la ricerca. Verifica la connessione.");
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
                    Lead Generator AI
                </h3>
                <p className="text-sm text-muted-foreground">Ricerca intelligente tramite Gemini 3 Flash.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Cosa cerchi?</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Es: Ristoranti, Studi Legali..."
                            className="w-full p-3 bg-muted/20 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Q.tà</label>
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
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Dove?</label>
                    <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Città o Provincia"
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
                            Generazione in corso...
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
