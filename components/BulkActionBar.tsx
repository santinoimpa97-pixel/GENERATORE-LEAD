import React, { useState } from 'react';
import { KanbanColumn } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface BulkActionBarProps {
    selectedCount: number;
    columns: KanbanColumn[];
    onDelete: () => void;
    onUpdateStatus: (newStatusId: string) => void;
    onEdit: () => void;
    onEmailAction: () => void;
    onWhatsApp: () => void;
    onDeselectAll: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    columns,
    onDelete,
    onUpdateStatus,
    onEdit,
    onEmailAction,
    onWhatsApp,
    onDeselectAll
}) => {
    const [targetStatusId, setTargetStatusId] = useState<string>(columns[0]?.id || '');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (selectedCount === 0) {
        return null;
    }
    
    const handleUpdateStatus = () => {
        if (targetStatusId) {
            onUpdateStatus(targetStatusId);
        }
    };

    const handleDeleteClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-0 left-64 right-0 bg-card border-t border-border shadow-lg p-3 flex items-center justify-between z-40 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{selectedCount} lead selezionati</span>
                    <button onClick={onDeselectAll} className="text-xs text-primary hover:underline">Deseleziona tutto</button>
                </div>
                <div className="flex items-center gap-2">
                    {selectedCount === 1 && (
                        <>
                            <button onClick={onEdit} className="bg-secondary text-secondary-foreground font-semibold py-2 px-3 rounded-lg text-sm hover:bg-accent"><i className="fas fa-pencil-alt mr-2"></i>Modifica</button>
                            <button onClick={onWhatsApp} className="bg-secondary text-secondary-foreground font-semibold py-2 px-3 rounded-lg text-sm hover:bg-accent"><i className="fab fa-whatsapp mr-2"></i>WhatsApp</button>
                        </>
                    )}
                    
                    <button onClick={onEmailAction} className="bg-secondary text-secondary-foreground font-semibold py-2 px-3 rounded-lg text-sm hover:bg-accent"><i className="fas fa-envelope mr-2"></i>Email</button>

                    <div className="flex items-center gap-1 border-l border-border pl-2">
                        <select 
                            value={targetStatusId}
                            onChange={(e) => setTargetStatusId(e.target.value)}
                            className="p-2 bg-transparent border border-input rounded-md text-sm"
                        >
                            {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                        </select>
                        <button onClick={handleUpdateStatus} className="bg-secondary text-secondary-foreground font-semibold py-2 px-3 rounded-lg text-sm hover:bg-accent">Sposta</button>
                    </div>
                    <button onClick={handleDeleteClick} className="bg-destructive text-destructive-foreground font-semibold py-2 px-3 rounded-lg text-sm hover:bg-destructive/90 ml-2">
                        <i className="fas fa-trash-alt mr-2"></i>Elimina
                    </button>
                </div>
            </div>
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Conferma Eliminazione Multipla"
                message={`Sei sicuro di voler eliminare i ${selectedCount} lead selezionati? Questa azione è irreversibile.`}
                isConfirming={isDeleting}
            />
        </>
    );
};

export default BulkActionBar;
