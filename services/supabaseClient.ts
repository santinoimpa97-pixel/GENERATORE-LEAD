import { createClient } from '@supabase/supabase-js';

// Le variabili d'ambiente devono essere impostate nel file .env o nella configurazione di Vercel/Netlify.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseConnectionError = 
  (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('INSERISCI_QUI'))
    ? "Le variabili d'ambiente SUPABASE_URL e SUPABASE_ANON_KEY sono obbligatorie."
    : null;

// Se c'è un errore di configurazione, esportiamo un oggetto vuoto castato per evitare errori di runtime immediati,
// ma l'errore verrà catturato in App.tsx prima che questo client venga usato.
export const supabase = supabaseConnectionError
  ? {} as any 
  : createClient(supabaseUrl!, supabaseAnonKey!);
