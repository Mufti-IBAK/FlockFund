'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function KeeperDashboard() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;
      gsap.fromTo(
        contentRef.current.querySelector('.greeting-card'),
        { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        contentRef.current.querySelectorAll('.task-card'),
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.65, ease: 'back.out(1.3)', delay: 0.4 }
      );
      gsap.fromTo(
        contentRef.current.querySelectorAll('.quick-action'),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(2)', delay: 0.8 }
      );
    });
    return () => ctx.revert();
  }, []);

  const tasks = [
    { icon: 'vaccines', label: 'Morning Health Check', time: '6:00 AM', status: 'done' },
    { icon: 'water_drop', label: 'Check Water Supply', time: '7:00 AM', status: 'done' },
    { icon: 'set_meal', label: 'Feed Distribution', time: '8:00 AM', status: 'current' },
    { icon: 'assignment', label: 'Submit Daily Report', time: '5:00 PM', status: 'pending' },
    { icon: 'nest_cam_wired_stand', label: 'Evening Inspection', time: '6:30 PM', status: 'pending' },
  ];

  async function handleQuickAction(type: 'alert' | 'vet') {
    if (!confirm(`Are you sure you want to send a ${type === 'vet' ? 'Veterinary Request' : 'Manager Alert'}?`)) return;
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const name = profile?.full_name || 'A keeper';

      // 1. Find relevant recipients (Admin and depending on type, Manager)
      const { data: recipients } = await supabase
        .from('profiles')
        .select('id')
        .in('role', type === 'vet' ? ['admin', 'farm_manager'] : ['admin', 'farm_manager']);

      if (recipients) {
        const notifs = recipients.map(r => ({
          user_id: r.id,
          title: type === 'vet' ? '🚑 Vet Visit Requested' : '⚠️ Emergency Alert',
          message: `${name} has triggered a critical ${type === 'vet' ? 'medical' : 'operational'} alert from the farm.`,
          type: 'system',
          redirect_url: type === 'vet' ? '/manager/pending' : '/admin'
        }));

        await supabase.from('notifications').insert(notifs);
        alert(`${type === 'vet' ? 'Veterinary request' : 'Manager alert'} sent successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to trigger action');
    }
  }

  return (
    <div ref={contentRef}>
      {/* Greeting */}
      <div className="greeting-card bg-gradient-to-br from-primary via-[#1a4035] to-primary rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight mb-1">Good Morning, Keeper</h1>
          <p className="text-white/40 text-sm">You have {tasks.filter(t => t.status === 'pending').length} tasks remaining today</p>
        </div>
      </div>

      {/* Daily Tasks */}
      <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">Daily Tasks</h2>
      <div className="grid gap-3 mb-8">
        {tasks.map((task, i) => (
          <div key={i} className={`task-card flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-default ${
            task.status === 'done' ? 'bg-emerald-50/50 border-emerald-100' :
            task.status === 'current' ? 'bg-accent/5 border-accent/20 shadow-sm' :
            'bg-white border-slate-200/80 hover:border-slate-300'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              task.status === 'done' ? 'bg-emerald-100' :
              task.status === 'current' ? 'bg-accent/20' :
              'bg-slate-100'
            }`}>
              <span className={`material-symbols-outlined text-lg ${
                task.status === 'done' ? 'text-emerald-600' :
                task.status === 'current' ? 'text-amber-700' :
                'text-slate-400'
              }`}>{task.status === 'done' ? 'check_circle' : task.icon}</span>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${task.status === 'done' ? 'text-emerald-700 line-through' : 'text-primary'}`}>{task.label}</p>
              <p className="text-[10px] text-slate-400">{task.time}</p>
            </div>
            {task.status === 'current' && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-primary animate-pulse">In Progress</span>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'add_circle', label: 'New Report', href: '/keeper/new-report', color: 'bg-primary text-white' },
          { icon: 'history', label: 'My Reports', href: '/keeper/reports', color: 'bg-sky-500 text-white' },
          { icon: 'warning', label: 'Alert Manager', onClick: () => handleQuickAction('alert'), color: 'bg-rose-500 text-white' },
          { icon: 'local_hospital', label: 'Vet Request', onClick: () => handleQuickAction('vet'), color: 'bg-amber-500 text-white' },
        ].map((action) => (
          action.onClick ? (
            <button key={action.label} onClick={action.onClick}
              className={`quick-action ${action.color} rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg hover:scale-[1.03] transition-all duration-300`}>
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{action.label}</span>
            </button>
          ) : (
            <a key={action.label} href={action.href}
              className={`quick-action ${action.color} rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg hover:scale-[1.03] transition-all duration-300`}>
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{action.label}</span>
            </a>
          )
        ))}
      </div>
    </div>
  );
}
