"use client";

import { useState, useRef, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface RoyaltyStatement {
  id: string;
  user_id: string;
  title: string;
  category: string;
  period: string | null;
  amount: number | null;
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  client_name?: string;
}

interface RoyaltiesSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
}

function formatDate(dateStr: string): string {
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(amount: number | null): string {
  if (amount == null) return "";
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const DISTRIBUTION_SOURCES = ["TuneCore", "DistroKid", "CD Baby", "EMPIRE", "UnitedMasters", "Stem", "AWAL", "Other"];
const PUBLISHING_SOURCES = ["BMI", "ASCAP", "SESAC", "SOCAN", "Other"];

interface ColumnProps {
  title: string;
  subtitle: string;
  category: string;
  sources: string[];
  statements: RoyaltyStatement[];
  role: string;
  allUsers: RoyaltiesSectionProps["allUsers"];
  onUpload: (formData: FormData) => Promise<boolean>;
  onDelete: (id: string) => void;
}

function RoyaltyColumn({ title, subtitle, category, sources, statements, role, allUsers, onUpload, onDelete }: ColumnProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stmtTitle, setStmtTitle] = useState("");
  const [source, setSource] = useState(sources[0]);
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = statements.reduce((sum, s) => sum + (s.amount || 0), 0);

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setAnalyzed(false);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/royalties/analyze", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setStmtTitle(data.title || file.name.replace(/\.[^.]+$/, ""));
        if (data.source && sources.includes(data.source)) {
          setSource(data.source);
        } else if (data.source) {
          setSource("Other");
        }
        setPeriod(data.period || "");
        setAmount(data.amount != null ? String(data.amount) : "");
        setAnalyzed(true);
      }
    } catch { /* keep manual entry */ }
    setAnalyzing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !stmtTitle) return;
    if (role === "admin" && !clientId) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", `${source} — ${stmtTitle}`);
    formData.append("category", category);
    formData.append("period", period);
    if (amount) formData.append("amount", amount);
    formData.append("userId", role === "admin" ? clientId : "");

    const ok = await onUpload(formData);
    if (ok) {
      setStmtTitle("");
      setSource(sources[0]);
      setPeriod("");
      setAmount("");
      setClientId("");
      setSelectedFile(null);
      setAnalyzed(false);
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = "";
    }
    setUploading(false);
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-medium text-gray-700 tracking-[0.1em] uppercase">{title}</h3>
          <p className="text-[10px] text-gray-300 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => { setShowUpload(!showUpload); setSelectedFile(null); setAnalyzed(false); setAnalyzing(false); }}
          className="text-[10px] tracking-[0.12em] uppercase text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showUpload ? "Cancel" : "+ Upload"}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleSubmit} className="glass rounded-lg p-4 mb-4 space-y-3 animate-fade-in">
          {/* File picker — first step */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.csv,.xls,.xlsx,.tsv"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:tracking-wider file:uppercase file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100 file:cursor-pointer"
          />

          {/* Analyzing indicator */}
          {analyzing && (
            <div className="text-center py-3 animate-fade-in">
              <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase">Analyzing document...</p>
            </div>
          )}

          {/* Auto-filled fields (shown after analysis or manual entry) */}
          {selectedFile && !analyzing && (
            <>
              {analyzed && (
                <div className="text-center py-1">
                  <p className="text-[10px] text-green-500 tracking-[0.1em] uppercase">AI detected — review & edit below</p>
                </div>
              )}
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-xs font-light bg-white border border-gray-200 text-gray-900"
              >
                {sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Statement title (e.g. Q4 2025)"
                value={stmtTitle}
                onChange={(e) => setStmtTitle(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg text-xs font-light"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-xs font-light"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg text-xs font-light"
                />
              </div>
              {role === "admin" && (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-light bg-white border border-gray-200 text-gray-900"
                >
                  <option value="">Client...</option>
                  {allUsers.filter((u) => u.role !== "admin").map((u) => (
                    <option key={u.id} value={u.id}>{u.display_name || u.username}</option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </>
          )}
        </form>
      )}

      {/* Total */}
      {total > 0 && (
        <div className="text-center mb-4 py-3 rounded-lg bg-gray-50/50">
          <p className="text-[9px] text-gray-300 tracking-[0.15em] uppercase">Total</p>
          <p className="text-lg font-light text-gray-700 mt-0.5">{formatAmount(total)}</p>
        </div>
      )}

      {/* Statement list */}
      {statements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[10px] text-gray-300 tracking-[0.1em] uppercase">No statements yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {statements.map((stmt, i) => (
            <div
              key={stmt.id}
              className="glass-elevated rounded-lg p-3 sm:p-4 transition-all duration-200 animate-fade-in hover:bg-gray-50"
              style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 font-light truncate">{stmt.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {stmt.period && <span className="text-[10px] text-gray-400">{stmt.period}</span>}
                    {stmt.amount != null && (
                      <span className="text-[10px] font-medium text-gray-600">{formatAmount(stmt.amount)}</span>
                    )}
                    <span className="text-[10px] text-gray-300">{formatDate(stmt.uploaded_at)}</span>
                    <span className="text-[10px] text-gray-300">{formatSize(stmt.file_size)}</span>
                    {role === "admin" && stmt.client_name && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{stmt.client_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/royalties/${stmt.id}`}
                    className="px-2 py-1.5 rounded text-[9px] tracking-[0.12em] uppercase text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    View
                  </a>
                  {role === "admin" && (
                    <button
                      onClick={() => onDelete(stmt.id)}
                      className="px-2 py-1.5 rounded text-[9px] tracking-[0.12em] uppercase text-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      Del
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

export default function RoyaltiesSection({ role, allUsers, refreshSignal }: RoyaltiesSectionProps) {
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchStatements() {
    try {
      const res = await fetch("/api/royalties");
      if (res.ok) {
        const data = await res.json();
        setStatements(data.statements || []);
      }
    } catch { /* */ }
    setLoading(false);
  }

  useEffect(() => { fetchStatements(); }, []);
  useEffect(() => { if (refreshSignal) fetchStatements(); }, [refreshSignal]);

  async function handleUpload(formData: FormData): Promise<boolean> {
    const file = formData.get("file") as File | null;
    if (!file) return false;

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/royalties/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          userId: formData.get("userId") || undefined,
        }),
      });
      if (!presignRes.ok) return false;
      const { presignedUrl, s3Key, docId, storedName } = await presignRes.json();

      // Step 2: Upload directly to S3
      const s3Res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!s3Res.ok) return false;

      // Step 3: Register in database
      const registerRes = await fetch("/api/royalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId, s3Key, storedName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          title: formData.get("title"),
          category: formData.get("category"),
          period: formData.get("period"),
          amount: formData.get("amount"),
          userId: formData.get("userId") || undefined,
        }),
      });
      if (registerRes.ok) {
        fetchStatements();
        return true;
      }
    } catch {
      // fall through
    }
    return false;
  }

  async function handleDelete(id: string) {
    await fetch(`/api/royalties/${id}`, { method: "DELETE" });
    fetchStatements();
  }

  const recording = statements.filter((s) => s.category === "recording");
  const publishing = statements.filter((s) => s.category === "publishing");

  if (loading) {
    return (
      <div className="animate-section-enter text-center py-12">
        <p className="text-xs text-gray-300 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-section-enter">
      <SectionHeader />

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        <RoyaltyColumn
          title="Distribution"
          subtitle="TuneCore, DistroKid, CD Baby, etc."
          category="recording"
          sources={DISTRIBUTION_SOURCES}
          statements={recording}
          role={role}
          allUsers={allUsers}
          onUpload={handleUpload}
          onDelete={handleDelete}
        />

        {/* Vertical divider */}
        <div className="hidden sm:block w-px bg-gray-100 self-stretch" />
        <div className="sm:hidden h-px bg-gray-100" />

        <RoyaltyColumn
          title="Publishing"
          subtitle="BMI, ASCAP, SESAC"
          category="publishing"
          sources={PUBLISHING_SOURCES}
          statements={publishing}
          role={role}
          allUsers={allUsers}
          onUpload={handleUpload}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
