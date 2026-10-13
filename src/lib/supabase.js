import { createClient } from "@supabase/supabase-js";
import { visionEnv } from "../config.js";

export const SUPABASE_URL = visionEnv().url;

export const SUPABASE_ANON_KEY = visionEnv().anonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseConfigured = !!SUPABASE_ANON_KEY;
