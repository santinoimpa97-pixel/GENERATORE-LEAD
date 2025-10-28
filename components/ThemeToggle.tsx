import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <i className="fas fa-moon text-lg"></i>
            ) : (
                <i className="fas fa-sun text-lg"></i>
            )}
        </button>
    );
};

export default ThemeToggle;
