import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabaseConfig.js'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
