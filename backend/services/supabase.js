// backend/services/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
if (!SERVICE_ROLE_KEY) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
if (!ANON_KEY) throw new Error("Missing env: SUPABASE_ANON_KEY");

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});
