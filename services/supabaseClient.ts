
import { createClient } from '@supabase/supabase-js';

// Le chiavi Supabase Anon sono considerate pubbliche per design, 
// ma è sempre meglio leggerle dall'ambiente se possibile.
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
  } catch (e) { }
  return "";
};

const url = getEnv('SUPABASE_URL') || HARDCODED_URL;
const key = getEnv('SUPABASE_ANON_KEY') || HARDCODED_KEY;

export const supabase = createClient(url, key);
export const supabaseConnectionError = null;
