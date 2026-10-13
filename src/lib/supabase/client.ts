import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://wlmspxenhqbewihwupzo.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_MfIbawz8UxaIprQNbLl9uQ_fJaX6Qo3';

  return createBrowserClient(supabaseUrl, supabaseKey);
}

