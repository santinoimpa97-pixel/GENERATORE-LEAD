import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Lead, KanbanColumn, Filters, Sector, Notification, EmailTemplate, WhatsAppTemplate, Attachment, InteractionType } from '../types';
import { DEFAULT_COLUMNS } from '../constants';
import Sidebar from './Sidebar';
import Header from './Header';
import Stats from './Stats';
import LeadGenerator from './LeadGenerator';
import FilterControls from './FilterControls';
import LeadList from './LeadList';
import LeadForm from './LeadForm';
import BulkActionBar from './BulkActionBar';
import ColumnManagerModal from './ColumnManagerModal';
import NotificationsModal from './NotificationsModal';
import Toast from './Toast';
import EmailTemplateManager from './EmailTemplateManager';
import WhatsAppTemplateManager from './WhatsAppTemplateManager';
import SettingsView from './settings/SettingsView';
import BulkEmailComposerModal from './BulkEmailComposerModal';
import WhatsAppComposerModal from './WhatsAppComposerModal';
import EmailComposerModal from './EmailComposerModal';

type View = 'dashboard' | 'emailTemplates' | 'whatsappTemplates' | 'settings';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    
    const [leads, setLeads] = useState<Lead[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [activeView, setActiveView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
    
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', statusId: 'all', sector: 'all', location: '' });
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
    const [isSingleEmailOpen, setIsSingleEmailOpen] = useState(false);
    const [isWhatsAppComposerOpen, setIsWhatsAppComposerOpen] = useState(false);
    
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('Ricerca lead in corso...');

    useEffect(() => {
        if (isGeneratingLeads) {
            const messages = [
                "Sto interrogando Google per i migliori contatti...",
                "Analizzo i risultati per estrarre le informazioni...",
                "Filtro i lead per assicurarmi che siano validi...",
                "Quasi pronto, sto formattando i dati per te..."
            ];
            let messageIndex = 0;
            setLoadingMessage(messages[messageIndex]);
            
            const interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setLoadingMessage(messages[messageIndex]);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [isGeneratingLeads]);
    
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    }, []);

    const addNotification = useCallback(async (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        if(!user) return;
        const newNotification = { user_id: user.id, message, type, read: false };
        const { data, error } = await supabase.from('notifications').insert(newNotification).select();
        if (error) {
            console.error("Errore nel salvare la notifica:", error);
        } else if (data) {
             const newNotif = {
                id: data[0].id,
                message: data[0].message,
                type: data[0].type,
                read: data[0].read
            };
            setNotifications(prev => [newNotif, ...prev]);
        }
    }, [user]);

    // Data Mapping Functions
    const mapColumnFromDb = (dbColumn: any): KanbanColumn => ({
        id: dbColumn.id,
        userId: dbColumn.user_id,
        title: dbColumn.title,
        icon: dbColumn.icon,
        color: dbColumn.color,
        darkColor: dbColumn.dark_color,
        textColor: dbColumn.text_color,
        position: dbColumn.position,
    });

    const mapColumnToDb = (column: Partial<KanbanColumn>): any => {
        const { id, userId, darkColor, textColor, ...rest } = column;
        return {
            id: id || undefined,
            ...rest,
            user_id: userId,
            dark_color: darkColor,
            text_color: textColor,
        };
    };

    const mapLeadFromDb = (dbLead: any): Lead => ({
        id: dbLead.id,
        userId: dbLead.user_id,
        name: dbLead.name,
        sector: dbLead.sector,
        location: dbLead.location,
        email: dbLead.email,
        phone: dbLead.phone,
        website: dbLead.website,
        description: dbLead.description,
        statusId: dbLead.status_id,
        createdAt: new Date(dbLead.created_at),
        interactions: (dbLead.interactions || []).map((i: any) => ({ ...i, date: new Date(i.date) })),
        sources: dbLead.sources || [],
    });

    const mapLeadToDb = (lead: Partial<Lead>): any => {
        const { id, userId, statusId, createdAt, interactions, sources, ...rest } = lead;
        return {
            id: id || undefined,
            ...rest,
            user_id: userId,
            status_id: statusId,
            interactions: interactions || [],
            sources: sources || [],
        };
    };

    const mapEmailTemplateFromDb = (dbTemplate: any): EmailTemplate => ({
        id: dbTemplate.id,
        userId: dbTemplate.user_id,
        name: dbTemplate.name,
        subject: dbTemplate.subject,
        body: dbTemplate.body,
        attachments: dbTemplate.attachments || [],
    });

    const mapEmailTemplateToDb = (template: Partial<EmailTemplate>): any => {
        const { id, userId, ...rest } = template;
        return {
            id: id || undefined,
            ...rest,
            user_id: userId,
        };
    };

    const mapWhatsAppTemplateFromDb = (dbTemplate: any): WhatsAppTemplate => ({
        id: dbTemplate.id,
        userId: dbTemplate.user_id,
        name: dbTemplate.name,
        body: dbTemplate.body,
    });
    
    const mapWhatsAppTemplateToDb = (template: Partial<WhatsAppTemplate>): any => {
        const { id, userId, ...rest } = template;
        return {
            id: id || undefined,
            ...rest,
            user_id: userId,
        };
    };

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        
        // 1. Stale-While-Revalidate: Try to load from cache first for an instant UI
        let isCacheLoaded = false;
        try {
            const cachedData = localStorage.getItem(`crm_cache_${user.id}`);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setLeads(parsedData.leads.map((l: any) => ({...l, createdAt: new Date(l.createdAt)})) || []);
                setColumns(parsedData.columns || []);
                setEmailTemplates(parsedData.emailTemplates || []);
                setWhatsAppTemplates(parsedData.whatsAppTemplates || []);
                setLoading(false); // Remove loading screen immediately
                isCacheLoaded = true;
            }
        } catch (e) {
            console.error("Failed to load or parse cache", e);
            localStorage.removeItem(`crm_cache_${user.id}`); // Clear corrupted cache
        }
        
        if (!isCacheLoaded) {
            setLoading(true);
        }

        // 2. Fetch fresh data from Supabase in the background
        try {
            const [columnsRes, leadsRes, emailTemplatesRes, whatsAppTemplatesRes, notificationsRes] = await Promise.all([
                supabase.from('columns').select('*').eq('user_id', user.id).order('position', { ascending: true }),
                supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).order('id', { ascending: true }),
                supabase.from('email_templates').select('*').eq('user_id', user.id),
                supabase.from('whatsapp_templates').select('*').eq('user_id', user.id),
                supabase.from('notifications').select('id, message, type, read').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
            ]);
            
            if (columnsRes.error) throw columnsRes.error;
            let columnsData = columnsRes.data;
            if (!columnsData || columnsData.length === 0) {
                const defaultColumnsToInsert = DEFAULT_COLUMNS.map((col, index) => ({ 
                    user_id: user.id, 
                    title: col.title,
                    icon: col.icon,
                    color: col.color,
                    dark_color: col.darkColor,
                    text_color: col.textColor,
                    position: index,
                }));
                const { data, error } = await supabase.from('columns').insert(defaultColumnsToInsert).select();
                if (error) throw error;
                columnsData = data;
            }
            setColumns(columnsData.map(mapColumnFromDb));
            
            if (leadsRes.error) throw leadsRes.error;
            setLeads(leadsRes.data.map(mapLeadFromDb));

            if (emailTemplatesRes.error) throw emailTemplatesRes.error;
            setEmailTemplates(emailTemplatesRes.data.map(mapEmailTemplateFromDb));
            
            if (whatsAppTemplatesRes.error) throw whatsAppTemplatesRes.error;
            setWhatsAppTemplates(whatsAppTemplatesRes.data.map(mapWhatsAppTemplateFromDb));

            if (notificationsRes.error) throw notificationsRes.error;
            setNotifications(notificationsRes.data);

        } catch (error) {
            const message = error instanceof Error ? error.message : "Errore sconosciuto";
            showToast(`Errore nel caricamento dati: ${message}`, 'error');
            addNotification(`Errore nel caricamento dati: ${message}`, 'error');
        } finally {
            if (!isCacheLoaded) {
                 setLoading(false);
            }
        }
    }, [user, showToast, addNotification]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Effect to automatically update cache when data changes
    useEffect(() => {
        if (!loading && user) {
            const cacheData = {
                leads,
                columns,
                emailTemplates,
                whatsAppTemplates,
            };
            localStorage.setItem(`crm_cache_${user.id}`, JSON.stringify(cacheData));
        }
    }, [leads, columns, emailTemplates, whatsAppTemplates, user, loading]);


    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const searchTermLower = filters.searchTerm.toLowerCase();
            const matchesSearch = !filters.searchTerm ||
                lead.name.toLowerCase().includes(searchTermLower) ||
                lead.email.toLowerCase().includes(searchTermLower) ||
                lead.location.toLowerCase().includes(searchTermLower);
            
            const matchesStatus = filters.statusId === 'all' || lead.statusId === filters.statusId;
            const matchesSector = filters.sector === 'all' || lead.sector === filters.sector;
            const matchesLocation = !filters.location || lead.location.toLowerCase().includes(filters.location.toLowerCase());

            return matchesSearch && matchesStatus && matchesSector && matchesLocation;
        }).sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            if (dateB !== dateA) {
                return dateB - dateA;
            }
            return a.id.localeCompare(b.id);
        });
    }, [leads, filters]);
    
    // Lead Handlers
    const handleLeadsGenerated = useCallback(async (newLeadsData: Partial<Lead>[]) => {
        if (!user || columns.length === 0) return;
        const defaultStatusId = columns.find(c => c.title === 'Da Contattare')?.id || columns[0].id;

        const leadsToInsert = newLeadsData.map(lead => ({
            name: lead.name || 'N/A',
            sector: lead.sector || Sector.OTHER,
            location: lead.location || 'N/A',
            email: lead.email || 'N/A',
            phone: lead.phone || 'N/A',
            website: lead.website,
            description: lead.description || '',
            status_id: defaultStatusId,
            user_id: user.id,
            interactions: [],
            sources: lead.sources || [],
        }));
        
        const { data, error } = await supabase.from('leads').insert(leadsToInsert).select();

        if (error) {
            showToast(`Errore nel salvaggio dei lead: ${error.message}`, 'error');
        } else if (data) {
            setLeads(prev => [...data.map(mapLeadFromDb), ...prev]);
        }
    }, [user, columns, showToast]);
    
    const handleGenerationStart = () => {
        setIsGeneratingLeads(true);
        const toContactColumnId = columns.find(c => c.title === 'Da Contattare')?.id || columns[0]?.id;
        if (toContactColumnId) {
            setFilters(prevFilters => ({
                ...prevFilters,
                statusId: toContactColumnId,
            }));
        }
    };
    
    const handleSaveLead = async (leadData: Partial<Lead>) => {
        if (!user) return;
        const isNew = !leadData.id;
        
        const dataToUpsert = mapLeadToDb({
            ...leadData,
            userId: user.id,
        });
        
        const { data, error } = await supabase.from('leads').upsert(dataToUpsert).select();

        if (error) {
            showToast(`Errore: ${error.message}`, 'error');
        } else if (data) {
            const updatedLead = mapLeadFromDb(data[0]);
            if (isNew) {
                setLeads(prev => [updatedLead, ...prev]);
                showToast('Lead creato con successo!', 'success');
            } else {
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                showToast('Lead aggiornato!', 'success');
            }
        }
        setIsLeadModalOpen(false);
        setEditingLead(null);
    };

    const handleDeleteSelectedLeads = async () => {
        if (selectedLeadIds.size === 0) return;
        
        const idsToDelete = Array.from(selectedLeadIds);
        const { error } = await supabase.from('leads').delete().in('id', idsToDelete);
        
        if (error) {
            showToast(`Errore: ${error.message}`, 'error');
        } else {
            setLeads(prev => prev.filter(l => !idsToDelete.includes(l.id)));
            showToast(`${idsToDelete.length} lead eliminati.`, 'success');
            setSelectedLeadIds(new Set());
            setIsSelectionMode(false);
        }
    };

    const handleUpdateStatus = async (leadId: string, newStatusId: string) => {
        const { data, error } = await supabase
            .from('leads')
            .update({ status_id: newStatusId })
            .eq('id', leadId)
            .select();

        if (error) {
            showToast(`Errore aggiornamento stato: ${error.message}`, 'error');
        } else if (data) {
            setLeads(prev => prev.map(l => l.id === leadId ? mapLeadFromDb(data[0]) : l));
        }
    };
    
    const handleBulkUpdateStatus = async (newStatusId: string) => {
        if (selectedLeadIds.size === 0) return;
        const idsToUpdate = Array.from(selectedLeadIds);
        
        const { error } = await supabase
            .from('leads')
            .update({ status_id: newStatusId })
            .in('id', idsToUpdate);

        if (error) {
            showToast(`Errore: ${error.message}`, 'error');
        } else {
            setLeads(prev => prev.map(l => idsToUpdate.includes(l.id) ? { ...l, statusId: newStatusId } : l));
            showToast(`${idsToUpdate.length} lead spostati.`, 'success');
            setSelectedLeadIds(new Set());
            setIsSelectionMode(false);
        }
    };

    // Modal Triggers
    const openLeadForm = (lead: Partial<Lead> | null = null) => {
        setEditingLead(lead);
        setIsLeadModalOpen(true);
    };

    const handleEditSelectedLead = () => {
        if (selectedLeadIds.size !== 1) return;
        const leadId = Array.from(selectedLeadIds)[0];
        const leadToEdit = leads.find(l => l.id === leadId);
        if (leadToEdit) {
            openLeadForm(leadToEdit);
        }
    };

    // Selection Handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) { // Turning it off
            setSelectedLeadIds(new Set());
        }
    };

    const handleSelectLead = (leadId: string) => {
        const newSelection = new Set(selectedLeadIds);
        if (newSelection.has(leadId)) {
            newSelection.delete(leadId);
        } else {
            newSelection.add(leadId);
        }
        setSelectedLeadIds(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedLeadIds.size === filteredLeads.length) {
            setSelectedLeadIds(new Set());
        } else {
            setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
        }
    };
    
    // Column Handlers
    const handleSaveColumn = async (column: KanbanColumn) => {
        if(!user) return;
        const isNew = !column.id;
        const dataToUpsert = mapColumnToDb({ ...column, userId: user.id, position: isNew ? columns.length : column.position });
        const { data, error } = await supabase.from('columns').upsert(dataToUpsert).select();
        
        if (error) {
            showToast(`Errore: ${error.message}`, 'error');
        } else if(data) {
            const savedColumn = mapColumnFromDb(data[0]);
            if(isNew) {
                setColumns(prev => [...prev, savedColumn]);
            } else {
                setColumns(prev => prev.map(c => c.id === savedColumn.id ? savedColumn : c));
            }
            showToast(isNew ? 'Colonna creata!' : 'Colonna aggiornata!', 'success');
        }
    };

    const handleSaveColumnOrder = async (reorderedColumns: KanbanColumn[]) => {
        if (!user) return;
        
        const updates = reorderedColumns.map((col, index) => 
            mapColumnToDb({ ...col, position: index })
        );
        
        const { error } = await supabase.from('columns').upsert(updates);
        
        if (error) {
            showToast(`Errore nel salvare l'ordine: ${error.message}`, 'error');
        } else {
            setColumns(reorderedColumns.map((c, i) => ({ ...c, position: i })));
            showToast('Ordine delle colonne salvato!', 'success');
        }
    };
    
    const handleDeleteColumn = async (columnId: string, targetColumnId: string) => {
        const leadsInColumn = leads.filter(l => l.statusId === columnId).map(l => l.id);
        if (leadsInColumn.length > 0) {
            const { error: updateError } = await supabase.from('leads').update({ status_id: targetColumnId }).in('id', leadsInColumn);
            if(updateError) {
                const message = `Errore spostamento lead: ${updateError.message}`;
                showToast(message, 'error');
                throw new Error(message);
            }
            setLeads(prev => prev.map(l => leadsInColumn.includes(l.id) ? {...l, statusId: targetColumnId} : l));
        }
        
        const { error: deleteError } = await supabase.from('columns').delete().eq('id', columnId);
        if(deleteError) {
             const message = `Errore eliminazione colonna: ${deleteError.message}`;
             showToast(message, 'error');
             throw new Error(message);
        } else {
            setColumns(prev => prev.filter(c => c.id !== columnId));
            showToast('Colonna eliminata.', 'success');
        }
    };

    // Template Handlers
    const handleSaveEmailTemplate = async (template: Partial<EmailTemplate>, filesToUpload: File[], attachmentsToDelete: Attachment[]) => {
       if(!user) return;
       const isNew = !template.id;

       if (attachmentsToDelete.length > 0) {
           const pathsToDelete = attachmentsToDelete.map(att => `${user.id}/${att.name}`);
           const { error: deleteError } = await supabase.storage.from('email_attachments').remove(pathsToDelete);
           if (deleteError) {
               showToast(`Errore eliminazione allegati: ${deleteError.message}`, 'error');
               return;
           }
       }
       
       const uploadedAttachments: Attachment[] = [];
       for (const file of filesToUpload) {
           const filePath = `${user.id}/${file.name}`;
           const { error: uploadError } = await supabase.storage.from('email_attachments').upload(filePath, file);
           if (uploadError) {
               showToast(`Errore caricamento ${file.name}: ${uploadError.message}`, 'error');
               continue;
           }
            const { data: { publicUrl } } = supabase.storage.from('email_attachments').getPublicUrl(filePath);
            uploadedAttachments.push({ name: file.name, url: publicUrl, size: file.size, type: file.type });
       }
       
       const finalAttachments = [
           ...(template.attachments || []).filter(att => !attachmentsToDelete.some(del => del.url === att.url)),
           ...uploadedAttachments
       ];
       
       const templateData = { ...template, userId: user.id, attachments: finalAttachments };
       const dbData = mapEmailTemplateToDb(templateData);

       const { data, error } = await supabase.from('email_templates').upsert(dbData).select();

       if (error) {
           showToast(`Errore salvataggio template: ${error.message}`, 'error');
       } else if (data) {
           const savedTemplate = mapEmailTemplateFromDb(data[0]);
           if (isNew) {
               setEmailTemplates(prev => [...prev, savedTemplate]);
           } else {
               setEmailTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t));
           }
           showToast(isNew ? 'Template creato!' : 'Template aggiornato!', 'success');
       }
    };

    const handleDeleteEmailTemplate = async (id: string) => {
        const templateToDelete = emailTemplates.find(t => t.id === id);
        if (templateToDelete?.attachments && templateToDelete.attachments.length > 0 && user) {
            const pathsToDelete = templateToDelete.attachments.map(att => `${user.id}/${att.name}`);
            const { error: storageError } = await supabase.storage.from('email_attachments').remove(pathsToDelete);
            if (storageError) {
                const message = `Errore eliminazione allegati: ${storageError.message}`;
                showToast(message, 'error');
                throw new Error(message);
            }
        }

        const { error } = await supabase.from('email_templates').delete().eq('id', id);
        if (error) {
            const message = `Errore eliminazione template: ${error.message}`;
            showToast(message, 'error');
            throw new Error(message);
        } else {
            setEmailTemplates(prev => prev.filter(t => t.id !== id));
            showToast('Template eliminato.', 'success');
        }
    };

    const handleSaveWhatsAppTemplate = async (template: Partial<WhatsAppTemplate>) => {
        if (!user) return;
        const isNew = !template.id;
        const dataToUpsert = mapWhatsAppTemplateToDb({ ...template, userId: user.id });
        const { data, error } = await supabase.from('whatsapp_templates').upsert(dataToUpsert).select();
        
        if (error) {
            showToast(`Errore: ${error.message}`, 'error');
        } else if(data) {
            const savedTemplate = mapWhatsAppTemplateFromDb(data[0]);
            if(isNew) {
                setWhatsAppTemplates(prev => [...prev, savedTemplate]);
            } else {
                setWhatsAppTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t));
            }
             showToast(isNew ? 'Template creato!' : 'Template aggiornato!', 'success');
        }
    };
    
    const handleDeleteWhatsAppTemplate = async (id: string) => {
        const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
        if (error) {
            const message = `Errore eliminazione template: ${error.message}`;
            showToast(message, 'error');
            throw new Error(message);
        } else {
            setWhatsAppTemplates(prev => prev.filter(t => t.id !== id));
            showToast('Template eliminato.', 'success');
        }
    };

    // Action Handlers
    const handleEmailAction = () => {
        if (selectedLeadIds.size === 1) {
            const leadToEmail = leads.find(l => l.id === Array.from(selectedLeadIds)[0]);
            if (leadToEmail) {
                setEditingLead(leadToEmail);
                setIsSingleEmailOpen(true);
            }
        } else if (selectedLeadIds.size > 1) {
            setIsBulkEmailOpen(true);
        }
    };
    
    const addInteractionToLead = async (leadId: string, type: InteractionType, description: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        const newInteraction = { id: `int-${Date.now()}`, date: new Date(), type, description };
        const updatedInteractions = [newInteraction, ...(lead.interactions || [])];
        
        const { data, error } = await supabase
            .from('leads')
            .update({ interactions: updatedInteractions })
            .eq('id', leadId)
            .select();
        
        if (error) {
            showToast(`Errore nell'aggiungere interazione: ${error.message}`, 'error');
        } else if (data) {
            setLeads(prev => prev.map(l => l.id === leadId ? mapLeadFromDb(data[0]) : l));
        }
    };

    const handleSendSingleEmail = async (lead: Lead, subject: string, body: string, attachments: Attachment[]) => {
        const { error } = await supabase.functions.invoke('send-email', {
            body: { to: lead.email, subject, body, attachments },
        });

        if (error) {
            showToast(`Errore invio email: ${error.message}`, 'error');
            addNotification(`Fallito l'invio dell'email a ${lead.name}`, 'error');
            return false;
        } else {
            showToast(`Email inviata a ${lead.name}!`, 'success');
            const attachmentText = attachments.length > 0 ? `\nAllegati: ${attachments.map(a => a.name).join(', ')}` : '';
            addInteractionToLead(lead.id, InteractionType.EMAIL, `Oggetto: ${subject}${attachmentText}`);
            return true;
        }
    };

    const handleSendBulkEmail = async (selectedLeads: Lead[], subject: string, body: string, attachments: Attachment[]) => {
        let successCount = 0;
        for (const lead of selectedLeads) {
            const placeholdersReplacedBody = body
                .replace(/{{nome}}/g, lead.name)
                .replace(/{{email}}/g, lead.email)
                .replace(/{{telefono}}/g, lead.phone)
                .replace(/{{settore}}/g, lead.sector)
                .replace(/{{località}}/g, lead.location);
            
            const { error } = await supabase.functions.invoke('send-email', {
                body: { to: lead.email, subject, body: placeholdersReplacedBody, attachments },
            });

            if (!error) {
                successCount++;
                const attachmentText = attachments.length > 0 ? `\nAllegati: ${attachments.map(a => a.name).join(', ')}` : '';
                addInteractionToLead(lead.id, InteractionType.EMAIL, `(Invio di massa) Oggetto: ${subject}${attachmentText}`);
            }
        }
        showToast(`${successCount} su ${selectedLeads.length} email inviate con successo.`, successCount === selectedLeads.length ? 'success' : 'info');
        if (successCount < selectedLeads.length) {
            addNotification(`Invio di massa completato con ${selectedLeads.length - successCount} errori.`, 'error');
        }
        return true;
    };


    const handleWhatsAppAction = () => {
        if (selectedLeadIds.size !== 1) return;
        const leadToMessage = leads.find(l => l.id === Array.from(selectedLeadIds)[0]);
        if (leadToMessage) {
            setEditingLead(leadToMessage);
            setIsWhatsAppComposerOpen(true);
        }
    };

    const handleImport = async (importedLeads: Omit<Lead, 'userId' | 'id' | 'createdAt' | 'interactions' >[]) => {
        if(!user) return;
        const leadsToInsert = importedLeads.map(l => ({...mapLeadToDb(l as Partial<Lead>), user_id: user.id, interactions: []}));
        const {data, error} = await supabase.from('leads').insert(leadsToInsert).select();
        if (error) {
            showToast(`Errore import: ${error.message}`, 'error');
        } else if(data) {
            setLeads(prev => [...prev, ...data.map(mapLeadFromDb)]);
            showToast(`${data.length} lead importati con successo!`, 'success');
        }
    };
    
    // Notifications Handlers
    const handleMarkAsRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
        if(!error) {
            setNotifications(n => n.map(notif => notif.id === id ? {...notif, read: true} : notif));
        }
    };

    const handleClearAllNotifications = async () => {
         if(!user) return;
         const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
         if(!error) {
             setNotifications([]);
         }
    };

    const renderView = () => {
        switch (activeView) {
            case 'emailTemplates':
                return <EmailTemplateManager templates={emailTemplates} onSave={handleSaveEmailTemplate} onDelete={handleDeleteEmailTemplate} />;
            case 'whatsappTemplates':
                return <WhatsAppTemplateManager templates={whatsAppTemplates} onSave={handleSaveWhatsAppTemplate} onDelete={handleDeleteWhatsAppTemplate} />;
            case 'settings':
                return <SettingsView />;
            case 'dashboard':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <Stats leads={leads} columns={columns} />
                            <div className="lg:col-span-2">
                                <LeadGenerator
                                    existingLeads={leads.map(l => ({ name: l.name, location: l.location }))}
                                    onLeadsGenerated={handleLeadsGenerated}
                                    onGenerationStart={handleGenerationStart}
                                    onGenerationEnd={(success, message) => {
                                        setIsGeneratingLeads(false);
                                        if (message) showToast(message, success ? 'success' : 'error');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4 mb-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <FilterControls filters={filters} setFilters={setFilters} columns={columns} />
                            </div>
                        </div>

                        <LeadList
                            leads={filteredLeads}
                            columns={columns}
                            isSelectionMode={isSelectionMode}
                            selectedLeadIds={selectedLeadIds}
                            onStatusChange={handleUpdateStatus}
                            onToggleSelectionMode={toggleSelectionMode}
                            onSelectLead={handleSelectLead}
                            onSelectAll={handleSelectAll}
                            onAddLead={() => openLeadForm(null)}
                        />
                    </>
                );
        }
    };
    
    if (loading) {
         return <div className="flex-grow flex items-center justify-center"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i></div>;
    }

    return (
        <div className="flex bg-background">
            <Sidebar 
                activeView={activeView} 
                onNavigate={setActiveView}
                onManageColumns={() => setIsColumnManagerOpen(true)}
                leads={filteredLeads}
                columns={columns}
                onImport={handleImport}
                onImportError={(msg) => showToast(msg, 'error')}
            />
            <main className="flex-1 flex flex-col min-w-0">
                <Header 
                    unreadCount={notifications.filter(n => !n.read).length}
                    onNotificationsClick={() => setIsNotificationsOpen(true)}
                    onNavigateToSettings={() => setActiveView('settings')}
                />
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {isGeneratingLeads && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="text-center p-6 bg-card rounded-lg shadow-xl">
                                <i className="fas fa-spinner fa-spin text-3xl text-primary mb-3"></i>
                                <p className="font-semibold">{loadingMessage}</p>
                            </div>
                        </div>
                    )}
                    {renderView()}
                </div>
                <BulkActionBar
                    selectedCount={selectedLeadIds.size}
                    columns={columns}
                    onDelete={handleDeleteSelectedLeads}
                    onUpdateStatus={handleBulkUpdateStatus}
                    onEdit={handleEditSelectedLead}
                    onEmailAction={handleEmailAction}
                    onWhatsApp={handleWhatsAppAction}
                    onDeselectAll={() => setSelectedLeadIds(new Set())}
                />
            </main>

            {/* Modals */}
            <LeadForm
                isOpen={isLeadModalOpen}
                lead={editingLead}
                columns={columns}
                onSave={handleSaveLead}
                onClose={() => setIsLeadModalOpen(false)}
            />
            
            <ColumnManagerModal
                isOpen={isColumnManagerOpen}
                onClose={() => setIsColumnManagerOpen(false)}
                columns={columns}
                leads={leads}
                onSave={handleSaveColumn}
                onDelete={handleDeleteColumn}
                onSaveOrder={handleSaveColumnOrder}
            />

            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAllNotifications}
            />
            
            <BulkEmailComposerModal
                isOpen={isBulkEmailOpen}
                onClose={() => setIsBulkEmailOpen(false)}
                leads={leads.filter(l => selectedLeadIds.has(l.id))}
                templates={emailTemplates}
                onSend={async (subject, body, attachments) => {
                    const success = await handleSendBulkEmail(leads.filter(l => selectedLeadIds.has(l.id)), subject, body, attachments);
                    if(success) {
                        setIsBulkEmailOpen(false);
                        setSelectedLeadIds(new Set());
                        setIsSelectionMode(false);
                    }
                    return success;
                }}
                showToast={showToast}
            />
            
            <EmailComposerModal
                isOpen={isSingleEmailOpen}
                onClose={() => setIsSingleEmailOpen(false)}
                lead={editingLead as Lead}
                templates={emailTemplates}
                onSend={async (subject, body, attachments) => {
                    const success = await handleSendSingleEmail(editingLead as Lead, subject, body, attachments);
                    if(success) {
                        setIsSingleEmailOpen(false);
                        setEditingLead(null);
                        setSelectedLeadIds(new Set());
                        setIsSelectionMode(false);
                    }
                    return success;
                }}
                showToast={showToast}
            />

            <WhatsAppComposerModal 
                isOpen={isWhatsAppComposerOpen}
                onClose={() => setIsWhatsAppComposerOpen(false)}
                lead={editingLead as Lead}
                templates={whatsAppTemplates}
                onSend={(body) => {
                    const lead = editingLead as Lead;
                    if (!lead || !lead.phone) {
                        showToast(`Nessun numero di telefono per ${lead?.name}.`, 'error');
                        return;
                    }

                    const phoneNumbers = lead.phone.split(/[,;]/).map(p => p.trim()).filter(Boolean);
                    if (phoneNumbers.length === 0) {
                        showToast(`Nessun numero di telefono valido per ${lead.name}.`, 'error');
                        return;
                    }

                    // Prioritize mobile numbers (Italian mobile numbers usually start with 3)
                    let targetPhone = phoneNumbers.find(p => p.replace(/[^+\d]/g, '').startsWith('3'));

                    // Fallback to the first number if no mobile is found
                    if (!targetPhone) {
                        targetPhone = phoneNumbers[0];
                    }
                    
                    // Clean the number for the URL, keeping digits and '+'
                    const cleanPhone = targetPhone.replace(/[^+\d]/g, '');
                    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`;
                    window.open(url, '_blank');
                    
                    addInteractionToLead(lead.id, InteractionType.NOTE, `Messaggio WhatsApp inviato (tramite app esterna) al numero ${targetPhone}:\n${body}`);
                    showToast(`Apertura WhatsApp per ${lead.name}...`, 'success');
                    setIsWhatsAppComposerOpen(false);
                    setEditingLead(null);
                }}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Dashboard;