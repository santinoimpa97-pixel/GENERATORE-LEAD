
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAZIONE MANUALE
 * Le chiavi fornite sono state inserite direttamente nelle variabili.
 */
const HARDCODED_URL = 'https://eggbhehdbehfngqzxyzl.supabase.co'; 
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ2JoZWhkYmVoZm5ncXp4eXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzk2NTYsImV4cCI6MjA3NTM1NTY1Nn0.IpDozjWedurgoBeMX5Bi0dX4KEqDyQlN1PsNjyNXuMQ';

const getEnv = (name: string): string => {
  try {
    const win = window as any;
    // @ts-ignore
    const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : null;
    if (viteEnv) {
      if (viteEnv[`VITE_${name}`]) return viteEnv[`VITE_${name}`];
      if (viteEnv[name]) return viteEnv[name];
    }
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[`VITE_${name}`]) return process.env[`VITE_${name}`]!;
      if (process.env[name]) return process.env[name]!;
    }
    if (win.process?.env?.[`VITE_${name}`]) return win.process.env[`VITE_${name}`];
    if (win.process?.env?.[name]) return win.process.env[name];
  } catch (e) { }
  return "";
};

const url = HARDCODED_URL || getEnv('SUPABASE_URL');
const key = HARDCODED_KEY || getEnv('SUPABASE_ANON_KEY');

const isValid = !!url && url.startsWith('https://') && !!key;

if (!isValid) {
  console.error("❌ SUPABASE NON CONFIGURATO.");
} else {
  console.log("✅ Supabase configurato con successo.");
}

export const supabaseConfigInfo = {
  isValid,
  error: !isValid ? "Database non configurato correttamente." : null
};

export const supabaseConnectionError = supabaseConfigInfo.error;

let supabaseInstance: any;

if (isValid) {
    supabaseInstance = createClient(url, key);
} else {
    // Mock completo per evitare errori "is not a function" se le chiavi mancano
    supabaseInstance = {
        auth: { 
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            getSession: async () => ({ data: { session: null }, error: null }),
            signOut: async () => {},
            signInWithPassword: async () => ({ error: new Error("Supabase non configurato") }),
            signUp: async () => ({ error: new Error("Supabase non configurato") }),
            resetPasswordForEmail: async () => ({ error: new Error("Supabase non configurato") }),
            updateUser: async () => ({ error: new Error("Supabase non configurato") }),
        },
        from: () => ({ 
            select: () => ({ order: () => ({ eq: () => ({ limit: () => ({}) }) }) }),
            insert: () => ({ select: () => ({}) }),
            upsert: () => ({ select: () => ({}) }),
            update: () => ({ eq: () => ({ select: () => ({}) }) }),
            delete: () => ({ eq: () => ({}) })
        }),
        storage: {
            from: () => ({
                upload: async () => ({ error: new Error("Supabase non configurato") }),
                getPublicUrl: () => ({ data: { publicUrl: "" } }),
                remove: async () => ({ error: null }),
            })
        },
        functions: {
            invoke: async () => ({ error: new Error("Supabase non configurato") })
        }
    };
}

export const supabase = supabaseInstance;
