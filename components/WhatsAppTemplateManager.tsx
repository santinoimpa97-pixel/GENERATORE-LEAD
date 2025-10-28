import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for types.
import { WhatsAppTemplate } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface WhatsAppTemplateManagerProps {
    templates: WhatsAppTemplate[];
    onSave: (template: WhatsAppTemplate) => void;
    onDelete: (id: string) => Promise<void>;
}

const WhatsAppTemplateManager: React.FC<WhatsAppTemplateManagerProps> = ({ templates, onSave, onDelete }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
    const [formState, setFormState] = useState<Partial<WhatsAppTemplate>>({ name: '', body: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const DRAFT_KEY = `crm_draft_whatsapp_template_${selectedTemplate?.id || 'new'}`;

    useEffect(() => {
        if (selectedTemplate) {
            try {
                const savedDraft = localStorage.getItem(DRAFT_KEY);
                if (savedDraft) {
                    setFormState(JSON.parse(savedDraft));
                } else {
                    setFormState(selectedTemplate);
                }
            } catch (error) {
                console.error("Errore nel caricamento della bozza del template WhatsApp:", error);
                setFormState(selectedTemplate);
            }
        } else {
            setFormState({ name: '', body: '' });
        }
    }, [selectedTemplate, DRAFT_KEY]);

    useEffect(() => {
        if (selectedTemplate && (formState.name || formState.body)) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
        }
    }, [formState, selectedTemplate, DRAFT_KEY]);

    const cleanupDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleSelect = (template: WhatsAppTemplate) => setSelectedTemplate(template);
    const handleCreateNew = () => {
        setSelectedTemplate({ id: '', userId: '', name: '', body: '' });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...selectedTemplate, ...formState } as WhatsAppTemplate);
        cleanupDraft();
        setSelectedTemplate(null);
    };
    
    const handleCancel = () => {
        cleanupDraft();
        setSelectedTemplate(null);
    };

    const handleDeleteClick = () => {
        if (selectedTemplate && selectedTemplate.id) {
            setIsConfirmModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTemplate || !selectedTemplate.id) return;
        
        setIsDeleting(true);
        try {
            await onDelete(selectedTemplate.id);
            cleanupDraft();
            setIsConfirmModalOpen(false);
            setSelectedTemplate(null);
        } catch (error) {
            console.error("Impossibile eliminare il template:", error);
            setIsConfirmModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="flex-1 overflow-hidden p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><i className="fab fa-whatsapp mr-3 text-green-500"></i>Gestione Template WhatsApp</h2>
            <div className="flex-grow flex overflow-hidden border border-border rounded-lg">
                <div className="w-1/3 border-r border-border p-4 overflow-y-auto">
                    <button onClick={handleCreateNew} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 mb-4">
                        Crea Nuovo Template
                    </button>
                    <ul className="space-y-2">
                        {templates.map(t => (
                            <li key={t.id}>
                                <button
                                    onClick={() => handleSelect(t)}
                                    className={`w-full text-left p-2 rounded-md ${selectedTemplate?.id === t.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                                >
                                    {t.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-2/3 p-6 overflow-y-auto">
                    {selectedTemplate ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="font-bold text-lg">{selectedTemplate.id ? 'Modifica Template' : 'Crea Nuovo Template'}</h3>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Nome Template</label>
                                <input type="text" name="name" value={formState.name} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Corpo del Messaggio</label>
                                <textarea name="body" value={formState.body} onChange={handleChange} rows={10} required className="w-full p-2 bg-transparent border border-input rounded-md"></textarea>
                                <p className="text-xs text-muted-foreground mt-1">Usa placeholders come `{'{{nome}}'}`, `{'{{email}}'}`, `{'{{località}}'}`, etc.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                 {selectedTemplate.id && (
                                    <button 
                                        type="button" 
                                        onClick={handleDeleteClick} 
                                        className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90"
                                    >
                                        Elimina
                                    </button>
                                )}
                                <button type="button" onClick={handleCancel} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent">Annulla</button>
                                <button type="submit" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                                    {selectedTemplate.id ? 'Salva Modifiche' : 'Crea Template'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <i className="fas fa-edit text-5xl mb-4"></i>
                            <p>Seleziona un template da modificare o creane uno nuovo.</p>
                        </div>
                    )}
                </div>
            </div>
             {selectedTemplate && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Conferma Eliminazione Template"
                    message={`Sei sicuro di voler eliminare il template "${selectedTemplate.name}"? L'azione non può essere annullata.`}
                    isConfirming={isDeleting}
                />
            )}
        </main>
    );
};

export default WhatsAppTemplateManager;