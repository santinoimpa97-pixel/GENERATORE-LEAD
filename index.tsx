
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');

const renderPanic = (error: any) => {
    if (!rootElement) return;
    rootElement.innerHTML = `
        <div style="padding: 2rem; font-family: system-ui; line-height: 1.5; max-width: 600px; margin: 4rem auto; background: #fff1f2; border: 1px solid #fda4af; border-radius: 1rem; color: #991b1b;">
            <h1 style="margin-top:0;">Errore Critico di Avvio</h1>
            <p>L'applicazione non è riuscita a partire. Questo accade solitamente per un problema di configurazione delle chiavi o di rete.</p>
            <pre style="background: #ffffff; padding: 1rem; border-radius: 0.5rem; font-size: 0.8rem; overflow: auto;">${error.stack || error.message || error}</pre>
            <button onclick="window.location.reload()" style="background: #e11d48; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;">Riprova</button>
        </div>
    `;
};

try {
    if (!rootElement) {
        throw new Error("Could not find root element to mount to");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ThemeProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
} catch (error) {
    console.error("Rendering failed:", error);
    renderPanic(error);
}
