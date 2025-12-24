
import React from 'react';
import { Lead, KanbanColumn } from '../types';

interface LeadListProps {
    leads: Lead[];
    columns: KanbanColumn[];
    isSelectionMode: boolean;
    selectedLeadIds: Set<string>;
    onStatusChange: (leadId: string, newStatusId: string) => void;
    onToggleSelectionMode: () => void;
    onSelectLead: (leadId: string) => void;
    onSelectAll: () => void;
    onAddLead: () => void;
}

const LeadList: React.FC<LeadListProps> = ({
    leads,
    columns,
    isSelectionMode,
    selectedLeadIds,
    onStatusChange,
    onToggleSelectionMode,
    onSelectLead,
    onSelectAll,
    onAddLead,
}) => {
    const statusIdToColumnMap = new Map(columns.map(c => [c.id, c]));

    const handleStatusChange = (leadId: string, newStatusId: string) => {
        onStatusChange(leadId, newStatusId);
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg">Tutti i Lead ({leads.length})</h3>
                     <button 
                        onClick={onAddLead}
                        className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg text-sm transition-colors hover:bg-primary/90 flex items-center gap-2"
                    >
                        <i className="fas fa-plus-circle"></i> Aggiungi Lead
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onSelectAll}
                        className="text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isSelectionMode}
                        title={isSelectionMode ? "Seleziona tutti i lead visibili" : "Attiva la modalità selezione per usare questa funzione"}
                    >
                       Seleziona Tutti
                    </button>
                    <button 
                        onClick={onToggleSelectionMode} 
                        className={`font-semibold py-2 px-4 rounded-lg text-sm transition-colors ${isSelectionMode ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
                    >
                       {isSelectionMode ? 'Annulla' : 'Seleziona'}
                    </button>
                </div>
            </div>
            <div>
                {leads.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50">
                            <tr>
                                {isSelectionMode && <th className="p-4 w-12"><input type="checkbox" checked={selectedLeadIds.size === leads.length && leads.length > 0} onChange={onSelectAll} className="w-4 h-4" /></th>}
                                <th className="p-4 font-semibold">Lead</th>
                                <th className="p-4 font-semibold">Contatti</th>
                                <th className="p-4 font-semibold">Stato</th>
                                <th className="p-4 font-semibold text-right">Data Creazione</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const column = statusIdToColumnMap.get(lead.statusId);
                                const isSelected = selectedLeadIds.has(lead.id);
                                return (
                                    <tr key={lead.id} className={`border-b border-border last:border-b-0 transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                                        {isSelectionMode && (
                                            <td className="p-4">
                                                <input type="checkbox" checked={isSelected} onChange={() => onSelectLead(lead.id)} className="w-4 h-4" />
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <div className="font-bold text-card-foreground">{lead.name}</div>
                                            <div className="text-muted-foreground">{lead.sector} - {lead.location}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col space-y-1">
                                                {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs"><i className="fas fa-globe mr-2"></i>{lead.website}</a>}
                                                {lead.email && <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate max-w-xs"><i className="fas fa-envelope mr-2"></i>{lead.email}</a>}
                                                {lead.phone && lead.phone.split(/[,;]/).map(p => p.trim()).filter(Boolean).map((phone, index) => (
                                                    <a key={index} href={`tel:${phone.replace(/\s/g, '')}`} className="text-primary hover:underline truncate max-w-xs flex items-center">
                                                        <i className="fas fa-phone mr-2"></i>{phone}
                                                    </a>
                                                ))}
                                                {/* Fix: Added display of search grounding sources to comply with GenAI tools guidelines. */}
                                                {lead.sources && lead.sources.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Fonti Web:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {lead.sources.map((source, idx) => (
                                                                source.uri && (
                                                                    <a 
                                                                        key={idx} 
                                                                        href={source.uri} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="text-[10px] bg-muted px-1.5 py-0.5 rounded hover:bg-accent transition-colors flex items-center gap-1"
                                                                        title={source.title}
                                                                    >
                                                                        <i className="fas fa-link scale-75"></i>
                                                                        Link {idx + 1}
                                                                    </a>
                                                                )
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={lead.statusId} 
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className="p-1.5 bg-transparent border border-input rounded-md text-xs w-full"
                                                onClick={(e) => e.stopPropagation()} // Prevents row selection when changing status
                                            >
                                                {columns.map(col => (
                                                    <option key={col.id} value={col.id}>{col.title}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4 text-right text-muted-foreground">
                                            {new Date(lead.createdAt).toLocaleDateString('it-IT')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                        <div>
                            <i className="fas fa-ghost text-5xl mb-4"></i>
                            <h3 className="text-xl font-semibold">Nessun lead trovato.</h3>
                            <p>Prova a modificare i filtri o a generare nuovi lead.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadList;
