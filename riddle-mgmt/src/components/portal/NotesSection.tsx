"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

interface Thread {
  id: string;
  subject: string;
  client_id: string;
  client_name: string;
  created_by: string;
  creator_name: string;
  updated_at: string;
  last_message: string;
  unread_count: number;
  tags?: string | null;
  priority?: string | null;
}

interface Note {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  is_read: number;
  created_at: string;
}

interface NotesSectionProps {
  userId: string;
  role: string;
  allUsers: { id: string; username: string; display_name: string }[];
  onUnreadChange: (count: number) => void;
}

function safeDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00Z");
  if (dateStr.includes("T")) return new Date(dateStr);
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = safeDate(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotesSection({ userId, role, allUsers, onUnreadChange }: NotesSectionProps) {
  const onUnreadChangeRef = useRef(onUnreadChange);
  onUnreadChangeRef.current = onUnreadChange;

  const { data: threads, refresh: refreshThreads } = usePolling<Thread[]>(
    useCallback(async () => {
      const res = await fetch("/api/notes/threads");
      if (!res.ok) return [];
      const data = await res.json();
      const total = data.threads.reduce((sum: number, t: Thread) => sum + t.unread_count, 0);
      onUnreadChangeRef.current(total);
      return data.threads;
    }, []),
    5000
  );

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [googleDocs, setGoogleDocs] = useState<GoogleDoc[]>([]);
  const [docsConnected, setDocsConnected] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(true);

  useEffect(() => {
    fetch("/api/google-drive/docs")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setDocsConnected(data.connected);
          setGoogleDocs(data.docs || []);
        }
      })
      .catch(() => {});
  }, []);

  const threadList = threads || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  async function openThread(threadId: string) {
    setActiveThread(threadId);
    const res = await fetch(`/api/notes/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
      refreshThreads();
    }
  }

  async function handleReply() {
    if (!reply.trim() || !activeThread) return;
    setSending(true);
    const res = await fetch(`/api/notes/threads/${activeThread}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply }),
    });
    if (res.ok) {
      setReply("");
      openThread(activeThread);
    }
    setSending(false);
  }

  async function handleNewThread() {
    if (!newSubject.trim() || !newMessage.trim()) return;
    if (role === "admin" && !newClientId) return;
    setSending(true);
    const res = await fetch("/api/notes/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: newSubject,
        content: newMessage,
        clientId: role === "admin" ? newClientId : undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewSubject("");
      setNewMessage("");
      setNewClientId("");
      await refreshThreads();
      openThread(data.threadId);
    }
    setSending(false);
  }

  // Thread detail view
  if (activeThread) {
    const thread = threadList.find((t) => t.id === activeThread);
    return (
      <div className="animate-section-enter flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-160px)]">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <button
            onClick={() => { setActiveThread(null); setNotes([]); }}
            className="text-xs text-gray-400 hover:text-gray-500 transition-colors tracking-[0.15em] uppercase"
          >
            &larr; Back
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-600 font-light truncate">{thread?.subject}</span>
          {role === "admin" && thread && (
            <span className="text-[10px] text-gray-300 ml-auto shrink-0">{thread.client_name}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
          {notes.map((note) => {
            const isMe = note.author_id === userId;
            return (
              <div key={note.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isMe ? "bg-gray-100 rounded-br-sm" : "glass rounded-bl-sm"}`}>
                  <p className="text-[10px] text-gray-400 mb-1">{note.author_name}</p>
                  <p className="text-sm text-gray-700 font-light whitespace-pre-wrap">{note.content}</p>
                  <p className="text-[9px] text-gray-300 mt-2 text-right">{timeAgo(note.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <input
            type="text"
            placeholder="Type a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-light"
            autoFocus
          />
          <button
            onClick={handleReply}
            disabled={sending || !reply.trim()}
            className="px-5 py-3 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-section-enter">
      <SectionHeader
        title="Notes"
        action={role === "admin" ? { label: showNew ? "Cancel" : "+ New Thread", onClick: () => setShowNew(!showNew) } : undefined}
      />

      {/* New thread form — admin only */}
      {showNew && role === "admin" && (
        <div className="glass rounded-lg p-6 mb-6 space-y-4">
          {role === "admin" && (
            <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">New Thread</p>
          )}
          {role === "admin" && (
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Client</label>
              <select
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
              >
                <option value="" className="bg-white">Select a client...</option>
                {allUsers.filter((u) => u.username !== "seandefaria").map((u) => (
                  <option key={u.id} value={u.id} className="bg-white">
                    {u.display_name || u.username}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Subject</label>
            <input
              type="text"
              placeholder="Thread subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Message</label>
            <textarea
              placeholder="Write your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg text-sm font-light resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            {role !== "admin" && (
              <button onClick={() => setShowNew(false)} className="text-xs text-gray-400 hover:text-gray-500 transition-colors px-4 py-2">
                Cancel
              </button>
            )}
            <button
              onClick={handleNewThread}
              disabled={sending || !newSubject.trim() || !newMessage.trim()}
              className="px-5 py-2.5 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
            >
              Create Thread
            </button>
          </div>
        </div>
      )}

      {/* Documents section */}
      {docsConnected && googleDocs.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setDocsExpanded(!docsExpanded)}
            className="flex items-center gap-2 mb-3 w-full justify-center"
          >
            <span className="text-xs tracking-[0.2em] uppercase text-gray-400">
              Documents ({googleDocs.length})
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-gray-300 transition-transform ${docsExpanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {docsExpanded && (
            <div className="space-y-2">
              {googleDocs.map((doc, i) => (
                <a
                  key={doc.id}
                  href={doc.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass-elevated rounded-lg p-4 transition-all duration-200 hover:bg-gray-50 animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <span className="text-[9px] tracking-wider text-gray-400 font-medium">DOC</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 font-light truncate">{doc.name}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(doc.modifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 shrink-0">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents section only shows when connected — no prompt otherwise */}

      {/* Thread list */}
      {threadList.length === 0 && !showNew ? (
        <EmptyState title="No conversations yet" description="Start a new thread to begin messaging" />
      ) : (
        <div className="space-y-2">
          {threadList.map((thread, i) => (
            <button
              key={thread.id}
              onClick={() => openThread(thread.id)}
              className="w-full text-left glass-elevated rounded-lg p-4 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
            >
              <div className="flex items-start gap-3">
                {thread.unread_count > 0 && <div className="unread-dot mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${thread.unread_count > 0 ? "text-gray-900 font-medium" : "text-gray-600 font-light"}`}>
                      {thread.subject}
                    </p>
                    <span className="text-[10px] text-gray-300 shrink-0">{timeAgo(thread.updated_at)}</span>
                  </div>
                  {role === "admin" && (
                    <p className="text-[10px] text-gray-300 mt-0.5">{thread.client_name}</p>
                  )}
                  {(thread.tags || thread.priority) && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {thread.priority && thread.priority !== "normal" && (
                        <span className={`w-1.5 h-1.5 rounded-full ${thread.priority === "high" ? "bg-red-400" : "bg-blue-400"}`} />
                      )}
                      {thread.tags && (() => { try { return JSON.parse(thread.tags) as string[]; } catch { return []; } })().map((tag: string) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 tracking-wider">{tag}</span>
                      ))}
                    </div>
                  )}
                  {thread.last_message && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{thread.last_message}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
