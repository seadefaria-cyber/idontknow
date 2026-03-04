"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = ["travel", "equipment", "meals", "studio", "marketing", "other"];

interface Client {
  id: string;
  name: string;
}

export default function SubmitExpensePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientId || !amount || !description || !submitterName) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("submitterName", submitterName);
    if (submitterEmail) formData.append("submitterEmail", submitterEmail);
    if (vendor) formData.append("vendor", vendor);
    if (receipt) formData.append("receipt", receipt);

    try {
      const res = await fetch("/api/public/expenses", { method: "POST", body: formData });
      if (res.ok) {
        setClientId(""); setAmount(""); setVendor(""); setDescription("");
        setCategory("other"); setSubmitterName(""); setSubmitterEmail("");
        setReceipt(null); setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-light text-gray-900 tracking-wide">Expense Submitted</h1>
            <p className="text-xs text-gray-400 mt-2">Your expense has been submitted for review.</p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors"
          >
            Submit Another
          </button>
        </div>
        <Link
          href="/portal"
          className="mt-12 text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-[0.15em] uppercase"
        >
          &larr; Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase mb-3">Riddle MGMT</p>
          <h1 className="text-lg font-light text-gray-900 tracking-wide">Submit an Expense</h1>
          <p className="text-xs text-gray-400 mt-2">Submit an expense for reimbursement</p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Your info */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">Your Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Your Name *</label>
                <input type="text" placeholder="Full name" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Your Email</label>
                <input type="email" placeholder="email@example.com" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
              </div>
            </div>
          </div>

          {/* Client selection */}
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Submit To *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Expense details */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">Expense Details</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($) *</label>
                  <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-wide block mb-2">Vendor</label>
                  <input type="text" placeholder="e.g. Uber" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Description *</label>
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
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
            {submitting ? "Submitting..." : "Submit Expense"}
          </button>
        </form>
      </div>

      <Link
        href="/portal"
        className="mt-12 text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-[0.15em] uppercase"
      >
        &larr; Back
      </Link>
    </div>
  );
}
