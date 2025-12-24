
import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string): string => {
  const win = window as any;
  const val = process.env[name] || 
              process.env[`VITE_${name}`] || 
              win.process?.env?.[name] || 
              win.process?.env?.[`VITE_${name}`] || 
              "";
  
  if (val) {
      console.log(`[Env] Trovata chiave ${name}: ${val.substring(0, 5)}...`);
  } else {
      console.warn(`[Env] Chiave ${name} NON trovata.`);
  }
  return val;
};

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_ANON_KEY');

const isValid = !!url && url.startsWith('https://') && !!key;

export const supabaseConfigInfo = {
  isValid,
  missingUrl: !url,
  missingKey: !key,
  error: !isValid ? "Configurazione database mancante. Verifica le chiavi su Vercel." : null
};

export const supabaseConnectionError = supabaseConfigInfo.error;

// Inizializzazione protetta: se i dati mancano, creiamo un client "dummy" per evitare crash di modulo
let supabaseInstance: any;

try {
    if (isValid) {
        supabaseInstance = createClient(url, key);
    } else {
        // Mock object per evitare errori "cannot read properties of undefined" durante il boot
        supabaseInstance = {
            auth: { 
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                getSession: async () => ({ data: { session: null }, error: null }),
                signOut: async () => {}
            },
            from: () => ({ select: () => ({ order: () => ({ eq: () => ({ limit: () => ({}) }) }) }) })
        };
    }
} catch (e) {
    console.error("Eccezione durante createClient:", e);
    supabaseInstance = {}; 
}

export const supabase = supabaseInstance;
