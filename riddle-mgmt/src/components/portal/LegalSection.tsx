"use client";

import { useState, useRef, useEffect } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface LegalDoc {
  id: string;
  user_id: string;
  title: string;
  category: string;
  status: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  updated_at: string;
  ai_summary: string | null;
  client_name?: string;
}

interface LegalSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
}

function safeDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00Z");
  if (dateStr.includes("T")) return new Date(dateStr);
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function formatDate(dateStr: string): string {
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "nda", label: "NDA" },
  { value: "agreement", label: "Agreement" },
  { value: "other", label: "Other" },
];

type LegalTab = "pending" | "signed";

export default function LegalSection({ role, allUsers, refreshSignal }: LegalSectionProps) {
  const { data: docs, refresh } = usePolling<LegalDoc[]>(
    async () => {
      const res = await fetch("/api/legal");
      if (!res.ok) return [];
      const data = await res.json();
      return data.documents;
    },
    5000
  );

  const [tab, setTab] = useState<LegalTab>("pending");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("contract");
  const [summary, setSummary] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"pending" | "signed">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (refreshSignal) refresh(); }, [refreshSignal]);

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setAnalyzed(false);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/legal/analyze", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setTitle(data.suggestedTitle || file.name.replace(/\.[^.]+$/, ""));
        setCategory(data.category || "other");
        setSummary(data.summary || "");
        if (data.signed) setStatus("signed");
        setAnalyzed(true);
      }
    } catch { /* keep manual entry */ }
    setAnalyzing(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !title) return;
    if (role === "admin" && !clientId) return;
    setUploading(true);
    try {
      // Step 1: Get presigned S3 URL
      const presignRes = await fetch("/api/legal/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
          userId: role === "admin" ? clientId : undefined,
        }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({ error: "Failed to prepare upload" }));
        setUploadError(data.error || `Presign failed (${presignRes.status})`);
        setUploading(false);
        return;
      }
      const { presignedUrl, s3Key, docId, storedName } = await presignRes.json();

      // Step 2: Upload file directly to S3 (bypasses Vercel 4.5MB limit)
      const s3Res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type || "application/octet-stream" },
        body: selectedFile,
      });
      if (!s3Res.ok) {
        setUploadError(`S3 upload failed (${s3Res.status})`);
        setUploading(false);
        return;
      }

      // Step 3: Register in DB + trigger Drive sync
      const res = await fetch("/api/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          s3Key,
          storedName,
          title,
          category,
          status,
          originalName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
          userId: role === "admin" ? clientId : undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setCategory("contract");
        setSummary("");
        setClientId("");
        setSelectedFile(null);
        setAnalyzed(false);
        setStatus("pending");
        setShowUpload(false);
        if (fileRef.current) fileRef.current.value = "";
        refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        setUploadError(data.error || `Upload failed (${res.status})`);
      }
    } catch {
      setUploadError("Network error — please try again");
    }
    setUploading(false);
  }

  async function markSigned(id: string) {
    await fetch(`/api/legal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "signed" }),
    });
    refresh();
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await fetch(`/api/legal/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    refresh();
  }

  const allDocs = docs || [];
  const pendingDocs = allDocs.filter((d) => d.status === "pending" || d.status === "draft");
  const signedDocs = allDocs.filter((d) => d.status === "signed");
  const currentDocs = tab === "pending" ? pendingDocs : signedDocs;

  return (
    <div className="animate-section-enter">
      <SectionHeader
        action={{
          label: showUpload ? "Cancel" : "+ Upload",
          onClick: () => { setShowUpload(!showUpload); setSelectedFile(null); setAnalyzed(false); setAnalyzing(false); }
        }}
      />

      {/* Upload with AI auto-detect */}
      {uploadError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-xs text-center">
          {uploadError}
        </div>
      )}

      {showUpload && (
        <form onSubmit={(e) => { setUploadError(""); handleUpload(e); }} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
          {/* File picker — first step */}
          <input
            ref={fileRef}
            type="file"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:tracking-wider file:uppercase file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100 file:cursor-pointer"
          />

          {/* Analyzing indicator */}
          {analyzing && (
            <div className="text-center py-3 animate-fade-in">
              <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase">Analyzing document...</p>
            </div>
          )}

          {/* Auto-filled fields (shown after analysis) */}
          {selectedFile && !analyzing && (
            <>
              {analyzed && (
                <div className="text-center py-1">
                  <p className="text-[10px] text-green-500 tracking-[0.1em] uppercase">AI detected — review & edit below</p>
                </div>
              )}
              <input
                type="text"
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm font-light"
              />
              {summary && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">AI Summary</p>
                  <p className="text-xs text-gray-500 font-light">{summary}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {role === "admin" && (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                  >
                    <option value="">Client...</option>
                    {allUsers.filter((u) => u.role !== "admin").map((u) => (
                      <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center justify-between">
                {role === "admin" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === "signed"}
                      onChange={(e) => setStatus(e.target.checked ? "signed" : "pending")}
                      className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-gray-900 accent-gray-900"
                    />
                    <span className="text-xs text-gray-400">Already signed</span>
                  </label>
                )}
                {role !== "admin" && <div />}
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Tab pills */}
      <div className="flex items-center justify-center gap-1 mb-6">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 py-2 text-[10px] tracking-[0.15em] uppercase rounded-lg transition-all text-center ${
            tab === "pending" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-500 hover:bg-white"
          }`}
        >
          Pending{pendingDocs.length > 0 ? ` (${pendingDocs.length})` : ""}
        </button>
        <button
          onClick={() => setTab("signed")}
          className={`flex-1 py-2 text-[10px] tracking-[0.15em] uppercase rounded-lg transition-all text-center ${
            tab === "signed" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-500 hover:bg-white"
          }`}
        >
          Signed{signedDocs.length > 0 ? ` (${signedDocs.length})` : ""}
        </button>
      </div>

      {/* Document list */}
      {currentDocs.length === 0 ? (
        <EmptyState
          title={tab === "pending" ? "Nothing pending" : "No signed documents yet"}
          description={tab === "pending" ? "Documents awaiting review will appear here" : "Signed contracts and agreements will appear here"}
        />
      ) : (
        <div className="space-y-2 animate-section-enter">
          {currentDocs.map((doc, i) => {
            const isExpanded = expandedId === doc.id;
            return (
              <div
                key={doc.id}
                className={`glass-elevated rounded-lg transition-all duration-200 animate-fade-in hover:bg-gray-50 cursor-pointer ${
                  tab === "pending" ? "border-l-2 border-yellow-300" : ""
                }`}
                style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
                onClick={() => setExpandedId(isExpanded ? null : doc.id)}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 font-light truncate">{doc.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-gray-300">{doc.category}</span>
                          <span className="text-[10px] text-gray-300">{formatDate(doc.uploaded_at)}</span>
                          <span className="text-[10px] text-gray-300">{formatSize(doc.file_size)}</span>
                          {role === "admin" && doc.client_name && (
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{doc.client_name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`/api/legal/${doc.id}/download`}
                        className="px-3 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        View
                      </a>
                      {tab === "pending" && role === "admin" && (
                        <button
                          onClick={() => markSigned(doc.id)}
                          className="px-3 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                        >
                          Mark Signed
                        </button>
                      )}
                      {tab === "signed" && (
                        <span className="text-[10px] tracking-[0.15em] uppercase text-green-500 flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Signed
                        </span>
                      )}
                      {confirmDeleteId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-2 py-1.5 rounded-lg text-[10px] tracking-[0.1em] uppercase bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-lg text-[10px] tracking-[0.1em] uppercase text-gray-400 hover:text-gray-500 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && doc.ai_summary && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="pt-4">
                      <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-xs text-gray-500 font-light">{doc.ai_summary}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
