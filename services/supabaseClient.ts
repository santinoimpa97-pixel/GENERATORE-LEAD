
import { createClient } from '@supabase/supabase-js';

// Queste chiavi ANON sono pubbliche per design in Supabase, 
// ma usiamo process.env per coerenza e sicurezza.
const url = process.env.SUPABASE_URL || 'https://eggbhehdbehfngqzxyzl.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ2JoZWhkYmVoZm5ncXp4eXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzk2NTYsImV4cCI6MjA3NTM1NTY1Nn0.IpDozjWedurgoBeMX5Bi0dX4KEqDyQlN1PsNjyNXuMQ';

export const supabase = createClient(url, key);
export const supabaseConnectionError = null;
