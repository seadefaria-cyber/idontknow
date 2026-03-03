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
  client_name?: string;
  envelope_id?: string | null;
}

interface LegalSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string }[];
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

interface DSEnvelope {
  id: string;
  title: string;
  status: string;
  date: string;
  source: "docusign";
}

interface UnifiedDoc {
  id: string;
  title: string;
  date: string;
  source: "portal" | "docusign";
  status: string;
  downloadUrl?: string;
  clientName?: string;
  envelopeId?: string | null;
}

type LegalTab = "ready" | "signed";

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

  const [dsEnvelopes, setDsEnvelopes] = useState<DSEnvelope[]>([]);
  const [tab, setTab] = useState<LegalTab>("ready");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [needsSignature, setNeedsSignature] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [sendingDocId, setSendingDocId] = useState<string | null>(null);
  const [dsConnected, setDsConnected] = useState<boolean | null>(null);

  function fetchDocuSignEnvelopes() {
    fetch("/api/docusign/envelopes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDsConnected(data.connected);
          if (data.connected && data.envelopes) {
            setDsEnvelopes(data.envelopes);
          }
        }
      })
      .catch(() => {});
  }

  useEffect(() => { fetchDocuSignEnvelopes(); }, []);
  useEffect(() => { if (refreshSignal) { refresh(); fetchDocuSignEnvelopes(); } }, [refreshSignal]);

  // Build unified list — portal docs + DocuSign envelopes
  const unified: UnifiedDoc[] = [];

  for (const doc of docs || []) {
    unified.push({
      id: doc.id,
      title: doc.title,
      date: doc.uploaded_at,
      source: "portal",
      status: doc.status,
      downloadUrl: `/api/legal/${doc.id}/download`,
      clientName: doc.client_name,
      envelopeId: doc.envelope_id,
    });
  }

  // Add DocuSign envelopes — skip any already tracked as portal docs
  const portalEnvelopeIds = new Set((docs || []).filter((d) => d.envelope_id).map((d) => d.envelope_id));
  for (const env of dsEnvelopes) {
    if (portalEnvelopeIds.has(env.id)) continue;
    unified.push({
      id: `ds-${env.id}`,
      title: env.title,
      date: env.date,
      source: "docusign",
      status: env.status,
      envelopeId: env.id,
    });
  }

  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const readyDocs = unified.filter((d) => d.status === "pending" || d.status === "sent" || d.status === "draft");
  const signedDocs = unified.filter((d) => d.status === "signed");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0] || !title) return;
    if (role === "admin" && !clientId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileRef.current.files[0]);
    formData.append("title", title);
    formData.append("category", "contract");
    formData.append("userId", role === "admin" ? clientId : "");
    formData.append("status", needsSignature ? "pending" : "signed");
    const res = await fetch("/api/legal", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      if (needsSignature && data.id) {
        try {
          await fetch("/api/docusign/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ legalDocId: data.id }),
          });
        } catch {
          // DocuSign not connected — doc stays as "pending"
        }
      }
      setTitle("");
      setClientId("");
      setNeedsSignature(false);
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = "";
      refresh();
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

  async function sendForSignature(docId: string) {
    setSendingDocId(docId);
    try {
      const res = await fetch("/api/docusign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalDocId: docId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to send for signature");
      }
      refresh();
    } catch {
      alert("Failed to send for signature");
    }
    setSendingDocId(null);
  }

  async function handleSign(docId: string) {
    setSigningDocId(docId);
    try {
      const res = await fetch("/api/docusign/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalDocId: docId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to start signing");
        setSigningDocId(null);
        return;
      }
      const data = await res.json();
      window.location.href = data.signingUrl;
    } catch {
      alert("Failed to start signing");
      setSigningDocId(null);
    }
  }

  const currentDocs = tab === "ready" ? readyDocs : signedDocs;

  return (
    <div className="animate-section-enter">
      <SectionHeader
        action={role === "admin" ? { label: showUpload ? "Cancel" : "+ Upload", onClick: () => setShowUpload(!showUpload) } : undefined}
      />

      {/* Admin upload */}
      {showUpload && role === "admin" && (
        <form onSubmit={handleUpload} className="glass rounded-lg p-6 mb-6 space-y-4 animate-fade-in">
          <input
            type="text"
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm font-light"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
            >
              <option value="" className="bg-white">Client...</option>
              {allUsers.filter((u) => u.username !== "seandefaria").map((u) => (
                <option key={u.id} value={u.id} className="bg-white">{u.display_name || u.username}</option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              required
              className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:tracking-wider file:uppercase file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100 file:cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsSignature}
                onChange={(e) => setNeedsSignature(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-gray-900 accent-gray-900"
              />
              <span className="text-xs text-gray-400">Needs client signature</span>
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      )}

      {/* Tab pills */}
      <div className="flex items-center justify-center gap-1 mb-6">
        <button
          onClick={() => setTab("ready")}
          className={`flex-1 py-2 text-[10px] tracking-[0.15em] uppercase rounded-lg transition-all text-center ${
            tab === "ready" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-500 hover:bg-white"
          }`}
        >
          Ready to Sign{readyDocs.length > 0 ? ` (${readyDocs.length})` : ""}
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
          title={tab === "ready" ? "Nothing to sign" : "No signed documents yet"}
          description={tab === "ready" ? "Documents awaiting your signature will appear here" : "Signed contracts and agreements will appear here"}
        />
      ) : (
        <div className="space-y-2 animate-section-enter">
          {currentDocs.map((doc, i) => (
            <div
              key={doc.id}
              className={`glass-elevated rounded-lg p-4 sm:p-5 transition-all duration-200 animate-fade-in hover:bg-gray-50 ${
                tab === "ready" ? "border-l-2 border-yellow-300" : ""
              }`}
              style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
            >
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
                      <span className="text-[10px] text-gray-300">{formatDate(doc.date)}</span>
                      {role === "admin" && doc.clientName && (
                        <span className="text-[10px] text-gray-300">{doc.clientName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {tab === "ready" ? (
                    <>
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          className="px-3 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
                        >
                          View
                        </a>
                      )}
                      {role === "admin" ? (
                        <>
                          {!doc.envelopeId && (
                            <button
                              onClick={() => sendForSignature(doc.id)}
                              disabled={sendingDocId === doc.id}
                              className="px-3 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-30"
                            >
                              {sendingDocId === doc.id ? "..." : "Send to Sign"}
                            </button>
                          )}
                          <button
                            onClick={() => markSigned(doc.id)}
                            className="px-3 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                          >
                            Mark Signed
                          </button>
                        </>
                      ) : doc.envelopeId ? (
                        <button
                          onClick={() => handleSign(doc.id)}
                          disabled={signingDocId === doc.id}
                          className="px-5 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
                        >
                          {signingDocId === doc.id ? "Loading..." : "Sign Now"}
                        </button>
                      ) : (
                        <a
                          href={doc.downloadUrl}
                          className="px-5 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium"
                        >
                          Download
                        </a>
                      )}
                    </>
                  ) : (
                    // Signed tab actions
                    doc.source === "docusign" ? (
                      <span className="text-[10px] tracking-[0.15em] uppercase text-green-500 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Signed
                      </span>
                    ) : (
                      <a
                        href={doc.downloadUrl}
                        className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>
                    )
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
