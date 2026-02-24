'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  icon_url: string;
  criteria: Record<string, unknown>;
  created_at: string;
}

export default function AdminGamification() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon_name: 'emoji_events' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  async function loadBadges() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('badges').select('*').order('created_at', { ascending: false });
      setBadges((data || []) as Badge[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadBadges(); }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.badge-item'),
          { scale: 0, opacity: 0, rotation: -10 },
          { scale: 1, opacity: 1, rotation: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(2)', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [badges]);

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Badge name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function createBadge() {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('badges').insert({
        name: form.name,
        description: form.description,
        icon_url: form.icon_name,
        icon_name: form.icon_name,
        criteria: {},
      });
      if (error) {
        console.error('Badge creation error:', error);
        alert(`Failed to create badge: ${error.message}`);
        return;
      }
      setForm({ name: '', description: '', icon_name: 'emoji_events' });
      setErrors({});
      setShowCreate(false);
      await loadBadges();
    } catch (err) {
      console.error(err);
      alert('Failed to create badge. Check console.');
    }
    finally { setCreating(false); }
  }

  async function deleteBadge(id: string) {
    if (!confirm('Delete this badge? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('badges').delete().eq('id', id);
      if (error) {
        alert(`Failed to delete: ${error.message}`);
        return;
      }
      await loadBadges();
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  }

  const iconSuggestions = [
    'emoji_events', 'military_tech', 'star', 'workspace_premium',
    'diamond', 'rocket_launch', 'local_fire_department', 'bolt',
    'trending_up', 'favorite', 'thumb_up', 'verified',
  ];

  const getIconName = (badge: Badge) => badge.icon_name || badge.icon_url || 'emoji_events';

  return (
    <div ref={contentRef}>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Gamification</h1>
          <p className="text-slate-400 text-sm mt-1">Manage badges, achievements, and investor rewards</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-lg">{showCreate ? 'close' : 'add'}</span>
          {showCreate ? 'Cancel' : 'New Badge'}
        </button>
      </div>

      {/* Create Badge Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-accent/20 p-4 md:p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">Create Badge</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badge Name *</label>
              <input type="text" value={form.name} placeholder="e.g. First Investment"
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors((e2) => ({ ...e2, name: '' })); }}
                className={`w-full bg-slate-50 border ${errors.name ? 'border-rose-400' : 'border-slate-200'} rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`} />
              {errors.name && <p className="text-rose-500 text-[10px] font-bold">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {iconSuggestions.map((icon) => (
                  <button key={icon} onClick={() => setForm({ ...form, icon_name: icon })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      form.icon_name === icon ? 'bg-accent text-primary shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}>
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description *</label>
            <textarea rows={2} value={form.description} placeholder="What does the investor need to achieve?"
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors((e2) => ({ ...e2, description: '' })); }}
              className={`w-full bg-slate-50 border ${errors.description ? 'border-rose-400' : 'border-slate-200'} rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none`} />
            {errors.description && <p className="text-rose-500 text-[10px] font-bold">{errors.description}</p>}
          </div>
          <div className="flex justify-end">
            <button onClick={createBadge} disabled={creating}
              className="px-6 py-3 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Badge'}
            </button>
          </div>
        </div>
      )}

      {/* Badges Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">emoji_events</span>
          <p className="text-sm text-slate-400">No badges created yet. Create your first badge to start gamifying the platform!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {badges.map((badge) => (
            <div key={badge.id} className="badge-item bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 group relative">
              <button onClick={() => deleteBadge(badge.id)} disabled={deleting === badge.id}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                <span className="material-symbols-outlined text-sm">{deleting === badge.id ? 'sync' : 'delete'}</span>
              </button>
              <div className="w-14 h-14 rounded-xl mx-auto bg-gradient-to-br from-accent/30 to-emerald-500/30 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-accent text-2xl">{getIconName(badge)}</span>
              </div>
              <p className="text-sm font-bold text-primary">{badge.name}</p>
              <p className="text-[10px] text-slate-400 mt-1">{badge.description}</p>
              {badge.created_at && <p className="text-[9px] text-slate-300 mt-2">Created {new Date(badge.created_at).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
