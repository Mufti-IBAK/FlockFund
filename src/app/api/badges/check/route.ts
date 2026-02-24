import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface BadgeCriteria {
  type: string;
  threshold?: number;
}

// POST /api/badges/check
// Body: { investor_id }
// Called after key events (investment, withdrawal, referral) to check and award badges
export async function POST(req: NextRequest) {
  try {
    const { investor_id } = await req.json();
    if (!investor_id) {
      return NextResponse.json({ error: 'investor_id required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all badges and investor's current awards
    const [badgesResult, awardedResult, investmentsResult, referralsResult] = await Promise.all([
      supabase.from('badges').select('*'),
      supabase.from('investor_badges').select('badge_id').eq('investor_id', investor_id),
      supabase.from('investments').select('*').eq('investor_id', investor_id).in('status', ['active', 'completed']),
      supabase.from('referrals').select('id').eq('referrer_id', investor_id),
    ]);

    const allBadges = badgesResult.data || [];
    const awardedIds = new Set((awardedResult.data || []).map((a) => a.badge_id));
    const investments = investmentsResult.data || [];
    const referralCount = (referralsResult.data || []).length;
    const totalBirds = investments.reduce((s, i) => s + (i.birds_owned || 0), 0);
    const totalInvested = investments.reduce((s, i) => s + (i.amount_invested || 0), 0);

    const newAwards: string[] = [];

    for (const badge of allBadges) {
      if (awardedIds.has(badge.id)) continue;

      const criteria = badge.criteria as BadgeCriteria | null;
      if (!criteria || !criteria.type) continue;

      let earned = false;

      switch (criteria.type) {
        case 'first_investment':
          earned = investments.length >= 1;
          break;
        case 'investment_count':
          earned = investments.length >= (criteria.threshold || 5);
          break;
        case 'birds_owned':
          earned = totalBirds >= (criteria.threshold || 100);
          break;
        case 'amount_invested':
          earned = totalInvested >= (criteria.threshold || 100000);
          break;
        case 'referral_count':
          earned = referralCount >= (criteria.threshold || 3);
          break;
      }

      if (earned) {
        const { error } = await supabase.from('investor_badges').insert({
          investor_id,
          badge_id: badge.id,
        });
        if (!error) newAwards.push(badge.name);
      }
    }

    return NextResponse.json({
      success: true,
      new_badges: newAwards,
      total_badges: awardedIds.size + newAwards.length,
    });

  } catch (error) {
    console.error('Badge check error:', error);
    return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}
