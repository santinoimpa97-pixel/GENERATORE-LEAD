import React from 'react';
// Fix: Corrected import path for types.
import { Lead, KanbanColumn } from '../types';

interface ExportButtonProps {
    leads: Lead[];
    columns: KanbanColumn[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ leads, columns }) => {
    const handleExport = () => {
        if (leads.length === 0) {
            alert("Nessun lead da esportare.");
            return;
        }

        const headers = [
            "ID", "Nome", "Settore", "Località", "Email", 
            "Telefono", "Sito Web", "Descrizione", "Stato", "Data Creazione"
        ];

        const escapeCsvCell = (cellData: string | undefined | null | Date) => {
            if (cellData == null) {
                return '';
            }
            const stringData = cellData instanceof Date ? cellData.toISOString() : String(cellData);
            if (stringData.includes('"') || stringData.includes(',') || stringData.includes('\n')) {
                return `"${stringData.replace(/"/g, '""')}"`;
            }
            return stringData;
        };

        const statusIdToTitleMap = new Map(columns.map(c => [c.id, c.title]));

        const csvRows = [
            headers.join(','),
            ...leads.map(lead => [
                escapeCsvCell(lead.id),
                escapeCsvCell(lead.name),
                escapeCsvCell(lead.sector),
                escapeCsvCell(lead.location),
                escapeCsvCell(lead.email),
                escapeCsvCell(lead.phone),
                escapeCsvCell(lead.website),
                escapeCsvCell(lead.description),
                escapeCsvCell(statusIdToTitleMap.get(lead.statusId) || lead.statusId),
                escapeCsvCell(lead.createdAt)
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            disabled={leads.length === 0}
            className="w-full sm:w-auto bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={leads.length === 0 ? "Nessun lead da esportare" : "Esporta i lead filtrati in CSV"}
        >
            <i className="fas fa-file-csv"></i> Esporta CSV
        </button>
    );
};

export default ExportButton;