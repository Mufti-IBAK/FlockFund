import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/payments/payout
// Body: { investor_id, amount, withdrawal_id }
// Initiates a bank transfer to the investor's saved bank account via Flutterwave
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investor_id, amount, withdrawal_id } = body;

    if (!investor_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get investor's bank details from profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('full_name, bank_name, account_number, account_name')
      .eq('id', investor_id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Investor profile not found' }, { status: 404 });
    }

    if (!profile.bank_name || !profile.account_number || !profile.account_name) {
      return NextResponse.json({ error: 'Bank details not set. Please update your profile settings first.' }, { status: 400 });
    }

    // Bank code mapping (Flutterwave uses bank codes)
    const bankCodes: Record<string, string> = {
      'Access Bank': '044',
      'Citibank': '023',
      'Ecobank': '050',
      'Fidelity Bank': '070',
      'First Bank': '011',
      'First City Monument Bank (FCMB)': '214',
      'Globus Bank': '103',
      'Guaranty Trust Bank (GTBank)': '058',
      'Heritage Bank': '030',
      'Jaiz Bank': '301',
      'Keystone Bank': '082',
      'Kuda Bank': '090267',
      'Opay': '100004',
      'Palmpay': '100033',
      'Polaris Bank': '076',
      'Providus Bank': '101',
      'Stanbic IBTC Bank': '221',
      'Standard Chartered Bank': '068',
      'Sterling Bank': '232',
      'SunTrust Bank': '100',
      'Titan Trust Bank': '102',
      'Union Bank': '032',
      'United Bank for Africa (UBA)': '033',
      'Unity Bank': '215',
      'Wema Bank': '035',
      'Zenith Bank': '057',
    };

    const bankCode = bankCodes[profile.bank_name] || '';
    if (!bankCode) {
      return NextResponse.json({ error: 'Unsupported bank. Please contact support.' }, { status: 400 });
    }

    const reference = `FF-WD-${(withdrawal_id || investor_id).slice(0, 8)}-${Date.now()}`;

    // Initiate Flutterwave Transfer
    const transferRes = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: profile.account_number,
        amount,
        currency: 'NGN',
        narration: `FlockFund withdrawal - ${reference}`,
        reference,
        beneficiary_name: profile.account_name,
        meta: {
          investor_id,
          withdrawal_id: withdrawal_id || null,
        },
      }),
    });

    const transferData = await transferRes.json();

    if (transferData.status === 'success') {
      // Update withdrawal record
      if (withdrawal_id) {
        await supabase.from('withdrawals').update({
          status: 'processing',
          payment_reference: reference,
          processed_at: new Date().toISOString(),
        }).eq('id', withdrawal_id);
      }

      return NextResponse.json({
        success: true,
        reference,
        transfer_id: transferData.data?.id,
        message: 'Transfer initiated successfully. Funds will arrive within 24 hours.',
      });
    } else {
      // Log failure
      if (withdrawal_id) {
        await supabase.from('withdrawals').update({
          status: 'failed',
          failure_reason: transferData.message || 'Transfer failed',
        }).eq('id', withdrawal_id);
      }

      return NextResponse.json({
        error: transferData.message || 'Transfer failed',
        details: transferData.data,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payout error:', error);
    return NextResponse.json({ error: 'Payout processing failed' }, { status: 500 });
  }
}
