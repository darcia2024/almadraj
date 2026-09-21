import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://umyvzoiegostmezdrvdo.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteXZ6b2llZ29zdG1lemRydmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NTYyNTYsImV4cCI6MjEwNTUzMjI1Nn0.kIxpSQyFU5lkyVpMTx_OBscV0PrkjuDyPLhBuR8PvLk';

export const supabaseConfigured = Boolean(url && key);
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase LMS belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.');
  return supabase;
};
