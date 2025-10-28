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
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) {
            setError('Il campo di ricerca è obbligatorio.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        onGenerationStart();

        const fullQuery = location ? `${query} a ${location}` : query;

        try {
            const newLeads = await generateLeads(fullQuery, count, existingLeads);
            onLeadsGenerated(newLeads);
            onGenerationEnd(true, `${newLeads.length} nuovi lead generati con successo!`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto.';
            setError(errorMessage);
            onGenerationEnd(false, 'Errore nella generazione di lead.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border p-6 rounded-lg shadow-md h-full">
            <h3 className="text-xl font-bold text-card-foreground mb-4 flex items-center"><i className="fas fa-magic mr-2 text-primary"></i> Generatore di Lead AI</h3>
            <p className="text-sm text-muted-foreground mb-4">Usa l'AI per trovare lead reali con una ricerca Google. I lead generati saranno "Non Categorizzati".</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="query" className="block text-sm font-medium text-muted-foreground mb-1">Cosa cerchi?</label>
                        <input
                            type="text"
                            id="query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Es. Ristoranti vegani, Studi legali..."
                            className="w-full p-2 bg-transparent border border-input rounded-lg"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                         <label htmlFor="count" className="block text-sm font-medium text-muted-foreground mb-1">Quantità</label>
                        <input
                            type="number"
                            id="count"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value, 10))}
                            min="1"
                            max="10"
                            className="w-full p-2 bg-transparent border border-input rounded-lg"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">Località (opzionale)</label>
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Es. Roma, Italia"
                        className="w-full p-2 bg-transparent border border-input rounded-lg"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-primary/90 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Ricerca in corso...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-search-dollar"></i> Trova Lead
                        </>
                    )}
                </button>
                {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
            </form>
        </div>
    );
};

export default LeadGenerator;