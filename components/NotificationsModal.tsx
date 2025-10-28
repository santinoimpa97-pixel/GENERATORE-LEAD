import React from 'react';
// Fix: Corrected import path for types.
import { Notification } from '../types';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, onMarkAsRead, onClearAll }) => {
    if (!isOpen) return null;

    const iconMap = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-triangle text-red-500',
        info: 'fas fa-info-circle text-blue-500',
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                 <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Notifiche</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow">
                    {notifications.length > 0 ? (
                        <ul className="space-y-3">
                            {notifications.map(notif => (
                                <li key={notif.id} className={`p-3 rounded-md flex items-start gap-3 ${notif.read ? 'bg-muted/30' : 'bg-muted/70'}`}>
                                    <i className={`${iconMap[notif.type]} text-xl mt-1`}></i>
                                    <p className="flex-grow text-sm text-foreground">{notif.message}</p>
                                    {!notif.read && (
                                        <button onClick={() => onMarkAsRead(notif.id)} className="text-xs text-primary hover:underline flex-shrink-0">Segna come letto</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-center text-muted-foreground py-8">Nessuna notifica.</p>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="p-4 border-t border-border">
                         <button onClick={onClearAll} className="w-full bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90 transition duration-300">
                            Pulisci tutto
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsModal;