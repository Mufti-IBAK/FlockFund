import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('investments')
    .select('count')
    .eq('status', 'pending');
  console.log('Pending Investments:', data?.[0]?.count || 0);

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
  if (txError) {
    console.error('Transactions table error (might not exist):', txError.message);
  } else {
    console.log('Transactions table exists.');
  }

  const { data: invReal, error: invRealError } = await supabase
    .rpc('get_realtime_status', { table_name: 'investments' });
  // Note: RPC may not exist, but let's try a simple query to see if we can read the meta
  console.log('Researching table status...');
}

check();
