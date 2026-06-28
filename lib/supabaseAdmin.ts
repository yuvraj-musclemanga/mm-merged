import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase Admin credentials are missing. Check your .env.local file. Payments backend will fail without them.');
}

// ⚠️ IMPORTANT: Only use this on the backend (Route Handlers, Server Actions).
// NEVER expose this to the client as it bypasses all Row Level Security.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
