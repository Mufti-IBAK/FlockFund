const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ylsxabfkysqpkuichvts.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsc3hhYmZreXNxcGt1aWNodnRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcyNTU5NywiZXhwIjoyMDg3MzAxNTk3fQ.43QkxI3YfESNLznOOm7KohLElqcSAtioqUPmK0k4qUw'
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('sales_reports')
    .insert({
      flock_id: '00000000-0000-0000-0000-000000000000', // dummy
      amount_birds: 0,
      weight_kg: 0,
      customer_name: 'test',
      product_type: 'test',
      is_manure: false,
      total_revenue: 0,
      sale_timestamp: new Date().toISOString(),
      sales_manager_id: '00000000-0000-0000-0000-000000000000',
      status: 'pending'
    })
    .select();

  console.log("Error:", error);
}

checkColumns();
