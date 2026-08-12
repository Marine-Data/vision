import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// On dit simplement à l'application : "C'est bon, les clés sont là, on peut démarrer"
export const supabaseConfigured = true;
