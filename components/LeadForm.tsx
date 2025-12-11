import React, { useState, useEffect } from 'react';
import { Lead, Sector, KanbanColumn, Interaction, InteractionType } from '../types';
import { SECTORS_OPTIONS } from '../constants';

interface LeadFormProps {
    isOpen: boolean;
    lead: Partial<Lead> | null;
    columns: KanbanColumn[];
    onSave: (lead: Omit<Lead, 'id' | 'createdAt'> | Lead) => void;
    onClose: () => void;
}

const interactionIcons: Record<InteractionType, string> = {
    [InteractionType.CALL]: 'fas fa-phone-alt',
    [InteractionType.EMAIL]: 'fas fa-envelope',
    [InteractionType.MEETING]: 'fas fa-users',
    [InteractionType.NOTE]: 'fas fa-sticky-note',
};

const generateInteractionId = () => `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, lead, columns, onSave, onClose }) => {
    const DRAFT_KEY = `crm_draft_lead_${lead?.id || 'new'}`;
    
    const [formData, setFormData] = useState<Partial<Lead>>({
        name: '', sector: Sector.RESTAURANTS, location: '', email: '', phone: '',
        website: '', description: '', statusId: columns[0]?.id || '', interactions: [],
    });

    const [newInteractionType, setNewInteractionType] = useState<InteractionType>(InteractionType.NOTE);
    const [newInteractionDescription, setNewInteractionDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            try {
                const savedDraft = localStorage.getItem(DRAFT_KEY);
                if (savedDraft) {
                    const parsedDraft = JSON.parse(savedDraft);
                    if (parsedDraft.interactions) {
                        parsedDraft.interactions = parsedDraft.interactions.map((i: any) => ({ ...i, date: new Date(i.date) }));
                    }
                    setFormData(parsedDraft);
                } else if (lead) {
                    setFormData({ ...lead, interactions: lead.interactions || [] });
                } else {
                    setFormData({
                        name: '', sector: Sector.RESTAURANTS, location: '', email: '', phone: '',
                        website: '', description: '', statusId: columns[0]?.id || '', interactions: [],
                    });
                }
            } catch (error) {
                console.error("Errore nel caricamento della bozza del lead:", error);
                if (lead) setFormData({ ...lead, interactions: lead.interactions || [] });
            }
        }
    }, [isOpen, lead, columns, DRAFT_KEY]);

    useEffect(() => {
        if (isOpen && (formData.name || formData.description || (formData.interactions && formData.interactions.length > 0))) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }
    }, [formData, DRAFT_KEY, isOpen]);

    const cleanupDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddInteraction = () => {
        if (newInteractionDescription.trim() === '') return;

        const newInteraction: Interaction = {
            id: generateInteractionId(),
            date: new Date(),
            type: newInteractionType,
            description: newInteractionDescription,
        };

        setFormData(prev => ({
            ...prev,
            interactions: [newInteraction, ...(prev.interactions || [])],
        }));

        setNewInteractionDescription('');
        setNewInteractionType(InteractionType.NOTE);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Omit<Lead, 'id' | 'createdAt'> | Lead);
        cleanupDraft();
    };
    
    const handleClose = () => {
        cleanupDraft();
        onClose();
    };

    const sortedInteractions = (formData.interactions || []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-semibold">{lead?.id ? 'Modifica Lead' : 'Nuovo Lead'}</h2>
                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Lead Details Fields */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-muted-foreground mb-1">Settore</label>
                                <select name="sector" id="sector" value={formData.sector} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md">
                                    {SECTORS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="statusId" className="block text-sm font-medium text-muted-foreground mb-1">Stato</label>
                                <select name="statusId" id="statusId" value={formData.statusId} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md">
                                    {columns.map(column => (
                                        <option key={column.id} value={column.id}>{column.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">Località</label>
                            <input type="text" name="location" id="location" value={formData.location || ''} onChange={handleChange} required className="w-full p-2 bg-transparent border border-input rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="w-full p-2 bg-transparent border border-input rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">Telefono</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 bg-transparent border border-input rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="website" className="block text-sm font-medium text-muted-foreground mb-1">Sito Web (opzionale)</label>
                            <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange} className="w-full p-2 bg-transparent border border-input rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">Descrizione</label>
                            <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full p-2 bg-transparent border border-input rounded-md"></textarea>
                        </div>
                        
                        {/* Interaction History Section */}
                        <div className="pt-4 mt-4 border-t border-border">
                            <h3 className="text-lg font-semibold text-card-foreground mb-3">Cronologia Interazioni</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {sortedInteractions.length > 0 ? sortedInteractions.map(interaction => (
                                    <div key={interaction.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-foreground flex items-center gap-2">
                                                <i className={`${interactionIcons[interaction.type]} text-primary`}></i>
                                                {interaction.type}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{new Date(interaction.date).toLocaleString('it-IT')}</span>
                                        </div>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{interaction.description}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Nessuna interazione registrata.</p>
                                )}
                            </div>
                            
                            {/* Add Interaction Form */}
                            <div className="mt-4 space-y-2">
                                 <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={newInteractionType}
                                        onChange={(e) => setNewInteractionType(e.target.value as InteractionType)}
                                        className="col-span-1 w-full p-2 bg-transparent border border-input rounded-md text-sm"
                                    >
                                        {Object.values(InteractionType).map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                     <textarea
                                        value={newInteractionDescription}
                                        onChange={(e) => setNewInteractionDescription(e.target.value)}
                                        placeholder="Aggiungi una nota..."
                                        rows={1}
                                        className="col-span-2 w-full p-2 bg-transparent border border-input rounded-md text-sm"
                                    ></textarea>
                                </div>
                                 <button
                                    type="button"
                                    onClick={handleAddInteraction}
                                    className="w-full bg-secondary text-secondary-foreground font-semibold py-2 px-3 rounded-lg hover:bg-accent text-sm"
                                >
                                    <i className="fas fa-plus mr-2"></i>Aggiungi Interazione
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-border bg-card flex justify-end gap-3 flex-shrink-0 z-10 rounded-b-lg">
                        <button type="button" onClick={handleClose} className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent">Annulla</button>
                        <button type="submit" className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadForm;