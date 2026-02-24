'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: { full_name: string };
  comment_count?: number;
}

export default function AdminCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Get posts with author names
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDeletePost(id: string) {
    if (!confirm('Are you sure you want to delete this post? All associated comments will be removed.')) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('community_posts').delete().eq('id', id);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-primary tracking-tight">Community Moderation</h1>
          <p className="text-slate-400 text-sm mt-1">Manage public forum posts and comments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post Title</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                  No community posts found.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {p.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-bold text-primary">{p.profiles?.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-sm font-bold text-primary leading-tight">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate mt-1">{p.content}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => handleDeletePost(p.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Post"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
