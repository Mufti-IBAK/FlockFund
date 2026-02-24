'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface TrendData {
  date: string;
  mortality: number;
  temperature: number;
  feed_kg: number;
}

// SVG Line Chart Component
function LineChart({ data, yKey, color, label, unit }: {
  data: TrendData[];
  yKey: keyof TrendData;
  color: string;
  label: string;
  unit: string;
}) {
  if (data.length === 0) return null;

  const W = 600, H = 200, PAD = 40, PAD_B = 50, PAD_L = 50;
  const values = data.map((d) => Number(d[yKey]) || 0);
  const minY = Math.min(...values) * 0.9;
  const maxY = Math.max(...values) * 1.1 || 1;
  const rangeY = maxY - minY || 1;

  const points = data.map((d, i) => {
    const x = PAD_L + (i / Math.max(1, data.length - 1)) * (W - PAD_L - PAD);
    const y = H - PAD_B - ((Number(d[yKey]) || 0) - minY) / rangeY * (H - PAD - PAD_B);
    return { x, y, val: Number(d[yKey]) || 0, date: d.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${H - PAD_B} L ${points[0].x} ${H - PAD_B} Z`;

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minY + (rangeY * i) / 4;
    const y = H - PAD_B - (i / 4) * (H - PAD - PAD_B);
    return { val, y };
  });

  // X-axis labels (max 8)
  const step = Math.max(1, Math.floor(data.length / 8));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={t.y} x2={W - PAD} y2={t.y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={PAD_L - 6} y={t.y + 3} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">{t.val.toFixed(1)}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={`${color}15`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
            {/* Hover target + tooltip */}
            <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer">
              <title>{p.date}: {p.val.toFixed(1)}{unit}</title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          const x = PAD_L + (idx / Math.max(1, data.length - 1)) * (W - PAD_L - PAD);
          const shortDate = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={i} x={x} y={H - PAD_B + 18} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
              {shortDate}
            </text>
          );
        })}

        {/* Axis lines */}
        <line x1={PAD_L} y1={PAD} x2={PAD_L} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD} y2={H - PAD_B} stroke="#cbd5e1" strokeWidth="1" />

        {/* Y-axis label */}
        <text x="12" y={(H - PAD_B + PAD) / 2} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold"
          transform={`rotate(-90, 12, ${(H - PAD_B + PAD) / 2})`}>
          {label} ({unit})
        </text>
      </svg>
    </div>
  );
}

export default function ManagerHealthTrends() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Try to load approved reports first
        const { data: reports, error } = await supabase
          .from('farm_reports')
          .select('report_date, mortality_count, temperature, temperature_celsius, feed_consumed_kg, status')
          .in('status', ['approved', 'pending'])
          .order('report_date', { ascending: true })
          .limit(90);

        if (error) {
          console.error('Query error:', error);
          throw error;
        }

        // Aggregate by date
        const byDate: Record<string, { mortality: number; temperature: number; feed_kg: number; count: number }> = {};
        (reports || []).forEach((r: Record<string, unknown>) => {
          const d = (r.report_date as string) || '';
          if (!d) return;
          if (!byDate[d]) byDate[d] = { mortality: 0, temperature: 0, feed_kg: 0, count: 0 };
          byDate[d].mortality += (r.mortality_count as number) || 0;
          byDate[d].temperature += (r.temperature_celsius as number) || (r.temperature as number) || 0;
          byDate[d].feed_kg += (r.feed_consumed_kg as number) || 0;
          byDate[d].count += 1;
        });

        const trendData = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({
            date,
            mortality: v.mortality,
            temperature: v.count > 0 ? Math.round((v.temperature / v.count) * 10) / 10 : 0,
            feed_kg: Math.round(v.feed_kg * 10) / 10,
          }));

        setData(trendData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current && !loading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.chart-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [loading]);

  // Summary KPIs
  const totalMortality = data.reduce((s, d) => s + d.mortality, 0);
  const avgTemp = data.length > 0 ? data.reduce((s, d) => s + d.temperature, 0) / data.filter(d => d.temperature > 0).length : 0;
  const totalFeed = data.reduce((s, d) => s + d.feed_kg, 0);

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Health Trends</h1>
        <p className="text-slate-400 text-sm mt-1">Flock health metrics from keeper reports (line charts)</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">monitoring</span>
          <p className="text-sm text-slate-400 mb-2">No report data yet.</p>
          <p className="text-[10px] text-slate-300">Submit and approve keeper reports to see health trends here.</p>
        </div>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-rose-500 text-base">warning</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mortality</span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-rose-600">{totalMortality}</p>
              <p className="text-[10px] text-slate-400">across {data.length} report days</p>
            </div>
            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-amber-600 text-base">thermostat</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Temperature</span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-primary">{avgTemp ? avgTemp.toFixed(1) : '—'}°C</p>
              <p className="text-[10px] text-slate-400">average across reports</p>
            </div>
            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-emerald-600 text-base">set_meal</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Feed</span>
              </div>
              <p className="text-2xl font-mono font-extrabold text-primary">{totalFeed.toFixed(1)} kg</p>
              <p className="text-[10px] text-slate-400">total consumed</p>
            </div>
          </div>

          {/* Line Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-500 text-base">warning</span>
                </div>
                <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Mortality Trend</h3>
              </div>
              <LineChart data={data} yKey="mortality" color="#f43f5e" label="Mortality" unit="birds" />
            </div>

            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-base">thermostat</span>
                </div>
                <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Temperature Trend</h3>
              </div>
              <LineChart data={data} yKey="temperature" color="#f59e0b" label="Temperature" unit="°C" />
            </div>

            <div className="chart-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-base">set_meal</span>
                </div>
                <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Feed Consumption (kg)</h3>
              </div>
              <LineChart data={data} yKey="feed_kg" color="#10b981" label="Feed" unit="kg" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
