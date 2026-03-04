"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["travel", "equipment", "meals", "studio", "marketing", "other"];

interface Expense {
  id: string;
  amount: number;
  description: string;
  vendor: string | null;
  category: string;
  status: string;
  receipt_original_name: string | null;
  submitted_at: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr + "T00:00:00Z") : new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ExpensesPage() {
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Expenses list
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/reimbursements");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.reimbursements || []);
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
          fetchExpenses();
        }
      })
      .catch(() => router.push("/portal"));
  }, [router, fetchExpenses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("category", category);
    if (vendor) formData.append("vendor", vendor);
    if (receipt) formData.append("receipt", receipt);
    const res = await fetch("/api/reimbursements", { method: "POST", body: formData });
    if (res.ok) {
      setAmount(""); setVendor(""); setDescription(""); setCategory("other"); setReceipt(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchExpenses();
    }
    setSubmitting(false);
  }

  const statusColor = (s: string) => {
    if (s === "paid") return "text-green-600 bg-green-50";
    if (s === "rejected") return "text-red-600 bg-red-50";
    if (s === "approved") return "text-blue-600 bg-blue-50";
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-lg font-light text-gray-900 tracking-wide">Submit Expense</h1>
          <p className="text-xs text-gray-300 mt-1">{userName}</p>
        </div>

        {/* Success message */}
        {success && (
          <div className="text-center py-3 rounded-lg bg-green-50 animate-fade-in">
            <p className="text-xs text-green-600 tracking-wider uppercase">Expense submitted</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Vendor</label>
              <input type="text" placeholder="e.g. Uber" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
            <input type="text" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Receipt</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
            {submitting ? "Submitting..." : "Submit Expense"}
          </button>
        </form>

        {/* Submitted expenses list */}
        {expenses.length > 0 && (
          <div>
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">Your Expenses</h2>
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-light text-gray-700">{formatCurrency(exp.amount)}</span>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(exp.status)}`}>{exp.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{exp.vendor || exp.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-300">{formatDate(exp.submitted_at)}</span>
                        <span className="text-[10px] text-gray-300 uppercase">{exp.category}</span>
                      </div>
                    </div>
                    {exp.receipt_original_name && (
                      <a href={`/api/reimbursements/${exp.id}/receipt`} className="text-gray-300 hover:text-gray-500 transition-colors" title="Receipt">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
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
