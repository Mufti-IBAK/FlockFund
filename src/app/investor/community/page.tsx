"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string };
}

export default function InvestorCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  async function loadPosts() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("community_posts")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(30);
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  async function loadComments(postId: string) {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("post_comments")
        .select("*, profiles(full_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setComments((prev) => ({ ...prev, [postId]: data || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleAddComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: text,
      });

      if (error) throw error;
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      await loadComments(postId);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      await loadComments(postId);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".post-card"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, posts]);

  async function handleCreate() {
    if (!newPost.title.trim()) return;
    setCreating(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("community_posts").insert({
        author_id: user.id,
        title: newPost.title,
        content: newPost.content,
      });
      if (error) throw error;
      setNewPost({ title: "", content: "" });
      setShowCreate(false);
      await loadPosts();
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={contentRef}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Community
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Investor discussions and updates
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
        >
          <span className="material-symbols-outlined text-lg">
            {showCreate ? "close" : "edit"}
          </span>
          {showCreate ? "Cancel" : "New Post"}
        </button>
      </div>

      {/* Create Post */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-accent/20 p-6 mb-6 shadow-sm">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Post title…"
              value={newPost.title}
              onChange={(e) =>
                setNewPost({ ...newPost, title: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <textarea
              rows={4}
              placeholder="Share your thoughts with the community…"
              value={newPost.content}
              onChange={(e) =>
                setNewPost({ ...newPost, content: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={creating || !newPost.title.trim()}
                className="px-6 py-3 bg-accent text-primary rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {creating ? "Posting…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
            forum
          </span>
          <p className="text-sm text-slate-400">
            No posts yet. Start the conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="post-card bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                    {p.profiles?.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-primary leading-tight">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                        {p.profiles?.full_name || "Anonymous User"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(p.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {p.content}
                </p>

                {/* Interaction Bar */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => {
                      if (!comments[p.id]) loadComments(p.id);
                      else
                        setComments((prev) => {
                          const next = { ...prev };
                          delete next[p.id];
                          return next;
                        });
                    }}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                      comment
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Comments
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors group">
                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                      share
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Share
                    </span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {comments[p.id] !== undefined && (
                <div className="bg-slate-50 border-t border-slate-100 p-5 space-y-4">
                  <div className="space-y-3">
                    {loadingComments[p.id] ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                      </div>
                    ) : comments[p.id].length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-2">
                        No comments yet. Be the first to reply!
                      </p>
                    ) : (
                      comments[p.id].map((c) => (
                        <div key={c.id} className="flex gap-3 group">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {c.profiles?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-xl rounded-tl-none p-3 border border-slate-200 shadow-sm relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-primary">
                                  {c.profiles?.full_name || "User"}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(c.created_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-normal">
                                {c.content}
                              </p>

                              <button
                                onClick={() => handleDeleteComment(p.id, c.id)}
                                className="absolute -right-2 -top-2 w-5 h-5 bg-white border border-slate-100 rounded-full text-slate-300 hover:text-red-500 hover:border-red-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  close
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-3 pt-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">
                      Me
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        placeholder="Write a reply..."
                        value={commentText[p.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none h-16"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleAddComment(p.id)}
                          disabled={!commentText[p.id]?.trim()}
                          className="px-4 py-1.5 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
