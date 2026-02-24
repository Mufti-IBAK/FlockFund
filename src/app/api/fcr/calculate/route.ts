import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/fcr/calculate
// Computes weekly FCR from approved farm_reports + weight_records
// Called after report approval
// Body (optional): { flock_id?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const flockId = body.flock_id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all active flocks (or specific flock)
    let flockQuery = supabase.from('flocks').select('id').eq('status', 'active');
    if (flockId) flockQuery = flockQuery.eq('id', flockId);
    const { data: flocks } = await flockQuery;

    if (!flocks || flocks.length === 0) {
      return NextResponse.json({ success: true, message: 'No active flocks' });
    }

    const results = [];

    for (const flock of flocks) {
      // Get approved reports for this flock, ordered by date
      const { data: reports } = await supabase
        .from('farm_reports')
        .select('report_date, feed_consumed_kg, mortality_count')
        .eq('flock_id', flock.id)
        .eq('status', 'approved')
        .order('report_date', { ascending: true });

      if (!reports || reports.length === 0) continue;

      // Get weight records for this flock
      const { data: weights } = await supabase
        .from('weight_records')
        .select('weight_kg, sample_date, created_at')
        .eq('flock_id', flock.id)
        .order('sample_date', { ascending: true });

      // Group reports by week
      const firstDate = new Date(reports[0].report_date);
      const weeklyData: Record<number, { totalFeed: number; mortality: number; dates: string[] }> = {};

      for (const r of reports) {
        const daysSinceStart = Math.floor(
          (new Date(r.report_date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const weekNum = Math.floor(daysSinceStart / 7) + 1;

        if (!weeklyData[weekNum]) {
          weeklyData[weekNum] = { totalFeed: 0, mortality: 0, dates: [] };
        }
        weeklyData[weekNum].totalFeed += r.feed_consumed_kg || 0;
        weeklyData[weekNum].mortality += r.mortality_count || 0;
        weeklyData[weekNum].dates.push(r.report_date);
      }

      // Group weights by week
      const weeklyWeights: Record<number, number[]> = {};
      if (weights) {
        for (const w of weights) {
          const wDate = new Date(w.sample_date || w.created_at);
          const daysSinceStart = Math.floor(
            (wDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weekNum = Math.floor(daysSinceStart / 7) + 1;
          if (!weeklyWeights[weekNum]) weeklyWeights[weekNum] = [];
          weeklyWeights[weekNum].push(w.weight_kg || 0);
        }
      }

      // Calculate FCR for each week and upsert
      let cumulativeFeed = 0;
      for (const [weekStr, data] of Object.entries(weeklyData)) {
        const weekNum = parseInt(weekStr);
        cumulativeFeed += data.totalFeed;

        // Average weight for this week (or carry forward from previous weeks)
        let avgWeight = 0;
        if (weeklyWeights[weekNum] && weeklyWeights[weekNum].length > 0) {
          avgWeight = weeklyWeights[weekNum].reduce((a, b) => a + b, 0) / weeklyWeights[weekNum].length;
        } else {
          // Find closest earlier week with weight data
          for (let w = weekNum; w >= 1; w--) {
            if (weeklyWeights[w] && weeklyWeights[w].length > 0) {
              avgWeight = weeklyWeights[w].reduce((a, b) => a + b, 0) / weeklyWeights[w].length;
              break;
            }
          }
        }

        // FCR = cumulative feed / avg weight (per bird)
        const effectiveWeight = avgWeight > 0 ? avgWeight : 0.04 + (weekNum * 0.25);
        const fcr = effectiveWeight > 0 ? Math.round((cumulativeFeed / effectiveWeight) * 100) / 100 : 0;

        // Upsert into fcr_calculations
        const { error } = await supabase
          .from('fcr_calculations')
          .upsert({
            flock_id: flock.id,
            week_number: weekNum,
            avg_weight_kg: Math.round(effectiveWeight * 1000) / 1000,
            total_feed_kg: Math.round(cumulativeFeed * 100) / 100,
            fcr,
            calculated_at: new Date().toISOString(),
          }, { onConflict: 'flock_id,week_number' });

        if (error) {
          console.error(`FCR upsert error week ${weekNum}:`, error);
          // Fallback: try plain insert
          await supabase.from('fcr_calculations').insert({
            flock_id: flock.id,
            week_number: weekNum,
            avg_weight_kg: Math.round(effectiveWeight * 1000) / 1000,
            total_feed_kg: Math.round(cumulativeFeed * 100) / 100,
            fcr,
            calculated_at: new Date().toISOString(),
          });
        }

        results.push({ flock_id: flock.id, week: weekNum, fcr, feed: cumulativeFeed, weight: effectiveWeight });
      }
    }

    return NextResponse.json({ success: true, calculations: results });
  } catch (error) {
    console.error('FCR calculation error:', error);
    return NextResponse.json({ error: 'FCR calculation failed' }, { status: 500 });
  }
}
