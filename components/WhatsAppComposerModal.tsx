import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for types.
import { Lead, WhatsAppTemplate } from '../types';

interface WhatsAppComposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    templates: WhatsAppTemplate[];
    onSend: (body: string) => void;
}

const WhatsAppComposerModal: React.FC<WhatsAppComposerModalProps> = ({ isOpen, onClose, lead, templates, onSend }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [body, setBody] = useState('');

    const DRAFT_KEY = lead ? `crm_draft_whatsapp_single_${lead.id}` : null;

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
                    setBody(JSON.parse(savedDraft));
                } catch {
                     // Fallback se il draft non è valido
                }
            } else {
                const defaultTemplate = templates && templates.length > 0 ? templates[0] : null;
                if (defaultTemplate) {
                    setSelectedTemplateId(defaultTemplate.id);
                    setBody(replacePlaceholders(defaultTemplate.body, lead));
                } else {
                    setSelectedTemplateId('');
                    setBody(`Ciao ${lead.name}, `);
                }
            }
        }
    }, [isOpen, lead, templates, DRAFT_KEY]);

    useEffect(() => {
        if (lead && selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                setBody(replacePlaceholders(template.body, lead));
            }
        }
    }, [selectedTemplateId, lead, templates]);
    
    useEffect(() => {
        if (isOpen && DRAFT_KEY && body) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(body));
        }
    }, [body, isOpen, DRAFT_KEY]);

    const cleanupDraft = () => {
        if (DRAFT_KEY) {
            localStorage.removeItem(DRAFT_KEY);
        }
    };
    
    const handleClose = () => {
        cleanupDraft();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(body);
        cleanupDraft();
        onClose();
    };
    
    if (!isOpen || !lead) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Invia Messaggio WhatsApp a {lead.name}</h2>
                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-grow flex flex-col overflow-hidden">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-muted-foreground mb-1">Scegli un Template</label>
                        <select
                            id="template"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full p-2 bg-transparent border border-input rounded-md"
                            disabled={templates.length === 0}
                        >
                             {templates.length === 0 ? (
                                <option>Nessun template disponibile</option>
                            ) : (
                                templates.map(template => (
                                    <option key={template.id} value={template.id}>{template.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="body" className="block text-sm font-medium text-muted-foreground mb-1">Messaggio</label>
                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full p-2 bg-transparent border border-input rounded-md flex-grow"
                            rows={10}
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={handleClose} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent">Annulla</button>
                        <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">
                            <i className="fab fa-whatsapp mr-2"></i>Invia su WhatsApp
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WhatsAppComposerModal;