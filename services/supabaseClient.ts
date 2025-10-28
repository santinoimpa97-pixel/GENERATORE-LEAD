import { createClient } from '@supabase/supabase-js';

// Implementazione di un fallback per consentire lo sviluppo locale e la produzione.
// Vercel utilizzerà le variabili standard, mentre l'anteprima locale userà i valori segnaposto.
// L'utente deve sostituire questi segnaposto per far funzionare l'anteprima.
const supabaseUrl = process.env.SUPABASE_URL || "https://eggbhehdbehfngqzxyzl.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ2JoZWhkYmVoZm5ncXp4eXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzk2NTYsImV4cCI6MjA3NTM1NTY1Nn0.IpDozjWedurgoBeMX5Bi0dX4KEqDyQlN1PsNjyNXuMQ";

// Il controllo per le chiavi segnaposto è stato rimosso per consentire il funzionamento dell'anteprima.
// In un ambiente di produzione, è necessario impostare SUPABASE_URL e SUPABASE_ANON_KEY.
export const supabaseConnectionError = 
  (!supabaseUrl || !supabaseAnonKey)
    ? "Le variabili d'ambiente SUPABASE_URL e SUPABASE_ANON_KEY sono obbligatorie."
    : null;

// L'errore di connessione viene gestito centralmente in App.tsx.
// Questo impedisce all'app di crashare se le chiavi mancano.
export const supabase = supabaseConnectionError
  ? {} as any 
  : createClient(supabaseUrl!, supabaseAnonKey!);