import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/payments/verify?transaction_id=xxx&tx_ref=xxx
// Called by the callback page after redirect from Flutterwave
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transaction_id'); // Flutterwave
    const txRef = searchParams.get('tx_ref'); // Flutterwave
    const reference = searchParams.get('reference'); // Paystack
    const status = searchParams.get('status');

    if (!transactionId && !txRef && !reference) {
      return NextResponse.json({ error: 'Missing transaction identifier' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If status from URL is 'cancelled', mark as failed
    if (status === 'cancelled') {
      const searchRef = txRef || reference;
      if (searchRef) {
        await supabase
          .from('investments')
          .update({ status: 'failed' })
          .or(`payment_reference.eq.${searchRef},payment_transaction_id.eq.${searchRef}`)
          .eq('status', 'pending');
      }

      return NextResponse.json({
        success: false,
        status: 'cancelled',
        message: 'Payment was cancelled by the user',
      });
    }

    // ─── GATEWAY SPECIFIC VERIFICATION ───
    let isSuccessful = false;
    let finalAmount = 0;
    let finalCurrency = 'NGN';
    let finalReference = txRef || reference || '';
    let finalTransactionId = transactionId || reference || '';
    let gatewayUsed = '';
    let gatewayResponse: any = {};

    if (transactionId) {
      // Flutterwave Verification
      gatewayUsed = 'flutterwave';
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        }
      );
      gatewayResponse = await verifyRes.json();
      isSuccessful = gatewayResponse?.data?.status === 'successful';
      finalAmount = gatewayResponse?.data?.amount || 0;
      finalCurrency = gatewayResponse?.data?.currency || 'NGN';
      finalReference = gatewayResponse?.data?.tx_ref || finalReference;
    } else if (reference) {
      // Paystack Verification
      gatewayUsed = 'paystack';
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        }
      );
      gatewayResponse = await verifyRes.json();
      isSuccessful = gatewayResponse?.status && gatewayResponse?.data?.status === 'success';
      finalAmount = (gatewayResponse?.data?.amount || 0) / 100; // Paystack is in kobo
      finalCurrency = gatewayResponse?.data?.currency || 'NGN';
      finalReference = gatewayResponse?.data?.reference || finalReference;
    }

    if (isSuccessful) {
      // Activate the investment
      const { data: investment, error: invError } = await supabase
        .from('investments')
        .update({ 
          status: 'active',
          payment_transaction_id: finalTransactionId,
          payment_gateway: gatewayUsed
        })
        .or(`payment_reference.eq.${finalReference},payment_transaction_id.eq.${finalReference}`)
        .eq('status', 'pending')
        .select()
        .single();

      if (invError) {
        console.error('Failed to update investment status:', invError);
        // Still try to find it if it was already updated
        const { data: existing } = await supabase
          .from('investments')
          .select('*')
          .or(`payment_reference.eq.${finalReference},payment_transaction_id.eq.${finalReference}`)
          .single();
          
        if (!existing) {
            return NextResponse.json({ success: false, message: 'Investment not found' });
        }
      }

      if (investment) {
        // Record the transaction
        await supabase.from('transactions').insert({
          investor_id: investment.investor_id,
          investment_id: investment.id,
          type: 'investment',
          amount: finalAmount,
          status: 'completed',
          gateway: gatewayUsed,
          reference: finalReference,
          gateway_response: gatewayResponse.data || {}
        });

        // Award badge logic
        const { data: badge } = await supabase
          .from('badges')
          .select('id')
          .or('name.eq.Early Bird,name.eq.First Investment')
          .limit(1)
          .single();

        if (badge) {
          const { data: existingBadge } = await supabase
            .from('investor_badges')
            .select('id')
            .eq('investor_id', investment.investor_id)
            .eq('badge_id', badge.id)
            .single();

          if (!existingBadge) {
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
        amount: finalAmount,
        currency: finalCurrency,
      });
    } else {
      // Failed or pending
      const txStatus = gatewayResponse?.data?.status || 'failed';
      if (finalReference) {
        await supabase
          .from('investments')
          .update({ status: txStatus === 'pending' ? 'pending' : 'failed' })
          .or(`payment_reference.eq.${finalReference},payment_transaction_id.eq.${finalReference}`);
      }

      return NextResponse.json({
        success: false,
        status: txStatus,
        message: `Payment ${txStatus}`,
      });
    }

    return NextResponse.json({ error: 'Could not verify payment' }, { status: 400 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
