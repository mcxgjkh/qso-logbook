// src/lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient = null;

export const createClient = () => {
    if (!supabaseClient) {
        supabaseClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    }
    return supabaseClient;
};