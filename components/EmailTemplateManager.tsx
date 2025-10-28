import React, { useState, useEffect, useRef } from 'react';
import { EmailTemplate, Attachment } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface EmailTemplateManagerProps {
    templates: EmailTemplate[];
    onSave: (template: Omit<EmailTemplate, 'id' | 'userId'>, filesToUpload: File[], attachmentsToDelete: Attachment[]) => void;
    onDelete: (id: string) => Promise<void>;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({ templates, onSave, onDelete }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [formState, setFormState] = useState<Partial<EmailTemplate>>({ name: '', subject: '', body: '', attachments: [] });
    
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const DRAFT_KEY = `crm_draft_email_template_${selectedTemplate?.id || 'new'}`;

    useEffect(() => {
        if (selectedTemplate) {
            try {
                const savedDraft = localStorage.getItem(DRAFT_KEY);
                if (savedDraft) {
                    setFormState(JSON.parse(savedDraft));
                } else {
                    setFormState({ ...selectedTemplate, attachments: selectedTemplate.attachments || [] });
                }
            } catch (error) {
                console.error("Errore nel caricamento della bozza del template email:", error);
                setFormState({ ...selectedTemplate, attachments: selectedTemplate.attachments || [] });
            }
        } else {
            setFormState({ name: '', subject: '', body: '', attachments: [] });
        }
        setFilesToUpload([]);
        setAttachmentsToDelete([]);
    }, [selectedTemplate, DRAFT_KEY]);
    
    useEffect(() => {
        if (selectedTemplate && (formState.name || formState.subject || formState.body)) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formState));
        }
    }, [formState, selectedTemplate, DRAFT_KEY]);
    
    const cleanupDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleSelect = (template: EmailTemplate) => setSelectedTemplate(template);
    const handleCreateNew = () => {
        setSelectedTemplate({ id: '', userId: '', name: '', subject: '', body: '', attachments: [] });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeNewFile = (fileName: string) => {
        setFilesToUpload(prev => prev.filter(file => file.name !== fileName));
    };

    const removeExistingAttachment = (attachment: Attachment) => {
        setFormState(prev => ({ ...prev, attachments: prev.attachments?.filter(att => att.url !== attachment.url) }));
        setAttachmentsToDelete(prev => [...prev, attachment]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState as Omit<EmailTemplate, 'id' | 'userId'>, filesToUpload, attachmentsToDelete);
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

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <main className="flex-1 overflow-hidden p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><i className="fas fa-envelope-open-text mr-3 text-primary"></i>Gestione Template Email</h2>
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
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Oggetto</label>
                                <input type="text" name="subject" value={formState.subject} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Corpo dell'Email</label>
                                <textarea name="body" value={formState.body} onChange={handleChange} rows={8} required className="w-full p-2 bg-transparent border border-input rounded-md"></textarea>
                                <p className="text-xs text-muted-foreground mt-1">Usa placeholders come `{'{{nome}}'}`, `{'{{email}}'}`, `{'{{località}}'}`, etc.</p>
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Allegati</label>
                                <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline">
                                        <i className="fas fa-paperclip mr-2"></i>Scegli file da caricare
                                    </button>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {formState.attachments?.map(att => (
                                        <div key={att.url} className="flex items-center justify-between p-1.5 bg-muted/50 rounded-md text-sm">
                                            <span><i className="fas fa-file-alt mr-2 text-muted-foreground"></i>{att.name} ({formatBytes(att.size)})</span>
                                            <button type="button" onClick={() => removeExistingAttachment(att)} className="text-red-500 hover:text-red-700 w-6 h-6 rounded-full flex items-center justify-center"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    ))}
                                    {filesToUpload.map(file => (
                                        <div key={file.name} className="flex items-center justify-between p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-sm">
                                            <span><i className="fas fa-file-upload mr-2 text-blue-500"></i>{file.name} ({formatBytes(file.size)})</span>
                                            <button type="button" onClick={() => removeNewFile(file.name)} className="text-red-500 hover:text-red-700 w-6 h-6 rounded-full flex items-center justify-center"><i className="fas fa-times-circle"></i></button>
                                        </div>
                                    ))}
                                </div>
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

export default EmailTemplateManager;