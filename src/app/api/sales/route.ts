import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const flockId = searchParams.get('flockId');

  let query = supabase.from('sales_reports').select('*, profiles(full_name)');
  if (flockId) query = query.eq('flock_id', flockId);

  const { data, error } = await query.order('sale_timestamp', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('sales_reports').insert({
    ...body,
    sales_manager_id: user.id,
    sale_timestamp: new Date().toISOString(),
    accountant_status: 'pending',
    keeper_status: 'pending'
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification for Admin & Accountant
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const name = profile?.full_name || 'A Sales Manager';

  const { data: recipients } = await supabase
    .from('profiles')
    .select('id, role')
    .in('role', ['admin', 'accountant', 'keeper']);

  if (recipients) {
    const notifs = recipients.map(r => ({
      user_id: r.id,
      title: body.is_manure ? '💩 Manure Sale Reported' : '🍗 Bird Sale Reported',
      message: `${name} recorded a sale of ${body.amount_birds || 0} birds/items for ₦${body.total_revenue?.toLocaleString()}. Needs review.`,
      type: 'system',
      redirect_url: r.role === 'keeper' ? '/keeper/sales' : (r.role === 'accountant' ? '/accountant/sales' : '/admin/sales')
    }));
    await supabase.from('notifications').insert(notifs);
  }

  return NextResponse.json(data);
}
