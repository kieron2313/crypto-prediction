import { createClient } from '@supabase/supabase-js';

// INSTRUCTIONS:
// 1. Create a project at https://supabase.com
// 2. Replace the empty strings below with your API URL and Anon Key
const SUPABASE_URL = ''; 
const SUPABASE_ANON_KEY = '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => {
    return !!supabase;
};