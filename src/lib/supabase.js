import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// true tant que les valeurs par défaut n'ont pas été remplacées
export const supabaseConfigured =
  !SUPABASE_URL.includes('TON-PROJET') && !SUPABASE_ANON_KEY.includes('https://osqyczwawbbwjwaubtvc.supabase.co/rest/v1/');
