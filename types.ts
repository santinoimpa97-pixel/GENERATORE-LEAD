// types.ts

export interface Source {
  uri?: string;
  title?: string;
}

export enum Sector {
  RESTAURANTS = 'Ristorazione',
  LEGAL = 'Legale',
  HEALTH = 'Salute e Benessere',
  TECH = 'Tecnologia',
  RETAIL = 'Vendita al Dettaglio',
  REAL_ESTATE = 'Immobiliare',
  FINANCE = 'Finanza',
  OTHER = 'Altro',
}

export enum InteractionType {
  CALL = 'Chiamata',
  EMAIL = 'Email Inviata',
  MEETING = 'Incontro',
  NOTE = 'Nota',
}

export interface Interaction {
  id: string;
  date: Date;
  type: InteractionType;
  description: string;
}

export interface Lead {
  id: string;
  userId: string;
  name: string;
  sector: Sector;
  location: string;
  email: string;
  phone: string;
  website?: string;
  description: string;
  statusId: string;
  createdAt: Date;
  interactions: Interaction[];
  sources?: Source[];
}

export interface KanbanColumn {
  id: string;
  userId: string;
  title: string;
  icon: string;
  color: string;
  darkColor: string;
  textColor: string;
  position: number;
}

export interface Filters {
  searchTerm: string;
  statusId: string;
  sector: string;
  location: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
}

export interface Attachment {
    name: string;
    url: string;
    size: number;
    type: string;
}

export interface EmailTemplate {
    id: string;
    userId: string;
    name: string;
    subject: string;
    body: string;
    attachments?: Attachment[];
}

export interface WhatsAppTemplate {
    id: string;
    userId: string;
    name: string;
    body: string;
}