"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Commission {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: string;
  original_name: string | null;
  submitted_at: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr + "T00:00:00Z") : new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CommissionsPage() {
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Commissions list
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch("/api/commissions");
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) { router.push("/portal"); return; }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setAuthed(true);
          setUserName(data.user.displayName || data.user.username);
          fetchCommissions();
        }
      })
      .catch(() => router.push("/portal"));
  }, [router, fetchCommissions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (amount) formData.append("amount", amount);
    if (file) formData.append("file", file);
    const res = await fetch("/api/commissions", { method: "POST", body: formData });
    if (res.ok) {
      setTitle(""); setDescription(""); setAmount(""); setFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchCommissions();
    }
    setSubmitting(false);
  }

  const statusColor = (s: string) => {
    if (s === "approved") return "text-green-600 bg-green-50";
    if (s === "rejected") return "text-red-600 bg-red-50";
    return "text-yellow-600 bg-yellow-50";
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-lg font-light text-gray-900 tracking-wide">Upload Commission</h1>
          <p className="text-xs text-gray-300 mt-1">{userName}</p>
        </div>

        {success && (
          <div className="text-center py-3 rounded-lg bg-green-50 animate-fade-in">
            <p className="text-xs text-green-600 tracking-wider uppercase">Commission uploaded</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Title *</label>
            <input type="text" placeholder="What is this commission for?" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
            <textarea placeholder="Additional details (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Document</label>
              <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
            {submitting ? "Uploading..." : "Upload Commission"}
          </button>
        </form>

        {commissions.length > 0 && (
          <div>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">Your Commissions</h2>
            <div className="space-y-2">
              {commissions.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-light text-gray-700">{c.title}</span>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
                      </div>
                      {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {c.amount != null && <span className="text-xs text-gray-500">{formatCurrency(c.amount)}</span>}
                        <span className="text-[10px] text-gray-300">{formatDate(c.submitted_at)}</span>
                      </div>
                    </div>
                    {c.original_name && (
                      <a href={`/api/commissions/${c.id}/download`} className="text-gray-300 hover:text-gray-500 transition-colors" title="Download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <a
        href="/portal/dashboard"
        className="mt-8 text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-[0.15em] uppercase"
      >
        &larr; Back to Dashboard
      </a>
    </div>
  );
}
