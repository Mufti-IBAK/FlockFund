import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const body = await request.json();
  const { id } = await context.params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Update the fields depending on the role
  const updates: any = {};
  if (body.keeper_status !== undefined) updates.keeper_status = body.keeper_status;
  if (body.accountant_status !== undefined) updates.accountant_status = body.accountant_status;
  
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sales_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If both are confirmed, notify investors
  if (data.keeper_status === 'confirmed' && data.accountant_status === 'confirmed') {
    const { data: investors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'investor');
      
    if (investors && investors.length > 0) {
      const titleStr = data.is_manure ? '💩 Manure Sale Confirmed' : '🍗 Bird Sale Confirmed';
      const msgStr = `A sale of ${data.is_manure ? '' : data.amount_birds + ' birds for ' }₦${data.total_revenue?.toLocaleString()} has been fully verified and logged.`;
      
      const notifs = investors.map(inv => ({
        user_id: inv.id,
        title: titleStr,
        message: msgStr,
        type: 'system',
        redirect_url: '/investor/activity'
      }));
      
      await supabase.from('notifications').insert(notifs);
    }
  }

  return NextResponse.json(data);
}
