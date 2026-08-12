import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Vérifie si les valeurs par défaut ont été remplacées
export const supabaseConfigured = 
    SUPABASE_URL !== 'https://osqycxwwbbwjwaubtvc.supabase.co' && 
    SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXljendhd2Jid2p3YXVidHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Nzk1MjUsImV4cCI6MjA5NzU1NTUyNX0.Lk2iuL3v_AGuXbyG5yU_-cfvnOtmYoWxiYdyCVKxXzg';
