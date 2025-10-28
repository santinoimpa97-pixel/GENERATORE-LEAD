import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    unreadCount: number;
    onNotificationsClick: () => void;
    onNavigateToSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ unreadCount, onNotificationsClick, onNavigateToSettings }) => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const userName = user?.user_metadata?.name || user?.email;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSettingsClick = () => {
        onNavigateToSettings();
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-card border-b border-border p-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <i className="fas fa-bullseye-pointer text-3xl text-primary"></i>
                <h1 className="text-2xl font-bold text-card-foreground">Lead CRM</h1>
            </div>
            <div className="flex items-center gap-2">
                 <ThemeToggle />
                 <button 
                    onClick={onNotificationsClick}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Toggle notifications"
                 >
                    <i className="fas fa-bell text-lg"></i>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent">
                        <span className="font-semibold text-sm">{userName}</span>
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {userName?.charAt(0).toUpperCase()}
                        </div>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                            <button onClick={handleSettingsClick} className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-accent">
                                Impostazioni
                            </button>
                            <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;