// CONFIGURAZIONE AMBIENTE
// Usiamo un namespace custom per evitare conflitti con 'process' o 'vite'
window.__APP_CONFIG__ = {
    API_KEY: "AIzaSyADL0PbzNrxyFNcupciKV6UXkP8FDctLhg",
    VITE_SUPABASE_URL: "https://eggbhehdbehfngqzxyzl.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ2JoZWhkYmVoZm5ncXp4eXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzk2NTYsImV4cCI6MjA3NTM1NTY1Nn0.IpDozjWedurgoBeMX5Bi0dX4KEqDyQlN1PsNjyNXuMQ"
};

// Retrocompatibilità (opzionale, ma sicura)
try {
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    Object.assign(window.process.env, window.__APP_CONFIG__);
} catch (e) {
    console.warn("Impossibile assegnare a window.process (ambiente ristretto), ma __APP_CONFIG__ è attivo.");
}

console.log("%c[env.js] Configurazione caricata correttamente.", "color: green; font-weight: bold;");
