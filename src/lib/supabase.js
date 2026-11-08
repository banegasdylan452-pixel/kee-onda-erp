import { createClient } from '@supabase/supabase-js';

// Fallback to project credentials so Vercel deploy works immediately without manual env setup
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mshctpwwiglyqnmzzuop.supabase.co';
// Clean any trailing slashes or /rest/v1
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaGN0cHd3aWdseXFubXp6dW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwODA2MDYsImV4cCI6MjEwOTY1NjYwNn0.foq6s8KMPWpw-4dxeVZGbWx5YDuvod0eV5HGdjqb8SU';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

