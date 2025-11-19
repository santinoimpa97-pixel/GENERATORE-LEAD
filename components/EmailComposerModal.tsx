import React, { useState, useEffect } from 'react';
import { Lead, EmailTemplate, Attachment } from '../types';

interface EmailComposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    templates: EmailTemplate[];
    onSend: (subject: string, body: string, attachments: Attachment[]) => Promise<boolean>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ isOpen, onClose, lead, templates, onSend, showToast }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const DRAFT_KEY = lead ? `crm_draft_email_single_${lead.id}` : null;

    const replacePlaceholders = (text: string, currentLead: Lead): string => {
        if (!currentLead) return text;
        return text
            .replace(/{{nome}}/g, currentLead.name)
            .replace(/{{email}}/g, currentLead.email)
            .replace(/{{telefono}}/g, currentLead.phone)
            .replace(/{{settore}}/g, currentLead.sector)
            .replace(/{{località}}/g, currentLead.location);
    };

    useEffect(() => {
        if (isOpen && lead && DRAFT_KEY) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const { subject: savedSubject, body: savedBody } = JSON.parse(savedDraft);
                    setSubject(savedSubject);
                    setBody(savedBody);
                } catch {
                    // Fallback se il draft non è valido
                }
            } else {
                const defaultTemplate = templates && templates.length > 0 ? templates[0] : null;
                if (defaultTemplate) {
                    setSelectedTemplateId(defaultTemplate.id);
                    setSubject(replacePlaceholders(defaultTemplate.subject, lead));
                    setBody(replacePlaceholders(defaultTemplate.body, lead));
                    setAttachments(defaultTemplate.attachments || []);
                } else {
                    setSelectedTemplateId('');
                    setSubject('');
                    setBody(`Ciao ${lead.name},\n\n`);
                    setAttachments([]);
                }
            }
        }
    }, [isOpen, lead, templates, DRAFT_KEY]);

    useEffect(() => {
        if (lead && selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                setSubject(replacePlaceholders(template.subject, lead));
                setBody(replacePlaceholders(template.body, lead));
                setAttachments(template.attachments || []);
            }
        }
    }, [selectedTemplateId, lead, templates]);

    useEffect(() => {
        if (isOpen && DRAFT_KEY && (subject || body)) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, body }));
        }
    }, [subject, body, isOpen, DRAFT_KEY]);
    
    const cleanupDraft = () => {
        if (DRAFT_KEY) {
            localStorage.removeItem(DRAFT_KEY);
        }
    };

    const handleClose = () => {
        cleanupDraft();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSend(subject, body, attachments);
            cleanupDraft();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Errore sconosciuto";
            showToast(`Invio fallito: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    if (!isOpen || !lead) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-semibold">Invia Email a {lead.name}</h2>
                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1">
                                <label htmlFor="template" className="block text-sm font-medium text-muted-foreground mb-1">Template</label>
                                <select
                                    id="template"
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full p-2 bg-transparent border border-input rounded-md"
                                    disabled={templates.length === 0 || isLoading}
                                >
                                    {templates.length > 0 ? (
                                        templates.map(template => (
                                            <option key={template.id} value={template.id}>{template.name}</option>
                                        ))
                                    ) : (
                                        <option>Nessun template</option>
                                    )}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                 <label htmlFor="to" className="block text-sm font-medium text-muted-foreground mb-1">A:</label>
                                 <input type="text" id="to" value={lead.email} disabled className="w-full p-2 bg-muted/50 border border-input rounded-md cursor-not-allowed" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1">Oggetto</label>
                            <input
                                type="text"
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-2 bg-transparent border border-input rounded-md"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex flex-col flex-grow">
                            <label htmlFor="body" className="block text-sm font-medium text-muted-foreground mb-1">Corpo del Messaggio</label>
                            <textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full p-2 bg-transparent border border-input rounded-md flex-grow"
                                rows={8}
                                required
                                disabled={isLoading}
                            ></textarea>
                        </div>
                        {attachments.length > 0 && (
                            <div>
                                 <h4 className="text-sm font-medium text-muted-foreground mb-1">Allegati:</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {attachments.map(att => (
                                        <div key={att.url} className="text-xs bg-muted/50 p-2 rounded-md flex items-center gap-2">
                                            <i className="fas fa-paperclip"></i>
                                            <span>{att.name} ({formatBytes(att.size)})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-border bg-card flex justify-end gap-3 flex-shrink-0 z-10">
                        <button type="button" onClick={handleClose} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent" disabled={isLoading}>Annulla</button>
                        <button type="submit" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={isLoading}>
                            {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Invio...</> : <><i className="fas fa-paper-plane mr-2"></i>Invia Email</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailComposerModal;