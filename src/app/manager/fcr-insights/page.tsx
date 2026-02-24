'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface FCRWeek {
  week: number;
  avgWeight: number;
  totalFeed: number;
  fcr: number;
}

interface WeightPoint {
  date: string;
  weight: number;
}

// SVG Line Chart for FCR
function FCRLineChart({ data }: { data: FCRWeek[] }) {
  if (data.length === 0) return null;
  const W = 600, H = 200, PAD = 40, PAD_B = 50, PAD_L = 55;
  const values = data.map((d) => d.fcr);
  const minY = Math.min(...values) * 0.8;
  const maxY = Math.max(...values) * 1.2 || 1;
  const rangeY = maxY - minY || 1;

  const points = data.map((d, i) => {
    const x = PAD_L + (i / Math.max(1, data.length - 1)) * (W - PAD_L - PAD);
    const y = H - PAD_B - ((d.fcr - minY) / rangeY) * (H - PAD - PAD_B);
    return { x, y, fcr: d.fcr, week: d.week, feed: d.totalFeed, wt: d.avgWeight };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${H - PAD_B} L ${points[0].x} ${H - PAD_B} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => ({
    val: minY + (rangeY * i) / 4,
    y: H - PAD_B - (i / 4) * (H - PAD - PAD_B),
  }));

  function barColor(fcr: number) {
    if (fcr < 1.8) return '#10b981';
    if (fcr < 2.2) return '#f59e0b';
    if (fcr < 2.5) return '#f97316';
    return '#ef4444';
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={t.y} x2={W - PAD} y2={t.y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={PAD_L - 6} y={t.y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">{t.val.toFixed(2)}</text>
          </g>
        ))}
        <path d={areaD} fill="url(#fcrGrad)" />
        <defs>
          <linearGradient id="fcrGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={barColor(p.fcr)} stroke="white" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" className="cursor-pointer">
              <title>Week {p.week} · FCR: {p.fcr.toFixed(2)} · Feed: {p.feed.toFixed(1)}kg · Weight: {p.wt.toFixed(2)}kg</title>
            </circle>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD_L + (i / Math.max(1, data.length - 1)) * (W - PAD_L - PAD);
          return <text key={i} x={x} y={H - PAD_B + 18} textAnchor="middle" fill="#94a3b8" fontSize="9">W{d.week}</text>;
        })}
        <line x1={PAD_L} y1={PAD} x2={PAD_L} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />
        <text x="14" y={(H - PAD_B + PAD) / 2} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold"
          transform={`rotate(-90, 14, ${(H - PAD_B + PAD) / 2})`}>FCR Ratio</text>
      </svg>
    </div>
  );
}

// SVG Line Chart for Weight Growth
function WeightLineChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) return null;
  const W = 600, H = 180, PAD = 40, PAD_B = 50, PAD_L = 55;
  const values = data.map((d) => d.weight);
  const minY = Math.min(...values) * 0.8;
  const maxY = Math.max(...values) * 1.2 || 1;
  const rangeY = maxY - minY || 1;

  const points = data.map((d, i) => ({
    x: PAD_L + (i / Math.max(1, data.length - 1)) * (W - PAD_L - PAD),
    y: H - PAD_B - ((d.weight - minY) / rangeY) * (H - PAD - PAD_B),
    weight: d.weight, date: d.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${H - PAD_B} L ${points[0].x} ${H - PAD_B} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => ({
    val: minY + (rangeY * i) / 4,
    y: H - PAD_B - (i / 4) * (H - PAD - PAD_B),
  }));

  const step = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={t.y} x2={W - PAD} y2={t.y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={PAD_L - 6} y={t.y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">{t.val.toFixed(2)}</text>
          </g>
        ))}
        <path d={areaD} fill="#0ea5e515" />
        <path d={pathD} fill="none" stroke="#0ea5e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#0ea5e5" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer">
              <title>{p.date}: {p.weight.toFixed(2)} kg</title>
            </circle>
          </g>
        ))}
        {data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d) => {
          const idx = data.indexOf(d);
          const x = PAD_L + (idx / Math.max(1, data.length - 1)) * (W - PAD_L - PAD);
          const short = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return <text key={idx} x={x} y={H - PAD_B + 18} textAnchor="middle" fill="#94a3b8" fontSize="9">{short}</text>;
        })}
        <line x1={PAD_L} y1={PAD} x2={PAD_L} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />
        <text x="14" y={(H - PAD_B + PAD) / 2} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold"
          transform={`rotate(-90, 14, ${(H - PAD_B + PAD) / 2})`}>Weight (kg)</text>
      </svg>
    </div>
  );
}

export default function ManagerFCRInsights() {
  const [fcrData, setFcrData] = useState<FCRWeek[]>([]);
  const [weightData, setWeightData] = useState<WeightPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // 1. Try loading from fcr_calculations table
        let fcrRows: FCRWeek[] = [];
        try {
          const { data: fcr } = await supabase
            .from('fcr_calculations')
            .select('week_number, avg_weight_kg, total_feed_kg, fcr')
            .order('week_number', { ascending: true })
            .limit(30);

          if (fcr && fcr.length > 0) {
            fcrRows = fcr.map((r) => ({
              week: r.week_number,
              avgWeight: r.avg_weight_kg || 0,
              totalFeed: r.total_feed_kg || 0,
              fcr: r.fcr || 0,
            }));
          }
        } catch { /* table may not exist */ }

        // 2. Fallback: compute FCR on-the-fly from approved reports
        if (fcrRows.length === 0) {
          const { data: reports } = await supabase
            .from('farm_reports')
            .select('report_date, feed_consumed_kg, mortality_count, flock_id')
            .in('status', ['approved', 'pending'])
            .order('report_date', { ascending: true })
            .limit(200);

          const { data: weights } = await supabase
            .from('weight_records')
            .select('weight_kg, sample_date, created_at')
            .order('sample_date', { ascending: true })
            .limit(200);

          if (reports && reports.length > 0) {
            const firstDate = new Date(reports[0].report_date);
            const weeklyFeed: Record<number, number> = {};
            const weeklyWeights: Record<number, number[]> = {};

            for (const r of reports) {
              const days = Math.floor((new Date(r.report_date).getTime() - firstDate.getTime()) / 86400000);
              const week = Math.floor(days / 7) + 1;
              weeklyFeed[week] = (weeklyFeed[week] || 0) + (r.feed_consumed_kg || 0);
            }

            if (weights) {
              for (const w of weights) {
                const wDate = new Date(w.sample_date || w.created_at);
                const days = Math.floor((wDate.getTime() - firstDate.getTime()) / 86400000);
                const week = Math.floor(days / 7) + 1;
                if (!weeklyWeights[week]) weeklyWeights[week] = [];
                weeklyWeights[week].push(w.weight_kg || 0);
              }
            }

            let cumFeed = 0;
            const weeks = Object.keys(weeklyFeed).map(Number).sort((a, b) => a - b);
            for (const week of weeks) {
              cumFeed += weeklyFeed[week];
              let avgW = 0;
              if (weeklyWeights[week]?.length) {
                avgW = weeklyWeights[week].reduce((a, b) => a + b, 0) / weeklyWeights[week].length;
              } else {
                for (let w = week; w >= 1; w--) {
                  if (weeklyWeights[w]?.length) {
                    avgW = weeklyWeights[w].reduce((a, b) => a + b, 0) / weeklyWeights[w].length;
                    break;
                  }
                }
              }
              const effectiveW = avgW > 0 ? avgW : 0.04 + (week * 0.25);
              const fcr = effectiveW > 0 ? Math.round((cumFeed / effectiveW) * 100) / 100 : 0;
              fcrRows.push({ week, avgWeight: effectiveW, totalFeed: cumFeed, fcr });
            }
          }
        }

        setFcrData(fcrRows);

        // 3. Load weight records for growth curve
        try {
          const { data: wt } = await supabase
            .from('weight_records')
            .select('weight_kg, sample_date, created_at')
            .order('sample_date', { ascending: true })
            .limit(50);

          if (wt && wt.length > 0) {
            setWeightData(wt.map((w) => ({
              date: w.sample_date || (w.created_at ? w.created_at.split('T')[0] : ''),
              weight: w.weight_kg || 0,
            })).filter((w) => w.weight > 0));
          }
        } catch { /* weight_records may not exist */ }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current && !loading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.insight-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const avgFCR = fcrData.length > 0 ? fcrData.reduce((s, f) => s + f.fcr, 0) / fcrData.length : 0;
  const bestFCR = fcrData.length > 0 ? Math.min(...fcrData.map((f) => f.fcr)) : 0;
  const latestFCR = fcrData.length > 0 ? fcrData[fcrData.length - 1].fcr : 0;
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : (fcrData.length > 0 ? fcrData[fcrData.length - 1].avgWeight : 0);

  function fcrColor(v: number) {
    if (v === 0) return 'text-slate-400';
    if (v < 1.8) return 'text-emerald-600';
    if (v < 2.2) return 'text-amber-600';
    if (v < 2.5) return 'text-orange-600';
    return 'text-rose-600';
  }

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">FCR & Growth Insights</h1>
        <p className="text-slate-400 text-sm mt-1">Feed Conversion Ratio analysis and bird growth curves</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Avg FCR', value: avgFCR > 0 ? avgFCR.toFixed(2) : '—', icon: 'calculate', color: fcrColor(avgFCR) },
              { label: 'Best FCR', value: bestFCR > 0 ? bestFCR.toFixed(2) : '—', icon: 'emoji_events', color: fcrColor(bestFCR) },
              { label: 'Latest FCR', value: latestFCR > 0 ? latestFCR.toFixed(2) : '—', icon: 'trending_up', color: fcrColor(latestFCR) },
              { label: 'Latest Weight', value: latestWeight > 0 ? `${latestWeight.toFixed(2)} kg` : '—', icon: 'monitor_weight', color: 'text-sky-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="insight-card bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                  <span className={`material-symbols-outlined text-base ${kpi.color}`}>{kpi.icon}</span>
                </div>
                <p className={`font-mono text-xl font-bold ${kpi.color} tracking-tighter`}>{kpi.value}</p>
                <p className="text-slate-400 text-[10px] mt-0.5 font-bold uppercase tracking-wider">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* FCR Trend Chart */}
          <div className="insight-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-base">calculate</span>
              </div>
              <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">FCR Trend by Week</h3>
            </div>
            {fcrData.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">calculate</span>
                <p className="text-sm text-slate-400 mb-1">No FCR data yet.</p>
                <p className="text-[10px] text-slate-300">Submit keeper reports with feed and weight data, then approve them.</p>
              </div>
            ) : (
              <>
                <FCRLineChart data={fcrData} />
                <div className="flex items-center gap-5 mt-4 text-[10px] text-slate-400 font-bold flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> &lt;1.8 Excellent</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> 1.8–2.2 Good</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> 2.2–2.5 Average</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500" /> &gt;2.5 Poor</span>
                </div>
              </>
            )}
          </div>

          {/* Weight Growth Curve */}
          <div className="insight-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-sky-600 text-base">monitor_weight</span>
              </div>
              <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Bird Growth Curve</h3>
            </div>
            {weightData.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">monitor_weight</span>
                <p className="text-sm text-slate-400 mb-1">No weight records yet.</p>
                <p className="text-[10px] text-slate-300">Weight data appears from keeper daily reports (weight samples section).</p>
              </div>
            ) : (
              <>
                <WeightLineChart data={weightData} />
                <p className="text-[10px] text-slate-400 mt-2">{weightData.length} weight samples recorded</p>
              </>
            )}
          </div>

          {/* Recalculate button */}
          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                try {
                  await fetch('/api/fcr/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                  window.location.reload();
                } catch (e) { console.error(e); }
              }}
              className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Recalculate FCR
            </button>
          </div>
        </>
      )}
    </div>
  );
}
