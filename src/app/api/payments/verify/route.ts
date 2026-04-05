import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/payments/verify?transaction_id=xxx&tx_ref=xxx
// Called by the callback page after redirect from Flutterwave
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const status = searchParams.get('status');

    if (!transactionId && !txRef) {
      return NextResponse.json({ error: 'Missing transaction_id or tx_ref' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If status from URL is 'cancelled', mark as failed
    if (status === 'cancelled') {
      if (txRef) {
        await supabase
          .from('investments')
          .update({ status: 'failed' })
          .or(`payment_reference.eq.${txRef},payment_transaction_id.eq.${txRef}`)
          .eq('status', 'pending');
      }

      return NextResponse.json({
        success: false,
        status: 'cancelled',
        message: 'Payment was cancelled by the user',
      });
    }

    // Verify with Flutterwave
    if (transactionId) {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );
      const verifyData = await verifyRes.json();

      const txStatus = verifyData?.data?.status;
      const txTxRef = verifyData?.data?.tx_ref || txRef;

      if (txStatus === 'successful') {
        // Activate the investment
        const { data: investment, error: invError } = await supabase
          .from('investments')
          .update({ 
            status: 'active',
            payment_transaction_id: transactionId, // Update with the actual Flutterwave ID
            payment_gateway: 'flutterwave'
          })
          .or(`payment_reference.eq.${txTxRef},payment_transaction_id.eq.${txTxRef}`)
          .eq('status', 'pending')
          .select()
          .single();

        if (invError) {
          console.error('Failed to update investment status:', invError);
          // Still try to find it if it was already updated or if it's already active
          const { data: existing } = await supabase
            .from('investments')
            .select('*')
            .or(`payment_reference.eq.${txTxRef},payment_transaction_id.eq.${txTxRef}`)
            .single();
            
          if (!existing) {
             return NextResponse.json({ success: false, message: 'Investment not found' });
          }
        }

        // Award badge
        if (investment) {
          // Record the transaction
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              investor_id: investment.investor_id,
              investment_id: investment.id,
              type: 'investment',
              amount: verifyData.data.amount,
              status: 'completed',
              gateway: 'flutterwave',
              reference: txTxRef,
              gateway_response: verifyData.data || {}
            });
            
          if (txError) console.error('Failed to record transaction:', txError);

          // ... rest of badge logic
          const { data: badge } = await supabase
            .from('badges')
            .select('id')
            .or('name.eq.Early Bird,name.eq.First Investment')
            .limit(1)
            .single();

          if (badge) {
            const { data: existing } = await supabase
              .from('investor_badges')
              .select('id')
              .eq('investor_id', investment.investor_id)
              .eq('badge_id', badge.id)
              .single();

            if (!existing) {
              await supabase.from('investor_badges').insert({
                investor_id: investment.investor_id,
                badge_id: badge.id,
              });
            }
          }
        }

        return NextResponse.json({
          success: true,
          status: 'successful',
          investment_id: investment?.id,
          amount: verifyData?.data?.amount,
          currency: verifyData?.data?.currency,
        });
      } else {
        // Failed or pending from Flutterwave
        if (txTxRef) {
          await supabase
            .from('investments')
            .update({ status: txStatus === 'pending' ? 'pending' : 'failed' })
            .or(`payment_reference.eq.${txTxRef},payment_transaction_id.eq.${txTxRef}`);
        }

        return NextResponse.json({
          success: false,
          status: txStatus || 'failed',
          message: `Payment ${txStatus || 'failed'}`,
        });
      }
    }

    return NextResponse.json({ error: 'Could not verify payment' }, { status: 400 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
