import React, { useMemo } from 'react';
// Fix: Corrected import path for types.
import { Lead, KanbanColumn } from '../types';

interface StatsProps {
    leads: Lead[];
    columns: KanbanColumn[];
}

const Stats: React.FC<StatsProps> = ({ leads, columns }) => {
    const leadsByStatus = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            acc[lead.statusId] = (acc[lead.statusId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return columns
            .map(column => ({
                ...column,
                count: counts[column.id] || 0,
            }))
            .filter(column => column.count > 0)
            .sort((a, b) => b.count - a.count);

    }, [leads, columns]);
    
    const recentLeads = useMemo(() => {
        return [...leads]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);
    }, [leads]);

    return (
        <div className="bg-card border border-border p-6 rounded-lg shadow-md h-full">
            <h3 className="text-xl font-bold text-card-foreground mb-4 flex items-center"><i className="fas fa-chart-pie mr-2 text-primary"></i> Statistiche</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center bg-muted/50 p-4 rounded-lg text-center">
                    <span className="text-4xl font-bold text-primary">{leads.length}</span>
                    <span className="text-muted-foreground font-medium">Lead Totali</span>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <h4 className="font-semibold text-muted-foreground">Lead per Stato:</h4>
                    {leadsByStatus.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {leadsByStatus.map(statusInfo => (
                                <div key={statusInfo.id} className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 ${statusInfo.color} ${statusInfo.darkColor}`}>
                                    <i className={statusInfo.icon}></i>
                                    <span>{statusInfo.title}:</span>
                                    <span className="font-bold">{statusInfo.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nessun lead per le statistiche.</p>
                    )}
                </div>
            </div>
            <div className="mt-6 border-t border-border pt-4">
                 <h4 className="font-semibold text-muted-foreground mb-2">Lead Recenti:</h4>
                 {recentLeads.length > 0 ? (
                     <ul className="space-y-2">
                         {recentLeads.map(lead => (
                             <li key={lead.id} className="text-sm flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                 <div>
                                    <p className="font-semibold text-foreground">{lead.name}</p>
                                    <p className="text-muted-foreground">{lead.location}</p>
                                 </div>
                                 <span className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString('it-IT')}</span>
                             </li>
                         ))}
                     </ul>
                 ) : (
                    <p className="text-sm text-muted-foreground">Nessun lead recente.</p>
                 )}
            </div>
        </div>
    );
};

export default Stats;