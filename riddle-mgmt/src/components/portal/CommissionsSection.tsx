"use client";

import { useState, useCallback, useEffect } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface Commission {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: string;
  admin_notes: string | null;
  file_name: string | null;
  original_name: string | null;
  file_path: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  client_name?: string;
  submitter_name: string | null;
  submitter_email: string | null;
}

interface Summary {
  total_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
}

interface CommissionsSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr + "T00:00:00Z") : new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CommissionsSection({ role, allUsers, refreshSignal }: CommissionsSectionProps) {
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const qs = params.toString();
    return `/api/commissions${qs ? `?${qs}` : ""}`;
  }, [filterStatus]);

  const { data: apiData, refresh } = usePolling<{
    commissions: Commission[]; summary: Summary;
  }>(
    async () => {
      const res = await fetch(buildUrl());
      if (!res.ok) return { commissions: [], summary: null as unknown as Summary };
      return res.json();
    },
    8000
  );

  useEffect(() => {
    if (refreshSignal) refresh();
  }, [refreshSignal]);

  const commissions = apiData?.commissions || [];
  const summary = apiData?.summary || null;

  const statusColor = (s: string) => {
    if (s === "approved") return "text-green-600 bg-green-50";
    if (s === "rejected") return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    if (role === "admin" && !clientId) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (amount) formData.append("amount", amount);
    if (role === "admin" && clientId) formData.append("clientId", clientId);
    if (file) formData.append("file", file);
    const res = await fetch("/api/commissions", { method: "POST", body: formData });
    if (res.ok) {
      setTitle(""); setDescription(""); setAmount(""); setClientId(""); setFile(null);
      setShowForm(false);
      refresh();
    }
    setSubmitting(false);
  }

  async function handleReview(id: string, status: "approved" | "rejected" | "submitted") {
    await fetch(`/api/commissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: adminNotes || null }),
    });
    setReviewingId(null);
    setAdminNotes("");
    refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/commissions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      alert(`Delete failed (${res.status}): ${text.slice(0, 200)}`);
      return;
    }
    setConfirmDeleteId(null);
    refresh();
  }

  return (
    <div className="animate-section-enter">
      <SectionHeader title="Commissions" />

      {/* Summary */}
      {summary && (
        <div className="glass rounded-xl p-5 sm:p-8 text-center mb-6">
          <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase mb-2 sm:mb-3">Commission Uploads</p>
          <p className="text-3xl sm:text-5xl font-extralight tracking-tight text-gray-900">
            {summary.total_count}
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <button onClick={() => setFilterStatus("")} className="text-center group">
              <p className="text-[9px] sm:text-[10px] text-gray-300 tracking-[0.12em] uppercase group-hover:text-gray-400">Total</p>
              <p className="text-sm font-light text-gray-600 mt-0.5">{summary.total_count}</p>
            </button>
            <button onClick={() => setFilterStatus("submitted")} className="text-center group">
              <p className="text-[9px] sm:text-[10px] text-gray-300 tracking-[0.12em] uppercase group-hover:text-gray-400">Pending</p>
              <p className="text-sm font-light text-yellow-600 mt-0.5">{summary.pending_count}</p>
            </button>
            <button onClick={() => setFilterStatus("approved")} className="text-center group">
              <p className="text-[9px] sm:text-[10px] text-gray-300 tracking-[0.12em] uppercase group-hover:text-gray-400">Approved</p>
              <p className="text-sm font-light text-green-600 mt-0.5">{summary.approved_count}</p>
            </button>
            <button onClick={() => setFilterStatus("rejected")} className="text-center group">
              <p className="text-[9px] sm:text-[10px] text-gray-300 tracking-[0.12em] uppercase group-hover:text-gray-400">Rejected</p>
              <p className="text-sm font-light text-red-600 mt-0.5">{summary.rejected_count}</p>
            </button>
          </div>
          {summary.total_amount > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              Total value: {formatCurrency(summary.total_amount)}
            </p>
          )}
        </div>
      )}

      {/* Add commission button */}
      <div className="mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Upload Commission
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Upload Commission</p>

          {role === "admin" && (
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
              >
                <option value="">Select client...</option>
                {allUsers.filter(u => u.role !== "admin").map(u => (
                  <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Title *</label>
            <input
              type="text"
              placeholder="What is this commission for?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
            <textarea
              placeholder="Additional details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Document</label>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
          >
            {submitting ? "Uploading..." : "Upload Commission"}
          </button>
        </form>
      )}

      {/* Commission list */}
      {commissions.length === 0 ? (
        <EmptyState title="No commissions yet" description="Upload a commission to get started" />
      ) : (
        <div className="space-y-2">
          {commissions.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-light text-gray-700">{c.title}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {c.amount != null && (
                      <span className="text-xs text-gray-500">{formatCurrency(c.amount)}</span>
                    )}
                    <span className="text-[10px] text-gray-300">{formatDate(c.submitted_at)}</span>
                    {role === "admin" && c.client_name && (
                      <span className="text-[10px] text-gray-300">{c.client_name}</span>
                    )}
                    {c.submitter_name && (
                      <span className="text-[10px] text-gray-300">by {c.submitter_name}</span>
                    )}
                    {c.submitter_email && !c.submitter_name && (
                      <span className="text-[10px] text-gray-300">by {c.submitter_email}</span>
                    )}
                  </div>
                  {c.admin_notes && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">{c.admin_notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* File download */}
                  {c.original_name && (
                    <a
                      href={`/api/commissions/${c.id}/download`}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      title={c.original_name}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </a>
                  )}

                  {/* Review actions */}
                  {(role === "admin" || c.status === "submitted") && reviewingId !== c.id && (
                    <button
                      onClick={() => { setReviewingId(c.id); setAdminNotes(c.admin_notes || ""); }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      title="Review"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  {(role === "admin") && (
                    confirmDeleteId === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(c.id)} className="text-[9px] text-red-500 hover:text-red-700">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="text-gray-200 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Review panel */}
              {reviewingId === c.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-fade-in">
                  <textarea
                    placeholder="Notes (optional)"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    {c.status === "submitted" && (
                      <>
                        <button onClick={() => handleReview(c.id, "approved")} className="px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase bg-green-50 text-green-600 hover:bg-green-100">Approve</button>
                        <button onClick={() => handleReview(c.id, "rejected")} className="px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase bg-red-50 text-red-600 hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {c.status === "approved" && (
                      <button onClick={() => handleReview(c.id, "submitted")} className="px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100">Revert to Pending</button>
                    )}
                    {c.status === "rejected" && role === "admin" && (
                      <button onClick={() => handleReview(c.id, "submitted")} className="px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100">Revert to Pending</button>
                    )}
                    <button onClick={() => { setReviewingId(null); setAdminNotes(""); }} className="px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase text-gray-400 hover:text-gray-600">Cancel</button>
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
