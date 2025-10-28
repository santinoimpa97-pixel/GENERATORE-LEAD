import React, { useRef } from 'react';
// Fix: Corrected import path for types.
import { Lead, Sector, KanbanColumn } from '../types';

interface ImportButtonProps {
    columns: KanbanColumn[];
    onImport: (leads: Omit<Lead, 'userId'>[]) => void;
    onImportError: (message: string) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ columns, onImport, onImportError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const newLeads = parseCSV(text);
                onImport(newLeads);
            } catch (error) {
                if (error instanceof Error) {
                     onImportError(`Errore durante l'importazione: ${error.message}`);
                } else {
                     onImportError("Si è verificato un errore sconosciuto durante l'importazione.");
                }
            }
        };
        reader.onerror = () => onImportError("Impossibile leggere il file.");
        reader.readAsText(file);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const parseCSV = (csvText: string): Omit<Lead, 'userId'>[] => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const requiredHeaders = ["Nome", "Settore", "Località", "Email", "Telefono", "Stato"];
        if(!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error("Formato CSV non valido. Mancano colonne obbligatorie: Nome, Settore, Località, Email, Telefono, Stato.");
        }

        const columnTitleToIdMap = columns.reduce((acc, col) => {
            acc[col.title.toLowerCase()] = col.id;
            return acc;
        }, {} as Record<string, string>);

        return lines.slice(1).map(line => {
            const values = line.split(',');
            const leadData = headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim().replace(/^"|"$/g, '') || '';
                return obj;
            }, {} as Record<string, string>);
            
            const statusId = columnTitleToIdMap[leadData["Stato"]?.toLowerCase()] || columns[0]?.id;
            if (!statusId) throw new Error("Nessuna colonna di stato disponibile per l'importazione.");

            return {
                id: leadData["ID"] || `imported-${Date.now()}-${Math.random()}`,
                name: leadData["Nome"],
                sector: leadData["Settore"] as Sector,
                location: leadData["Località"],
                email: leadData["Email"],
                phone: leadData["Telefono"],
                website: leadData["Sito Web"] || '',
                description: leadData["Descrizione"] || '',
                statusId: statusId,
                createdAt: leadData["Data Creazione"] ? new Date(leadData["Data Creazione"]) : new Date(),
                interactions: [],
                sources: []
            };
        });
    };

    const handleClick = () => fileInputRef.current?.click();

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <button
                onClick={handleClick}
                className="w-full sm:w-auto bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent transition duration-300 flex items-center justify-center gap-2"
                title="Importa lead da un file CSV"
            >
                <i className="fas fa-file-upload"></i> Importa CSV
            </button>
        </>
    );
};

export default ImportButton;
