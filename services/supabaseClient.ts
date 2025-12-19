import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables
const getEnvVar = (key: string): string | undefined => {
    let val: string | undefined = undefined;

    // 1. Try custom global object (Most reliable in this environment)
    // @ts-ignore
    if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
        // @ts-ignore
        val = window.__APP_CONFIG__[key] || window.__APP_CONFIG__[`VITE_${key}`];
    }

    if (val && !val.includes('INSERISCI_QUI')) return val;

    // 2. Try window.process
    try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.process && window.process.env) {
            // @ts-ignore
            val = window.process.env[key] || window.process.env[`VITE_${key}`];
        }
    } catch (e) {}

    if (val && !val.includes('INSERISCI_QUI')) return val;

    // 3. Try import.meta.env
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            val = import.meta.env[key] || import.meta.env[`VITE_${key}`];
        }
    } catch (e) {}

    if (val && val.includes('INSERISCI_QUI')) return undefined;
    
    return val;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

const hasUrl = !!supabaseUrl && supabaseUrl.startsWith('http');
const hasKey = !!supabaseAnonKey && supabaseAnonKey.length > 20;

if (!hasUrl || !hasKey) {
    // @ts-ignore
    const configObj = typeof window !== 'undefined' ? window.__APP_CONFIG__ : {};
    let configStr = "{}";
    try {
        configStr = JSON.stringify(configObj, null, 2);
    } catch (e) {
        configStr = "[Error serializing config]";
    }
    
    // Concatenazione esplicita per evitare [object Object] su alcune console
    console.error("[Supabase Init] ERRORE CRITICO: Credenziali mancanti.\n" +
        "Has URL: " + hasUrl + "\n" +
        "Has Key: " + hasKey + "\n" +
        "Config Dump:\n" + configStr
    );
} else {
    console.log(`[Supabase Init] OK. URL: ${supabaseUrl?.substring(0, 15)}...`);
}

export const supabaseConnectionError = (!hasUrl || !hasKey) 
    ? `Configurazione database incompleta. Controlla la console del browser per i dettagli.` 
    : null;

const validUrl = hasUrl ? supabaseUrl! : 'https://placeholder.supabase.co';
const validKey = hasKey ? supabaseAnonKey! : 'placeholder';

// @ts-ignore
export const supabase = createClient(validUrl, validKey) as any;