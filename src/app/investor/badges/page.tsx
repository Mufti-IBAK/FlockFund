'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  criteria: unknown;
}

interface AwardedBadge {
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

export default function InvestorBadges() {
  const [awarded, setAwarded] = useState<AwardedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [myBadges, badges] = await Promise.all([
          supabase.from('investor_badges').select('badge_id, awarded_at, badges(*)').eq('investor_id', user.id),
          supabase.from('badges').select('*'),
        ]);
        setAwarded((myBadges.data as unknown as AwardedBadge[]) || []);
        setAllBadges(badges.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.badge-card'),
          { scale: 0, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, stagger: 0.1, duration: 0.6, ease: 'back.out(2)', delay: 0.2 });
      });
      return () => ctx.revert();
    }
  }, []);

  const awardedIds = new Set(awarded.map((a) => a.badge_id));

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Badges & Achievements</h1>
        <p className="text-slate-400 text-sm mt-1">Your investment milestones and earned rewards</p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-br from-accent/10 to-amber-500/5 rounded-2xl p-6 border border-accent/10 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent text-3xl">military_tech</span>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{awarded.length} / {allBadges.length}</p>
            <p className="text-slate-500 text-xs font-medium">Badges Earned</p>
          </div>
          <div className="ml-auto">
            <div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-emerald-500 rounded-full"
                style={{ width: `${allBadges.length > 0 ? (awarded.length / allBadges.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {allBadges.map((badge) => {
            const earned = awardedIds.has(badge.id);
            return (
              <div key={badge.id} className={`badge-card rounded-2xl p-5 border text-center transition-all duration-300 ${
                earned ? 'bg-white border-accent/20 shadow-md hover:shadow-xl hover:-translate-y-1' : 'bg-slate-50 border-slate-200/80 opacity-50'
              }`}>
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                  earned ? 'bg-gradient-to-br from-accent/30 to-emerald-500/30' : 'bg-slate-200'
                }`}>
                  <span className={`material-symbols-outlined text-2xl ${earned ? 'text-accent' : 'text-slate-400'}`}>
                    {badge.icon_name || 'emoji_events'}
                  </span>
                </div>
                <p className={`text-sm font-bold ${earned ? 'text-primary' : 'text-slate-400'}`}>{badge.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{badge.description}</p>
                {earned && (
                  <p className="text-[9px] text-accent font-bold mt-2 uppercase tracking-wider">✓ Earned</p>
                )}
              </div>
            );
          })}
          {allBadges.length === 0 && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">military_tech</span>
              <p className="text-sm text-slate-400">No badges configured yet. Badges will appear here as you invest!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
