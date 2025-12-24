
import React from 'react';
import ImportButton from './ImportButton';
import ExportButton from './ExportButton';
import { Lead, KanbanColumn } from '../types';

type View = 'dashboard' | 'emailTemplates' | 'whatsappTemplates' | 'settings';

interface SidebarProps {
    activeView: View;
    onNavigate: (view: View) => void;
    onManageColumns: () => void;
    leads: Lead[];
    columns: KanbanColumn[];
    onImport: (leads: Omit<Lead, 'userId'>[]) => void;
    onImportError: (message: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeView, 
    onNavigate, 
    onManageColumns,
    leads,
    columns,
    onImport,
    onImportError,
}) => {
    const handleReconfigureKey = async () => {
        if (window.aistudio && window.aistudio.openSelectKey) {
            await window.aistudio.openSelectKey();
            window.location.reload();
        } else {
            alert("Usa le variabili d'ambiente di Vercel (VITE_API_KEY) per configurare la chiave.");
        }
    };

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col p-4 space-y-4 sticky top-0 h-screen">
            <div className="flex-grow">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Menu</div>

                <nav className="space-y-2 mt-2">
                    <NavItem 
                        icon="fa-th-large" 
                        label="Dashboard" 
                        isActive={activeView === 'dashboard'} 
                        onClick={() => onNavigate('dashboard')} 
                    />
                     <NavItem 
                        icon="fa-envelope" 
                        label="Template Email" 
                        isActive={activeView === 'emailTemplates'} 
                        onClick={() => onNavigate('emailTemplates')} 
                    />
                     <NavItem 
                        icon="fab fa-whatsapp" 
                        label="Template WhatsApp" 
                        isActive={activeView === 'whatsappTemplates'} 
                        onClick={() => onNavigate('whatsappTemplates')}
                    />
                </nav>

                <div className="mt-6 pt-4 border-t border-border">
                     <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Strumenti</h3>
                     <NavItem 
                        icon="fa-columns" 
                        label="Gestione Colonne" 
                        isActive={false} 
                        onClick={onManageColumns} 
                    />
                    <button 
                        onClick={handleReconfigureKey}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mt-1"
                    >
                        <i className="fas fa-key w-5 text-center"></i>
                        <span>Configura API</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <ImportButton columns={columns} onImport={onImport} onImportError={onImportError} />
                <ExportButton leads={leads} columns={columns} />
            </div>
        </aside>
    );
};

interface NavItemProps {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    tooltip?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, tooltip }) => {
    return (
        <button
            onClick={onClick}
            title={tooltip || label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
        >
            <i className={`fas ${icon} w-5 text-center`}></i>
            <span>{label}</span>
        </button>
    );
}

export default Sidebar;
