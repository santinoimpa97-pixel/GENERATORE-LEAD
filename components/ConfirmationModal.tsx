import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: React.ReactNode;
    isConfirming: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
    if (!isOpen) return null;

    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex justify-center items-center p-4"
            onClick={!isConfirming ? onClose : undefined}
        >
            <div 
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-border">
                    <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
                </div>
                <div className="p-5">
                    <div className="text-muted-foreground">{message}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-b-lg flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-accent"
                        disabled={isConfirming}
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="bg-destructive text-destructive-foreground font-semibold py-2 px-4 rounded-lg hover:bg-destructive/90 disabled:opacity-50"
                        disabled={isConfirming}
                    >
                        {isConfirming ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i>Conferma...</>
                        ) : (
                            'Conferma Eliminazione'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
