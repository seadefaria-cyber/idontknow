"use client";

import { useState, useEffect } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: string;
  status: string;
  created_at: string;
  client_name?: string;
}

interface IdeasSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string }[];
  refreshSignal?: number;
}

const CATEGORIES = ["song", "video", "merch", "tour", "content", "other"];

function safeDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00Z");
  if (dateStr.includes("T")) return new Date(dateStr);
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function formatDate(dateStr: string): string {
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function IdeasSection({ role, allUsers, refreshSignal }: IdeasSectionProps) {
  const { data: ideas, refresh } = usePolling<Idea[]>(
    async () => {
      const res = await fetch("/api/ideas");
      if (!res.ok) return [];
      const data = await res.json();
      return data.ideas;
    },
    10000
  );

  useEffect(() => {
    if (refreshSignal) refresh();
  }, [refreshSignal]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("song");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    if (role === "admin" && !clientId) return;
    setSaving(true);
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: body || null, category, clientId: role === "admin" ? clientId : undefined }),
    });
    if (res.ok) {
      setTitle("");
      setBody("");
      setCategory("song");
      setClientId("");
      setShowForm(false);
      refresh();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    refresh();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  const ideaList = ideas || [];
  const filtered = filterCategory ? ideaList.filter((i) => i.category === filterCategory) : ideaList;

  const statusIcon = (s: string) => {
    if (s === "done") return "text-green-600 bg-green-50";
    if (s === "in_progress") return "text-blue-600 bg-blue-50";
    if (s === "shelved") return "text-gray-300 bg-gray-50";
    return "text-yellow-600 bg-yellow-50"; // new
  };

  return (
    <div className="animate-section-enter">
      <SectionHeader
        title="Ideas"
        action={{ label: showForm ? "Cancel" : "+ New Idea", onClick: () => setShowForm(!showForm) }}
      />

      {/* New idea form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Title</label>
            <input
              type="text"
              placeholder="What's the idea?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Details (optional)</label>
            <textarea
              placeholder="Describe the vision..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg text-sm font-light resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            {role === "admin" && (
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                >
                  <option value="" className="bg-white">Select client...</option>
                  {allUsers.filter((u) => u.username !== "seandefaria").map((u) => (
                    <option key={u.id} value={u.id} className="bg-white">{u.display_name || u.username}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
          >
            {saving ? "Saving..." : "Add Idea"}
          </button>
        </form>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
        <button
          onClick={() => setFilterCategory("")}
          className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${
            !filterCategory ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-500"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(filterCategory === c ? "" : c)}
            className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${
              filterCategory === c ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No ideas yet"
          description="Drop your ideas for songs, videos, merch, tours, and more"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((idea, i) => (
            <div
              key={idea.id}
              className="glass-elevated rounded-lg p-4 sm:p-5 transition-all duration-200 animate-fade-in hover:bg-gray-50"
              style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-700 font-light">{idea.title}</p>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusIcon(idea.status)}`}>
                      {idea.status === "in_progress" ? "in progress" : idea.status}
                    </span>
                  </div>
                  {idea.body && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{idea.body}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider">{idea.category}</span>
                    <span className="text-[10px] text-gray-300">{formatDate(idea.created_at)}</span>
                    {role === "admin" && idea.client_name && (
                      <span className="text-[10px] text-gray-300">{idea.client_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {role === "admin" && (
                    <select
                      value={idea.status}
                      onChange={(e) => handleStatusChange(idea.id, e.target.value)}
                      className="text-[10px] bg-white border border-gray-200 text-gray-500 rounded px-2 py-1"
                    >
                      <option value="new" className="bg-white">New</option>
                      <option value="in_progress" className="bg-white">In Progress</option>
                      <option value="done" className="bg-white">Done</option>
                      <option value="shelved" className="bg-white">Shelved</option>
                    </select>
                  )}
                  {role === "admin" && (
                    <button onClick={() => handleDelete(idea.id)} className="text-gray-200 hover:text-red-500 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
