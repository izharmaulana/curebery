import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('users').select('count');
console.log('Data:', data);
console.log('Error:', error);
