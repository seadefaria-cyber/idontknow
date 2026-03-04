"use client";

import { useState, useEffect, useCallback } from "react";
import { type Section } from "./TabBar";

interface HomeSectionProps {
  userId: string;
  displayName: string;
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
  onNavigate: (section: Section) => void;
}

interface ScheduleEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
}

interface Thread {
  id: string;
  subject: string;
  last_message: string;
  updated_at: string;
  unread_count: number;
}

interface LegalDoc {
  id: string;
  title: string;
  status: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string | null;
}

interface Summary {
  pending_total: number;
  approved_total: number;
  paid_total: number;
  grand_total: number;
  pending_count: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr.replace(" ", "T") + "Z");
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
}

export default function HomeSection({ userId, displayName, role, allUsers, refreshSignal, onNavigate }: HomeSectionProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDoc[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [qbEarnings, setQbEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Admin link form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCategory, setLinkCategory] = useState("other");
  const [linkClientId, setLinkClientId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, threadsRes, legalRes, linksRes, reimbRes, qbRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/notes/threads"),
        fetch("/api/legal"),
        fetch("/api/links"),
        fetch("/api/reimbursements"),
        fetch("/api/quickbooks/expenses"),
      ]);

      if (schedRes.ok) {
        const d = await schedRes.json();
        // Only future events
        const today = new Date().toISOString().split("T")[0];
        setEvents((d.events || []).filter((e: ScheduleEvent) => e.event_date >= today).slice(0, 3));
      }
      if (threadsRes.ok) {
        const d = await threadsRes.json();
        setThreads((d.threads || []).slice(0, 3));
      }
      if (legalRes.ok) {
        const d = await legalRes.json();
        setLegalDocs(d.documents || []);
      }
      if (linksRes.ok) {
        const d = await linksRes.json();
        setLinks(d.links || []);
      }
      if (reimbRes.ok) {
        const d = await reimbRes.json();
        setSummary(d.summary || null);
      }
      if (qbRes.ok) {
        const d = await qbRes.json();
        const payments = (d.payments || []).filter((p: { status: string }) => p.status !== "voided" && p.status !== "unapplied");
        setQbEarnings(payments.reduce((s: number, p: { total_amount: number }) => s + p.total_amount, 0));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (refreshSignal) fetchData(); }, [refreshSignal, fetchData]);

  // Needs attention items
  const unsignedDocs = legalDocs.filter(d => d.status === "sent" || d.status === "draft").length;
  const pendingExpenses = summary?.pending_count || 0;

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  async function handleAddLink() {
    if (!linkTitle.trim() || !linkUrl.trim() || !linkClientId) return;
    await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, url: linkUrl, category: linkCategory, clientId: linkClientId }),
    });
    setLinkTitle(""); setLinkUrl(""); setLinkCategory("other"); setShowLinkForm(false);
    fetchData();
  }

  async function handleDeleteLink(id: string) {
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) {
    return (
      <div className="animate-section-enter flex items-center justify-center py-16">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-section-enter space-y-5">
      {/* Welcome */}
      <div className="rounded-xl p-5 border border-gray-100 bg-white shadow-sm">
        <p className="text-lg font-light text-gray-800">Welcome back, {displayName}</p>
        <p className="text-sm text-gray-400 mt-1">{todayStr}</p>
      </div>

      {/* Finance Snapshot */}
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Finances</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate("reimbursements")}
            className="rounded-xl p-4 border border-gray-100 bg-white shadow-sm text-left hover:border-gray-200 transition-all min-h-[44px]"
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Earned</p>
            <p className="text-xl font-medium text-green-600">${qbEarnings.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </button>
          <button
            onClick={() => onNavigate("reimbursements")}
            className="rounded-xl p-4 border border-gray-100 bg-white shadow-sm text-left hover:border-gray-200 transition-all min-h-[44px]"
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Owed to You</p>
            <p className="text-xl font-medium text-gray-500">${(summary?.approved_total || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </button>
          <button
            onClick={() => onNavigate("reimbursements")}
            className="rounded-xl p-4 border border-gray-100 bg-white shadow-sm text-left hover:border-gray-200 transition-all min-h-[44px]"
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Reimbursed</p>
            <p className="text-xl font-medium text-blue-600">${(summary?.paid_total || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Upcoming</p>
        {events.length === 0 ? (
          <div className="rounded-xl p-5 border border-gray-100 bg-white shadow-sm">
            <p className="text-sm text-gray-400 text-center">No upcoming events</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
            {events.map((ev) => (
              <div key={ev.id} className="px-5 py-3.5 flex items-center gap-3">
                <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap">
                  {formatDate(ev.event_date)}
                </span>
                <span className="text-sm text-gray-700 font-light truncate flex-1">{ev.title}</span>
                {ev.event_time && (
                  <span className="text-[10px] text-gray-300 shrink-0">{formatTime(ev.event_time)}</span>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onNavigate("schedule")}
          className="mt-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all min-h-[44px]"
        >
          View Calendar
        </button>
      </div>

      {/* Recent Messages */}
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Recent Messages</p>
        {threads.length === 0 ? (
          <div className="rounded-xl p-5 border border-gray-100 bg-white shadow-sm">
            <p className="text-sm text-gray-400 text-center">No messages yet</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
            {threads.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-start gap-3">
                {t.unread_count > 0 && <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t.unread_count > 0 ? "text-gray-900 font-medium" : "text-gray-600 font-light"}`}>
                    {t.subject}
                  </p>
                  {t.last_message && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{t.last_message}</p>
                  )}
                </div>
                <span className="text-[10px] text-gray-300 shrink-0 mt-0.5">{timeAgo(t.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onNavigate("updates")}
          className="mt-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all min-h-[44px]"
        >
          View All Messages
        </button>
      </div>

      {/* Needs Attention */}
      {(unsignedDocs > 0 || pendingExpenses > 0) && (
        <div className="rounded-xl p-5 border border-amber-200 bg-amber-50 shadow-sm space-y-2">
          <p className="text-sm font-medium text-amber-700 mb-2">Needs Attention</p>
          {unsignedDocs > 0 && (
            <button
              onClick={() => onNavigate("legal")}
              className="w-full text-left text-sm text-amber-600 hover:text-amber-700 transition-colors py-1 min-h-[44px] flex items-center"
            >
              {unsignedDocs} document{unsignedDocs > 1 ? "s" : ""} need{unsignedDocs === 1 ? "s" : ""} signing
            </button>
          )}
          {pendingExpenses > 0 && (
            <button
              onClick={() => onNavigate("reimbursements")}
              className="w-full text-left text-sm text-amber-600 hover:text-amber-700 transition-colors py-1 min-h-[44px] flex items-center"
            >
              {pendingExpenses} expense{pendingExpenses > 1 ? "s" : ""} pending review
            </button>
          )}
        </div>
      )}

      {/* Your Links */}
      {(links.length > 0 || role === "admin") && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Your Links</p>
            {role === "admin" && (
              <button
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showLinkForm ? "Cancel" : "+ Add Link"}
              </button>
            )}
          </div>

          {showLinkForm && role === "admin" && (
            <div className="rounded-xl p-4 border border-gray-100 bg-white shadow-sm mb-3 space-y-3">
              <select
                value={linkClientId}
                onChange={(e) => setLinkClientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 min-h-[44px]"
              >
                <option value="">Select client...</option>
                {allUsers.filter((u) => u.role !== "admin").map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Link title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 min-h-[44px]"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 min-h-[44px]"
              />
              <select
                value={linkCategory}
                onChange={(e) => setLinkCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 min-h-[44px]"
              >
                <option value="music">Music</option>
                <option value="social">Social</option>
                <option value="playlist">Playlist</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={handleAddLink}
                disabled={!linkTitle.trim() || !linkUrl.trim() || !linkClientId}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all disabled:opacity-30 min-h-[44px]"
              >
                Add Link
              </button>
            </div>
          )}

          {links.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <div key={link.id} className="relative group">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl p-4 border border-gray-100 bg-white shadow-sm hover:border-gray-200 transition-all min-h-[44px]"
                  >
                    <p className="text-sm text-gray-700 font-medium truncate">{link.title}</p>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 inline-block">{link.category}</span>
                  </a>
                  {role === "admin" && (
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("updates")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all min-h-[44px]"
          >
            Message Team
          </button>
          <a
            href="/portal/expenses"
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all min-h-[44px]"
          >
            Submit Expense
          </a>
          <a
            href="/portal/request"
            className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all min-h-[44px]"
          >
            Submit Request
          </a>
        </div>
      </div>
    </div>
  );
}
