import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nlkbrwcbtfmsffugvibt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn(
        '⚠️ VITE_SUPABASE_ANON_KEY is not set. Add it to your .env file.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
