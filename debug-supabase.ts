import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('FAIL: Supabase credentials are missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to:', supabaseUrl);
  
  // Test 1: Simple health check
  const { data: health, error: healthError } = await supabase.from('users').select('count', { count: 'exact', head: true });
  
  if (healthError) {
    if (healthError.message.includes('relation "public.users" does not exist')) {
        console.log('FAIL: "users" table is missing.');
    } else {
        console.log('FAIL: Auth check failed:', healthError.message);
    }
  } else {
    console.log('SUCCESS: "users" table is accessible.');
  }

  // Test 2: Check if Auth is alive
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.log('FAIL: Auth session check failed:', sessionError.message);
  } else {
    console.log('SUCCESS: Auth service is reachable.');
  }
}

testConnection();
