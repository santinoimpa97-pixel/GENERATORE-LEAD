import React, { useState, useEffect, useRef } from 'react';
import { KanbanColumn, Lead } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface ColumnManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: KanbanColumn[];
    leads: Lead[];
    onSave: (column: KanbanColumn) => void;
    onDelete: (columnId: string, targetColumnId: string) => Promise<void>;
    onSaveOrder: (columns: KanbanColumn[]) => void;
}

const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({ isOpen, onClose, columns, leads, onSave, onDelete, onSaveOrder }) => {
    const [orderedColumns, setOrderedColumns] = useState<KanbanColumn[]>([]);
    const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
    const [formState, setFormState] = useState<Omit<KanbanColumn, 'id' | 'userId' | 'position'>>({ title: '', icon: 'fas fa-question-circle', color: 'bg-gray-100 text-gray-800', darkColor: 'dark:bg-gray-900 dark:text-gray-300', textColor: 'text-gray-500'});
    const [targetColumnId, setTargetColumnId] = useState<string>('');
    const [leadsInColumn, setLeadsInColumn] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isOrderChanged, setIsOrderChanged] = useState(false);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setOrderedColumns(columns);
        setIsOrderChanged(false);
    }, [columns, isOpen]);

    useEffect(() => {
        if (editingColumn) {
            setFormState(editingColumn);
            const count = leads.filter(l => l.statusId === editingColumn.id).length;
            setLeadsInColumn(count);
            const defaultTarget = columns.find(c => c.id !== editingColumn.id);
            setTargetColumnId(defaultTarget?.id || '');
            setDeleteError(null);
        } else {
            setFormState({ title: '', icon: 'fas fa-question-circle', color: 'bg-gray-100 text-gray-800', darkColor: 'dark:bg-gray-900 dark:text-gray-300', textColor: 'text-gray-500'});
        }
    }, [editingColumn, columns, leads]);

    if (!isOpen) return null;
    
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('opacity-50', 'bg-accent');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragOverItem.current = index;
    };
    
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            return;
        }
        const newOrderedColumns = [...orderedColumns];
        const dragItemContent = newOrderedColumns.splice(dragItem.current, 1)[0];
        newOrderedColumns.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setOrderedColumns(newOrderedColumns);
        setIsOrderChanged(true);
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('opacity-50', 'bg-accent');
    };

    const handleSelectColumn = (column: KanbanColumn) => setEditingColumn(column);
    const handleCreateNew = () => setEditingColumn({ id: '', userId: '', title: '', icon: 'fas fa-stream', color: 'bg-gray-100 text-gray-800', darkColor: 'dark:bg-gray-900 dark:text-gray-300', textColor: 'text-gray-500', position: columns.length });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormState({ ...formState, [e.target.name]: e.target.value });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...editingColumn, ...formState } as KanbanColumn);
        setEditingColumn(null);
    };
    
    const handleSaveOrder = () => {
        onSaveOrder(orderedColumns);
        setIsOrderChanged(false);
    };
    
    const handleDeleteClick = () => {
        if (!editingColumn || !editingColumn.id) return;
        if (leadsInColumn > 0 && !targetColumnId) {
            setDeleteError("Seleziona una colonna dove spostare i lead esistenti.");
            return;
        }
        setDeleteError(null);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!editingColumn || !editingColumn.id) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await onDelete(editingColumn.id, targetColumnId);
            setIsConfirmModalOpen(false);
            setEditingColumn(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Si è verificato un errore sconosciuto.";
            setDeleteError(message);
            setIsConfirmModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Gestione Colonne</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><i className="fas fa-times text-2xl"></i></button>
                    </div>
                    <div className="flex-grow flex overflow-hidden">
                        <div className="w-1/3 border-r border-border p-4 flex flex-col">
                             <div className="space-y-2 mb-4">
                                <button onClick={handleCreateNew} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                                    <i className="fas fa-plus mr-2"></i>Crea Nuova Colonna
                                </button>
                                {isOrderChanged && (
                                    <button onClick={handleSaveOrder} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 animate-pulse">
                                        <i className="fas fa-save mr-2"></i>Salva Ordine
                                    </button>
                                )}
                            </div>
                            <ul className="space-y-2 overflow-y-auto">
                                {orderedColumns.map((c, index) => (
                                    <li 
                                        key={c.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        className={`flex items-center justify-between p-2 rounded-md group transition-colors ${editingColumn?.id === c.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                                    >
                                        <button
                                            onClick={() => handleSelectColumn(c)}
                                            className="flex-grow text-left flex items-center gap-2"
                                        >
                                            <i className={`${c.icon} ${c.textColor}`}></i> {c.title}
                                        </button>
                                        <i className="fas fa-grip-vertical text-muted-foreground cursor-grab group-hover:text-foreground transition-colors"></i>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-2/3 p-6 overflow-y-auto">
                            {editingColumn ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="font-bold text-lg">{editingColumn.id ? 'Modifica Colonna' : 'Crea Nuova Colonna'}</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Titolo</label>
                                        <input type="text" name="title" value={formState.title} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Icona (es. 'fas fa-star')</label>
                                        <input type="text" name="icon" value={formState.icon} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                                    </div>
                                    <div className="text-sm text-muted-foreground">Suggerimento: usa le classi di <a href="https://fontawesome.com/v5/search?m=free" target="_blank" rel="noopener noreferrer" className="text-primary underline">Font Awesome 5</a>.</div>

                                    {editingColumn.id && leadsInColumn > 0 && columns.length > 1 && (
                                        <div className="mt-6 p-4 border-t border-destructive/20 bg-destructive/10 rounded-lg">
                                            <p className="font-semibold text-destructive-foreground">Questa colonna contiene {leadsInColumn} lead.</p>
                                            <p className="text-sm text-destructive-foreground/80 mb-2">Prima di eliminarla, scegli dove spostare questi lead:</p>
                                            <select value={targetColumnId} onChange={(e) => setTargetColumnId(e.target.value)} className="w-full p-2 bg-transparent border border-destructive/50 rounded-md">
                                                {columns.filter(c => c.id !== editingColumn.id).map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {deleteError && (
                                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center mt-4">
                                            {deleteError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4">
                                        {editingColumn.id && columns.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={handleDeleteClick} 
                                                className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90"
                                            >
                                                Elimina
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setEditingColumn(null)} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent">Annulla</button>
                                        <button type="submit" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                                            {editingColumn.id ? 'Salva Modifiche' : 'Crea Colonna'}
                                        </button>
                                    </div>
                                    
                                </form>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <i className="fas fa-edit text-5xl mb-4"></i>
                                    <p>Seleziona una colonna da modificare o riordinala tramite trascinamento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {editingColumn && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Conferma Eliminazione"
                    message={
                        <>
                            <p>Sei sicuro di voler eliminare la colonna "{editingColumn.title}"?</p>
                            {leadsInColumn > 0 && <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400"><strong>{leadsInColumn}</strong> lead verranno spostati nella colonna selezionata.</p>}
                            <p className="mt-2 font-bold">Questa azione è irreversibile.</p>
                        </>
                    }
                    isConfirming={isDeleting}
                />
            )}
        </>
    );
};

export default ColumnManagerModal;