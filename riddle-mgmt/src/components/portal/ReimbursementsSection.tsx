"use client";

import { useState, useCallback, useEffect } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

// --- Interfaces ---

interface Reimbursement {
  id: string;
  client_id: string;
  amount: number;
  description: string;
  vendor: string | null;
  category: string;
  status: string;
  admin_notes: string | null;
  project: string | null;
  created_by: string | null;
  receipt_original_name: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  client_name?: string;
  submitter_name: string | null;
  submitter_email: string | null;
}

interface Summary {
  pending_total: number;
  approved_total: number;
  paid_total: number;
  rejected_total: number;
  grand_total: number;
  total_count: number;
  pending_count: number;
  approved_count: number;
  paid_count: number;
  rejected_count: number;
}

interface CategoryBreakdown { category: string; total: number; count: number; }

interface QBExpense {
  id: string; qb_id: string; txn_date: string; total_amount: number;
  payment_type: string | null; vendor_name: string | null;
  account_name: string | null; memo: string | null;
}

interface QBInvoice {
  id: string; qb_id: string; txn_date: string; due_date: string | null;
  total_amount: number; balance: number; customer_name: string | null;
  doc_number: string | null; memo: string | null; status: string;
  invoice_link: string | null;
}

interface QBPayment {
  id: string; qb_id: string; txn_date: string; total_amount: number;
  customer_name: string | null; payment_method: string | null;
  memo: string | null; status: string;
}

interface QBCustomer {
  id: string; qb_id: string; display_name: string | null;
  company_name: string | null; email: string | null; phone: string | null;
  balance: number; active: number;
}

interface QBBill {
  id: string; qb_id: string; txn_date: string; due_date: string | null;
  total_amount: number; balance: number; vendor_name: string | null; memo: string | null;
}

interface QBData {
  connected: boolean; company_name?: string; realm_id?: string;
  expenses: QBExpense[]; invoices: QBInvoice[];
  payments: QBPayment[]; customers: QBCustomer[]; bills: QBBill[];
}

interface ReimbursementsSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  userId?: string;
  refreshSignal?: number;
}

type FinanceView = "earnings" | "spending" | "owed" | "pending" | "reimbursed";

const CATEGORIES = ["travel", "equipment", "meals", "studio", "marketing", "other"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function safeDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00Z");
  if (dateStr.includes("T")) return new Date(dateStr);
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function formatDate(dateStr: string): string {
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string): string {
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Main Component ---

export default function ReimbursementsSection({ role, allUsers, userId, refreshSignal }: ReimbursementsSectionProps) {
  const [view, setView] = useState<FinanceView>("earnings");

  // Expense form state (admin)
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [project, setProject] = useState("");
  const [clientId, setClientId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<string>("all");
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);

  async function handleDeleteExpense(id: string) {
    await fetch(`/api/reimbursements/${id}`, { method: "DELETE" });
    setConfirmDeleteExpenseId(null);
    refresh();
  }

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterStatus) params.set("status", filterStatus);
    const qs = params.toString();
    return `/api/reimbursements${qs ? `?${qs}` : ""}`;
  }, [filterCategory, filterStatus]);

  const { data: apiData, refresh } = usePolling<{
    reimbursements: Reimbursement[]; summary: Summary; categoryBreakdown: CategoryBreakdown[];
  }>(
    async () => {
      const res = await fetch(buildUrl());
      if (!res.ok) return { reimbursements: [], summary: null as unknown as Summary, categoryBreakdown: [] };
      return res.json();
    },
    8000
  );

  const { data: qbData } = usePolling<QBData>(
    async () => {
      try {
        const res = await fetch("/api/quickbooks/expenses");
        if (!res.ok) return { connected: false, expenses: [], invoices: [], payments: [], customers: [], bills: [] };
        return res.json();
      } catch {
        return { connected: false, expenses: [], invoices: [], payments: [], customers: [], bills: [] };
      }
    },
    8000
  );

  // Re-fetch when refresh signal changes
  useEffect(() => {
    if (refreshSignal) {
      refresh();
    }
  }, [refreshSignal]);

  const expenses = apiData?.reimbursements || [];
  const summary = apiData?.summary || null;
  const qb: QBData = qbData || { connected: false, expenses: [], invoices: [], payments: [], customers: [], bills: [] };

  // Filter out unapplied/voided payments — they're bookkeeping artifacts, not real earnings
  const activePayments = qb.payments.filter(p => p.status !== "voided" && p.status !== "unapplied");

  // Totals
  const totalEarnings = activePayments.reduce((s, p) => s + p.total_amount, 0);
  const activeInvoices = qb.invoices.filter(inv => inv.status !== "voided");
  const totalInvoiced = activeInvoices.reduce((s, inv) => s + inv.total_amount, 0);
  const totalOutstanding = activeInvoices.filter(i => i.status === "open" || i.status === "overdue").reduce((s, i) => s + i.balance, 0);
  const totalSpending = qb.expenses.reduce((s, e) => s + e.total_amount, 0) + (summary?.paid_total || 0);
  const totalReimbursed = (summary?.approved_total || 0) + (summary?.paid_total || 0);
  const netCash = totalEarnings - totalSpending;

  const statusColor = (s: string) => {
    if (s === "paid" || s === "completed") return "text-green-600 bg-green-50";
    if (s === "overdue" || s === "rejected") return "text-red-600 bg-red-50";
    if (s === "voided") return "text-gray-300 bg-gray-50 line-through";
    if (s === "submitted" || s === "unapplied") return "text-yellow-600 bg-yellow-50";
    if (s === "approved") return "text-blue-600 bg-blue-50";
    return "text-blue-600 bg-blue-50";
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description) return;
    if (role === "admin" && !clientId) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("category", category);
    if (vendor) formData.append("vendor", vendor);
    if (project && role === "admin") formData.append("project", project);
    if (role === "admin" && clientId) formData.append("clientId", clientId);
    if (receipt) formData.append("receipt", receipt);
    const res = await fetch("/api/reimbursements", { method: "POST", body: formData });
    if (res.ok) {
      setAmount(""); setVendor(""); setDescription(""); setCategory("other"); setProject(""); setClientId(""); setReceipt(null);
      setShowExpenseForm(false);
      refresh();
    }
    setSubmitting(false);
  }

  async function handleReview(id: string, status: "approved" | "rejected" | "paid" | "submitted") {
    await fetch(`/api/reimbursements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: adminNotes || null }),
    });
    setReviewingId(null);
    setAdminNotes("");
    refresh();
  }

  return (
    <div className="animate-section-enter">
      <SectionHeader title="Finances" />

      {/* Hero — Net Position */}
      <div className="glass rounded-xl p-5 sm:p-8 text-center mb-6">
        <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase mb-2 sm:mb-3">Net Cash Flow</p>
        <p className={`text-3xl sm:text-5xl font-extralight tracking-tight ${netCash >= 0 ? "text-green-600" : "text-red-600"}`}>
          {netCash >= 0 ? "+" : ""}{formatCurrency(netCash)}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 mt-4 sm:mt-5">
          <button onClick={() => setView("earnings")} className="py-3 sm:py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer group text-center">
            <p className="text-[10px] sm:text-[10px] text-gray-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">Earned</p>
            <p className="text-base sm:text-lg font-light text-green-600 mt-0.5 group-hover:text-green-700 transition-colors">{formatCurrency(totalEarnings)}</p>
          </button>
          <button onClick={() => setView("spending")} className="py-3 sm:py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer group text-center">
            <p className="text-[10px] sm:text-[10px] text-gray-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">Spent</p>
            <p className="text-base sm:text-lg font-light text-red-600 mt-0.5 group-hover:text-red-700 transition-colors">{formatCurrency(totalSpending)}</p>
          </button>
          <button onClick={() => setView("owed")} className="py-3 sm:py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer group text-center">
            <p className="text-[10px] sm:text-[10px] text-gray-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">Owed</p>
            <p className="text-base sm:text-lg font-light text-yellow-600 mt-0.5 group-hover:text-yellow-700 transition-colors">{formatCurrency(totalOutstanding)}</p>
          </button>
          <button onClick={() => setView("pending")} className="py-3 sm:py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer group text-center">
            <p className="text-[10px] sm:text-[10px] text-gray-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">Pending</p>
            <p className="text-base sm:text-lg font-light text-orange-500 mt-0.5 group-hover:text-orange-600 transition-colors">{formatCurrency(summary?.pending_total || 0)}</p>
          </button>
          <button onClick={() => setView("reimbursed")} className="py-3 sm:py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer group text-center">
            <p className="text-[10px] sm:text-[10px] text-gray-300 tracking-[0.15em] sm:tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">Reimburse</p>
            <p className="text-base sm:text-lg font-light text-blue-600 mt-0.5 group-hover:text-blue-700 transition-colors">{formatCurrency(totalReimbursed)}</p>
          </button>
        </div>
      </div>
      {role === "admin" && view === "spending" && (
        <div className="mb-4">
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Expense
          </button>
        </div>
      )}

      {/* Admin expense form */}
      {showExpenseForm && role === "admin" && (
        <form onSubmit={handleSubmit} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Add Expense</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Vendor</label>
              <input type="text" placeholder="e.g. Uber" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                {CATEGORIES.map((c) => <option key={c} value={c} className="bg-white">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                <option value="" className="bg-white">Select client...</option>
                {allUsers.filter((u) => u.role !== "admin").map((u) => (
                  <option key={u.id} value={u.id} className="bg-white">{u.display_name || u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
              <input type="text" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Project (optional)</label>
              <input type="text" placeholder="e.g. Tour 2026" value={project} onChange={(e) => setProject(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Receipt</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
              {submitting ? "Submitting..." : "Add Expense"}
            </button>
            <button type="button" onClick={() => setShowExpenseForm(false)} className="px-6 py-3 rounded-lg text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-gray-500 border border-gray-200 transition-all">Cancel</button>
          </div>
        </form>
      )}

      {/* === EARNINGS VIEW === */}
      {view === "earnings" && (
        <div className="space-y-6 animate-section-enter">
          {/* Payments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Payments Received</h3>
              <span className="text-sm font-light text-green-600">{formatCurrency(totalEarnings)}</span>
            </div>
            {activePayments.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center"><p className="text-sm text-gray-300 font-light">No payments yet</p></div>
            ) : (
              <div className="space-y-2">
                {activePayments.map((pay, i) => (
                  <div key={pay.id} className="glass-elevated rounded-lg p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-light ${pay.status === "voided" ? "text-gray-300 line-through" : "text-green-600"}`}>
                            +{formatCurrencyFull(pay.total_amount)}
                          </span>
                          {pay.status && pay.status !== "completed" && (
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(pay.status)}`}>{pay.status}</span>
                          )}
                        </div>
                        {pay.customer_name && <p className="text-sm text-gray-500 mt-1">{pay.customer_name}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          {pay.payment_method && <span className="text-[10px] text-gray-300 uppercase tracking-wider">{pay.payment_method}</span>}
                          {pay.txn_date && <span className="text-[10px] text-gray-300">{formatDate(pay.txn_date)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Invoices</h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-gray-300">{formatCurrency(totalInvoiced)} invoiced</span>
                {totalOutstanding > 0 && <span className="text-[10px] text-yellow-500">{formatCurrency(totalOutstanding)} outstanding</span>}
              </div>
            </div>
            {activeInvoices.length === 0 ? (
              <div className="glass rounded-lg p-6 text-center"><p className="text-sm text-gray-300 font-light">No invoices yet</p></div>
            ) : (
              <div className="space-y-2">
                {activeInvoices.map((inv, i) => (
                  <div
                    key={inv.id}
                    className="glass-elevated rounded-lg animate-fade-in cursor-pointer hover:bg-gray-50 transition-all"
                    style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}
                    onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-base font-light ${inv.status === "voided" ? "text-gray-300 line-through" : "text-gray-700"}`}>
                              {formatCurrencyFull(inv.total_amount)}
                            </span>
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(inv.status)}`}>
                              {inv.status}
                            </span>
                            {inv.doc_number && <span className="text-[10px] text-gray-300 font-mono">#{inv.doc_number}</span>}
                          </div>
                          {inv.customer_name && <p className="text-sm text-gray-500 mt-1">{inv.customer_name}</p>}
                          <div className="flex items-center gap-3 mt-1.5">
                            {inv.txn_date && <span className="text-[10px] text-gray-300">{formatDate(inv.txn_date)}</span>}
                            {inv.due_date && <span className="text-[10px] text-gray-300">Due {formatShortDate(inv.due_date)}</span>}
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`text-gray-300 transition-transform ${expandedInvoice === inv.id ? "rotate-180" : ""}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Invoice Preview */}
                    {expandedInvoice === inv.id && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 animate-fade-in">
                        <div className="pt-4 space-y-4">
                          {/* Invoice header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Invoice</p>
                              <p className="text-lg font-light text-gray-900">{inv.doc_number ? `#${inv.doc_number}` : `INV-${inv.qb_id}`}</p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-wider px-3 py-1 rounded-full ${statusColor(inv.status)}`}>
                              {inv.status}
                            </span>
                          </div>

                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {inv.customer_name && (
                              <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Client</p>
                                <p className="text-sm text-gray-600 font-light">{inv.customer_name}</p>
                              </div>
                            )}
                            {inv.txn_date && (
                              <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Issued</p>
                                <p className="text-sm text-gray-600 font-light">{formatDate(inv.txn_date)}</p>
                              </div>
                            )}
                            {inv.due_date && (
                              <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Due Date</p>
                                <p className="text-sm text-gray-600 font-light">{formatDate(inv.due_date)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Amount</p>
                              <p className="text-sm text-gray-600 font-light">{formatCurrencyFull(inv.total_amount)}</p>
                            </div>
                            {inv.balance > 0 && (
                              <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Balance Due</p>
                                <p className="text-sm text-yellow-600 font-light">{formatCurrencyFull(inv.balance)}</p>
                              </div>
                            )}
                          </div>

                          {inv.memo && (
                            <div>
                              <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Notes</p>
                              <p className="text-xs text-gray-400 font-light">{inv.memo}</p>
                            </div>
                          )}

                          {/* View in QuickBooks link */}
                          {inv.invoice_link && (
                            <a
                              href={inv.invoice_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors pt-2"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              View Full Invoice
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === SPENDING VIEW === */}
      {view === "spending" && (
        <div className="space-y-6 animate-section-enter">
          {/* Filter pills */}
          {expenses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setFilterCategory(""); setFilterStatus(""); }} className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${!filterCategory && !filterStatus ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-500"}`}>All</button>
              {["submitted", "approved", "paid", "rejected"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)} className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${filterStatus === s ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-500"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Expenses list */}
          {(() => {
            const allItems = [
              ...expenses.map(r => ({ type: "portal" as const, id: r.id, date: r.submitted_at, amount: r.amount, title: r.vendor || r.description, subtitle: r.description, status: r.status, category: r.category, notes: r.admin_notes, receipt: r.receipt_original_name, clientName: r.client_name, raw: r })),
              ...(qb.connected && !filterCategory && !filterStatus
                ? qb.expenses.map(e => ({ type: "qb" as const, id: e.id, date: e.txn_date, amount: e.total_amount, title: e.vendor_name || "Expense", subtitle: e.memo, status: "paid" as string, category: null as string | null, notes: null as string | null, receipt: null as string | null, clientName: null as string | null, raw: null as Reimbursement | null }))
                : []),
            ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

            if (allItems.length === 0) {
              return <EmptyState title="No expenses yet" description="Your expenses will appear here" />;
            }

            return (
              <div className="space-y-2">
                {allItems.map((item, i) => {
                  const expKey = `${item.type}-${item.id}`;
                  const isExpanded = expandedExpense === expKey;
                  // For QB items, get the raw QB expense for extra details
                  const qbExpense = item.type === "qb" ? qb.expenses.find(e => e.id === item.id) : null;
                  const qbLink = item.type === "qb" && qbExpense
                    ? `https://app.qbo.intuit.com/app/expense?txnId=${qbExpense.qb_id}`
                    : null;

                  return (
                    <div
                      key={expKey}
                      className="glass-elevated rounded-lg animate-fade-in cursor-pointer hover:bg-gray-50 transition-all"
                      style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}
                      onClick={() => setExpandedExpense(isExpanded ? null : expKey)}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-light text-red-600">-{formatCurrencyFull(item.amount)}</span>
                              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>
                                {item.status}
                              </span>
                              {item.category && (
                                <span className="text-[9px] uppercase tracking-wider text-gray-300">{item.category}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.title}</p>
                            {!isExpanded && item.subtitle && item.subtitle !== item.title && (
                              <p className="text-xs text-gray-300 mt-0.5 truncate">{item.subtitle}</p>
                            )}
                            {!isExpanded && (
                              <div className="flex items-center gap-3 mt-1.5">
                                {item.date && <span className="text-[10px] text-gray-300">{formatDate(item.date)}</span>}
                                {role === "admin" && item.clientName && <span className="text-[10px] text-gray-300">{item.clientName}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.receipt && (
                              <a href={`/api/reimbursements/${item.id}/receipt`} onClick={(e) => e.stopPropagation()} className="text-gray-300 hover:text-gray-500 transition-colors" title="Receipt">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              </a>
                            )}
                            {((role === "admin" && item.raw && (item.status === "submitted" || item.status === "approved")) || (role !== "admin" && item.raw && (item.status === "submitted" || item.status === "approved"))) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setReviewingId(reviewingId === item.id ? null : item.id); setAdminNotes(""); }}
                                className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded details — matches invoice expand style */}
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <div className="pt-4 space-y-4">
                            {/* Expense header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Expense</p>
                                <p className="text-lg font-light text-gray-900">{formatCurrencyFull(item.amount)}</p>
                              </div>
                              <span className={`text-[9px] uppercase tracking-wider px-3 py-1 rounded-full ${statusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>

                            {/* Submitter identity (external submissions) */}
                            {item.raw?.submitter_name && (
                              <div className="bg-blue-50 rounded-lg px-3 py-2">
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">Submitted by</p>
                                <p className="text-sm text-blue-700 font-light">
                                  {item.raw.submitter_name}
                                  {item.raw.submitter_email && (
                                    <span className="text-blue-400 ml-1">({item.raw.submitter_email})</span>
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-4">
                              {item.date && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Date</p>
                                  <p className="text-sm text-gray-600 font-light">{formatDate(item.date)}</p>
                                </div>
                              )}
                              {item.title && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Vendor</p>
                                  <p className="text-sm text-gray-600 font-light">{item.title}</p>
                                </div>
                              )}
                              {item.category && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Category</p>
                                  <p className="text-sm text-gray-600 font-light capitalize">{item.category}</p>
                                </div>
                              )}
                              {qbExpense?.payment_type && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Payment Type</p>
                                  <p className="text-sm text-gray-600 font-light capitalize">{qbExpense.payment_type}</p>
                                </div>
                              )}
                              {qbExpense?.account_name && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Account</p>
                                  <p className="text-sm text-gray-600 font-light">{qbExpense.account_name}</p>
                                </div>
                              )}
                              {role === "admin" && item.clientName && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Client</p>
                                  <p className="text-sm text-gray-600 font-light">{item.clientName}</p>
                                </div>
                              )}
                            </div>

                            {/* Description/memo */}
                            {(item.subtitle || qbExpense?.memo) && (
                              <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Description</p>
                                <p className="text-xs text-gray-400 font-light">{item.subtitle || qbExpense?.memo}</p>
                              </div>
                            )}

                            {item.notes && <p className="text-[10px] text-gray-300 italic">Note: {item.notes}</p>}

                            {/* View Full Invoice link */}
                            {qbLink && (
                              <a
                                href={qbLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors pt-2"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                View Full Invoice
                              </a>
                            )}
                            {item.receipt && (
                              <a
                                href={`/api/reimbursements/${item.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors pt-2"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                View Receipt
                              </a>
                            )}

                            {/* Delete expense */}
                            {item.raw && (
                              confirmDeleteExpenseId === item.id ? (
                                <div className="flex items-center gap-2 pt-2">
                                  <button onClick={() => handleDeleteExpense(item.id)} className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all">Confirm Delete</button>
                                  <button onClick={() => setConfirmDeleteExpenseId(null)} className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-500 transition-all">Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteExpenseId(item.id)}
                                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-red-500 transition-colors pt-2"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                  Delete
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {reviewingId === item.id && item.raw && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 space-y-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <div className="pt-4">
                            <input type="text" placeholder="Notes (optional)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="w-full px-4 py-2 rounded-lg text-sm font-light" />
                          </div>
                          <div className="flex gap-3">
                            {item.status === "submitted" && (
                              <button onClick={() => handleReview(item.id, "approved")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all">Approve</button>
                            )}
                            {item.status === "approved" && role === "admin" && (
                              <button onClick={() => handleReview(item.id, "paid")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all">Mark as Paid</button>
                            )}
                            {item.status === "approved" && role !== "admin" && (
                              <button onClick={() => handleReview(item.id, "submitted")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">Undo Approval</button>
                            )}
                            <button onClick={() => handleReview(item.id, "rejected")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-red-50 text-red-600 hover:bg-red-100 transition-all">Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Bills */}
          {qb.bills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Bills</h3>
                <span className="text-[10px] text-gray-300">{formatCurrency(qb.bills.reduce((s, b) => s + b.balance, 0))} outstanding</span>
              </div>
              <div className="space-y-2">
                {qb.bills.map((bill, i) => {
                  const isOverdue = bill.due_date && bill.balance > 0 && new Date(bill.due_date) < new Date();
                  return (
                    <div key={bill.id} className="glass-elevated rounded-lg p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-light text-gray-700">{formatCurrencyFull(bill.total_amount)}</span>
                            {bill.balance === 0 && <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor("paid")}`}>Paid</span>}
                            {isOverdue && <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor("overdue")}`}>Overdue</span>}
                          </div>
                          {bill.vendor_name && <p className="text-sm text-gray-500 mt-1">{bill.vendor_name}</p>}
                          <div className="flex items-center gap-3 mt-1.5">
                            {bill.txn_date && <span className="text-[10px] text-gray-300">{formatDate(bill.txn_date)}</span>}
                            {bill.due_date && <span className="text-[10px] text-gray-300">Due {formatShortDate(bill.due_date)}</span>}
                            {bill.balance > 0 && bill.balance < bill.total_amount && (
                              <span className="text-[10px] text-orange-500">Balance: {formatCurrencyFull(bill.balance)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === OWED VIEW === */}
      {view === "owed" && (
        <div className="space-y-6 animate-section-enter">
          {/* Outstanding invoices */}
          {(() => {
            const owedInvoices = activeInvoices.filter(i => (i.status === "open" || i.status === "overdue") && i.balance > 0);
            const owedBills = qb.bills.filter(b => b.balance > 0);

            if (owedInvoices.length === 0 && owedBills.length === 0) {
              return <EmptyState title="Nothing owed" description="All invoices and bills are settled" />;
            }

            return (
              <>
                {owedInvoices.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Outstanding Invoices</h3>
                      <span className="text-sm font-light text-yellow-600">{formatCurrency(owedInvoices.reduce((s, i) => s + i.balance, 0))}</span>
                    </div>
                    <div className="space-y-2">
                      {owedInvoices.map((inv, i) => (
                        <div
                          key={inv.id}
                          className="glass-elevated rounded-lg animate-fade-in cursor-pointer hover:bg-gray-50 transition-all"
                          style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}
                          onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                        >
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-light text-yellow-600">{formatCurrencyFull(inv.balance)}</span>
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(inv.status)}`}>{inv.status}</span>
                                  {inv.doc_number && <span className="text-[10px] text-gray-300 font-mono">#{inv.doc_number}</span>}
                                </div>
                                {inv.customer_name && <p className="text-sm text-gray-500 mt-1">{inv.customer_name}</p>}
                                <div className="flex items-center gap-3 mt-1.5">
                                  {inv.txn_date && <span className="text-[10px] text-gray-300">{formatDate(inv.txn_date)}</span>}
                                  {inv.due_date && <span className="text-[10px] text-gray-300">Due {formatShortDate(inv.due_date)}</span>}
                                </div>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`text-gray-300 transition-transform ${expandedInvoice === inv.id ? "rotate-180" : ""}`}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                          {expandedInvoice === inv.id && (
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 animate-fade-in">
                              <div className="pt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Total</p>
                                  <p className="text-sm text-gray-600 font-light">{formatCurrencyFull(inv.total_amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Balance Due</p>
                                  <p className="text-sm text-yellow-600 font-light">{formatCurrencyFull(inv.balance)}</p>
                                </div>
                                {inv.memo && (
                                  <div className="col-span-2">
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Notes</p>
                                    <p className="text-xs text-gray-400 font-light">{inv.memo}</p>
                                  </div>
                                )}
                              </div>
                              {inv.invoice_link && (
                                <a
                                  href={inv.invoice_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors pt-3"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  View Invoice
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {owedBills.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Unpaid Bills</h3>
                      <span className="text-sm font-light text-yellow-600">{formatCurrency(owedBills.reduce((s, b) => s + b.balance, 0))}</span>
                    </div>
                    <div className="space-y-2">
                      {owedBills.map((bill, i) => {
                        const isOverdue = bill.due_date && new Date(bill.due_date) < new Date();
                        return (
                          <div key={bill.id} className="glass-elevated rounded-lg p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-light text-yellow-600">{formatCurrencyFull(bill.balance)}</span>
                                  {isOverdue && <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor("overdue")}`}>Overdue</span>}
                                </div>
                                {bill.vendor_name && <p className="text-sm text-gray-500 mt-1">{bill.vendor_name}</p>}
                                <div className="flex items-center gap-3 mt-1.5">
                                  {bill.txn_date && <span className="text-[10px] text-gray-300">{formatDate(bill.txn_date)}</span>}
                                  {bill.due_date && <span className="text-[10px] text-gray-300">Due {formatShortDate(bill.due_date)}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* === PENDING VIEW === */}
      {view === "pending" && (
        <div className="space-y-6 animate-section-enter">
          {/* Client expense upload form */}
          {role !== "admin" && (
            <div>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors flex items-center gap-1 mb-4"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Submit Expense
              </button>
              {showExpenseForm && (
                <form onSubmit={handleSubmit} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Submit Expense for Reimbursement</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
                      <input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 tracking-wide block mb-2">Vendor</label>
                      <input type="text" placeholder="e.g. Uber" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
                    <input type="text" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs text-gray-400 tracking-wide block mb-2">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                        {CATEGORIES.map((c) => <option key={c} value={c} className="bg-white">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 tracking-wide block mb-2">Receipt</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
                      {submitting ? "Submitting..." : "Submit Expense"}
                    </button>
                    <button type="button" onClick={() => setShowExpenseForm(false)} className="px-6 py-3 rounded-lg text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-gray-500 border border-gray-200 transition-all">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {(() => {
            const pendingInvoices = activeInvoices.filter(i => i.status === "sent" || i.status === "delivered");
            const pendingExpenses = expenses.filter(r => r.status === "submitted");

            // Build all pending items with normalized categories from both QB and portal
            const allPendingItems = [
              ...pendingInvoices.map(inv => ({
                type: "invoice" as const,
                id: inv.id,
                amount: inv.total_amount,
                title: inv.customer_name || `Invoice #${inv.doc_number || inv.qb_id}`,
                subtitle: inv.memo,
                date: inv.txn_date,
                dueDate: inv.due_date,
                status: inv.status,
                category: "invoices",
                docNumber: inv.doc_number,
                raw: null as Reimbursement | null,
              })),
              ...pendingExpenses.map(r => ({
                type: "expense" as const,
                id: r.id,
                amount: r.amount,
                title: r.vendor || r.description,
                subtitle: r.description !== (r.vendor || r.description) ? r.description : null,
                date: r.submitted_at,
                dueDate: null as string | null,
                status: r.status,
                category: r.category || "other",
                docNumber: null as string | null,
                raw: r,
              })),
            ];

            // Auto-derive category list from the data
            const categorySet = new Set(allPendingItems.map(item => item.category));
            const categories = ["all", ...Array.from(categorySet).sort()];

            // Filter by selected category
            const filteredItems = pendingCategory === "all"
              ? allPendingItems
              : allPendingItems.filter(item => item.category === pendingCategory);

            const totalPending = filteredItems.reduce((s, item) => s + item.amount, 0);

            if (allPendingItems.length === 0) {
              return <EmptyState title="Nothing pending" description="No pending invoices or expenses" />;
            }

            return (
              <>
                {/* Category sub-tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => {
                    const count = cat === "all" ? allPendingItems.length : allPendingItems.filter(item => item.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setPendingCategory(cat)}
                        className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${
                          pendingCategory === cat ? "bg-gray-100 text-gray-900" : "bg-white text-gray-400 hover:text-gray-500"
                        }`}
                      >
                        {cat === "all" ? "All" : cat} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">
                    {pendingCategory === "all" ? "All Pending" : pendingCategory.charAt(0).toUpperCase() + pendingCategory.slice(1)}
                  </h3>
                  <span className="text-sm font-light text-blue-600">{formatCurrency(totalPending)}</span>
                </div>

                <div className="space-y-2">
                  {filteredItems.map((item, i) => (
                    <div key={`${item.type}-${item.id}`} className="glass-elevated rounded-lg p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-light text-blue-600">{formatCurrencyFull(item.amount)}</span>
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>{item.status}</span>
                            {item.type === "invoice" && item.docNumber && <span className="text-[10px] text-gray-300 font-mono">#{item.docNumber}</span>}
                            {item.type === "expense" && item.category !== "other" && (
                              <span className="text-[9px] uppercase tracking-wider text-gray-300">{item.category}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{item.title}</p>
                          {item.subtitle && item.subtitle !== item.title && (
                            <p className="text-xs text-gray-300 mt-0.5 truncate">{item.subtitle}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            {item.date && <span className="text-[10px] text-gray-300">{formatDate(item.date)}</span>}
                            {item.dueDate && <span className="text-[10px] text-gray-300">Due {formatShortDate(item.dueDate)}</span>}
                          </div>
                        </div>
                        {((role === "admin" && item.raw && (item.status === "submitted" || item.status === "approved")) || (role !== "admin" && item.raw && (item.status === "submitted" || item.status === "approved"))) && (
                          <button
                            onClick={() => { setReviewingId(reviewingId === item.id ? null : item.id); setAdminNotes(""); }}
                            className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors shrink-0"
                          >
                            Review
                          </button>
                        )}
                      </div>
                      {/* Submitter identity in pending view */}
                      {item.raw?.submitter_name && (
                        <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">Submitted by</p>
                          <p className="text-sm text-blue-700 font-light">
                            {item.raw.submitter_name}
                            {item.raw.submitter_email && (
                              <span className="text-blue-400 ml-1">({item.raw.submitter_email})</span>
                            )}
                          </p>
                        </div>
                      )}
                      {reviewingId === item.id && item.raw && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
                          <input type="text" placeholder="Notes (optional)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="w-full px-4 py-2 rounded-lg text-sm font-light" />
                          <div className="flex gap-3">
                            {item.status === "submitted" && (
                              <button onClick={() => handleReview(item.id, "approved")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all">Approve</button>
                            )}
                            {item.status === "approved" && role === "admin" && (
                              <button onClick={() => handleReview(item.id, "paid")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all">Mark as Paid</button>
                            )}
                            {item.status === "approved" && role !== "admin" && (
                              <button onClick={() => handleReview(item.id, "submitted")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">Undo Approval</button>
                            )}
                            <button onClick={() => handleReview(item.id, "rejected")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-red-50 text-red-600 hover:bg-red-100 transition-all">Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* === REIMBURSED VIEW === */}
      {view === "reimbursed" && (
        <div className="space-y-6 animate-section-enter">
          {(() => {
            const paidExpenses = expenses.filter(r => r.status === "paid" || r.status === "approved");

            if (paidExpenses.length === 0) {
              return <EmptyState title="No reimbursements yet" description="Approved and paid expenses will appear here" />;
            }

            const totalPaid = paidExpenses.reduce((s, r) => s + r.amount, 0);

            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Reimburse</h3>
                  <span className="text-sm font-light text-blue-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="space-y-2">
                  {paidExpenses.map((r, i) => {
                    const expKey = `reimbursed-${r.id}`;
                    const isExpanded = expandedExpense === expKey;
                    return (
                      <div
                        key={expKey}
                        className="glass-elevated rounded-lg animate-fade-in cursor-pointer hover:bg-gray-50 transition-all"
                        style={{ animationDelay: `${i * 0.02}s`, opacity: 0 }}
                        onClick={() => setExpandedExpense(isExpanded ? null : expKey)}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-light text-blue-600">{formatCurrencyFull(r.amount)}</span>
                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{r.status === "paid" ? "Paid" : "Approved"}</span>
                                {r.category && r.category !== "other" && (
                                  <span className="text-[9px] uppercase tracking-wider text-gray-300">{r.category}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{r.vendor || r.description}</p>
                              {!isExpanded && (
                                <div className="flex items-center gap-3 mt-1.5">
                                  {r.submitted_at && <span className="text-[10px] text-gray-300">{formatDate(r.submitted_at)}</span>}
                                  {role === "admin" && r.client_name && <span className="text-[10px] text-gray-300">{r.client_name}</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.receipt_original_name && (
                                <a href={`/api/reimbursements/${r.id}/receipt`} onClick={(e) => e.stopPropagation()} className="text-gray-300 hover:text-gray-500 transition-colors" title="Receipt">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                </a>
                              )}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="pt-4 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Reimbursed Expense</p>
                                  <p className="text-lg font-light text-gray-900">{formatCurrencyFull(r.amount)}</p>
                                </div>
                                <span className={`text-[9px] uppercase tracking-wider px-3 py-1 rounded-full ${statusColor(r.status)}`}>{r.status === "paid" ? "Paid" : "Approved"}</span>
                              </div>

                              {r.submitter_name && (
                                <div className="bg-blue-50 rounded-lg px-3 py-2">
                                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">Submitted by</p>
                                  <p className="text-sm text-blue-700 font-light">
                                    {r.submitter_name}
                                    {r.submitter_email && <span className="text-blue-400 ml-1">({r.submitter_email})</span>}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                {r.submitted_at && (
                                  <div>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Submitted</p>
                                    <p className="text-sm text-gray-600 font-light">{formatDate(r.submitted_at)}</p>
                                  </div>
                                )}
                                {r.reviewed_at && (
                                  <div>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Paid</p>
                                    <p className="text-sm text-gray-600 font-light">{formatDate(r.reviewed_at)}</p>
                                  </div>
                                )}
                                {(r.vendor || r.description) && (
                                  <div>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Vendor</p>
                                    <p className="text-sm text-gray-600 font-light">{r.vendor || r.description}</p>
                                  </div>
                                )}
                                {r.category && (
                                  <div>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Category</p>
                                    <p className="text-sm text-gray-600 font-light capitalize">{r.category}</p>
                                  </div>
                                )}
                                {role === "admin" && r.client_name && (
                                  <div>
                                    <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Client</p>
                                    <p className="text-sm text-gray-600 font-light">{r.client_name}</p>
                                  </div>
                                )}
                              </div>

                              {r.description && r.description !== r.vendor && (
                                <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Description</p>
                                  <p className="text-xs text-gray-400 font-light">{r.description}</p>
                                </div>
                              )}

                              {r.admin_notes && <p className="text-[10px] text-gray-300 italic">Note: {r.admin_notes}</p>}

                              {r.receipt_original_name && (
                                <a
                                  href={`/api/reimbursements/${r.id}/receipt`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors pt-2"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  View Receipt
                                </a>
                              )}

                              {/* Actions */}
                              {role === "admin" && (
                                <div className="flex gap-3 pt-3 border-t border-gray-100 mt-3">
                                  {r.status === "approved" && (
                                    <>
                                      <button onClick={() => handleReview(r.id, "submitted")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">Undo Approval</button>
                                      <button onClick={() => handleReview(r.id, "paid")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all">Mark as Paid</button>
                                    </>
                                  )}
                                  {r.status === "paid" && (
                                    <button onClick={() => handleReview(r.id, "approved")} className="flex-1 py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all">Undo Payment</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Admin CSV export */}
      {role === "admin" && expenses.length > 0 && (
        <div className="mt-6 text-center">
          <a href="/api/reimbursements/export" className="text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-gray-400 transition-colors">
            Export CSV
          </a>
        </div>
      )}
    </div>
  );
}
