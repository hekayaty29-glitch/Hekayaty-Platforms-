import { createClient } from '@supabase/supabase-js';

// Project URL and anon key must be supplied via environment variables.
// Vite automatically exposes env vars prefixed with VITE_ at build/runtime.
// Make sure to add these two variables (without quotes) to `client/.env`:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON=YOUR_PUBLIC_ANON_KEY
// Do NOT commit your service role key.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env variables. Supabase client will not work properly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
});

export type SupabaseClient = typeof supabase;
