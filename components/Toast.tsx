import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    // Update: Increased z-index to z-[100] to ensure it appears above modals (which are z-50 or z-[60/70])
    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-lg flex items-center gap-3 z-[100] animate-fade-in-up";
    const typeClasses = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
    };
    const icons = {
        success: "fas fa-check-circle",
        error: "fas fa-exclamation-circle",
        info: "fas fa-info-circle",
    }

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            <i className={icons[type]}></i>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">&times;</button>
        </div>
    );
};

export default Toast;