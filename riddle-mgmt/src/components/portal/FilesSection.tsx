"use client";

import { useState, useRef, useEffect } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface FileInfo {
  id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  folder: string;
  description: string | null;
  uploaded_at: string;
  owner?: string;
  ai_classified?: number;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  driveFolder?: string;
  thumbnailLink?: string;
}

interface DriveState {
  connected: boolean;
  email: string | null;
  files: DriveFile[];
}

type MediaFilter = "all" | "images" | "videos" | "audio" | "docs";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function safeDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + "T00:00:00Z");
  if (dateStr.includes("T")) return new Date(dateStr);
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function formatDate(dateStr: string): string {
  return safeDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/") || mimeType.includes("photo")) return "IMG";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "XLS";
  if (mimeType.includes("presentation") || mimeType.includes("slide")) return "PPT";
  if (mimeType.includes("audio")) return "AUD";
  if (mimeType.includes("video")) return "VID";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "ZIP";
  if (mimeType.includes("gif")) return "GIF";
  return "FILE";
}

function getMediaType(mimeType: string): MediaFilter {
  if (mimeType.startsWith("image/") || mimeType.includes("photo") || mimeType.includes("gif")) return "images";
  if (mimeType.startsWith("video/")) return "videos";
  if (mimeType.startsWith("audio/")) return "audio";
  return "docs";
}

interface UnifiedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  date: string;
  source: "drive" | "portal";
  webViewLink?: string;
  portalId?: string;
  description?: string | null;
  thumbnail?: string;
}

interface FilesSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
}

export default function FilesSection({ role, allUsers, refreshSignal }: FilesSectionProps) {
  const { data: files, refresh } = usePolling<FileInfo[]>(
    async () => {
      const res = await fetch("/api/files");
      if (!res.ok) return [];
      const data = await res.json();
      return data.files;
    },
    5000
  );

  const [driveState, setDriveState] = useState<DriveState>({ connected: false, email: null, files: [] });
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [unlockingFile, setUnlockingFile] = useState<string | null>(null);
  const [filePassword, setFilePassword] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadUserId, setUploadUserId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fetchDriveFiles() {
    fetch("/api/google-drive/files")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDriveState({ connected: data.connected, email: data.email, files: data.files || [] });
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  // Re-fetch when refresh signal changes (from dashboard refresh button)
  useEffect(() => {
    if (refreshSignal) {
      refresh();
      fetchDriveFiles();
    }
  }, [refreshSignal]);

  async function handleUnlock(fileId: string) {
    setFileError("");
    try {
      const res = await fetch(`/api/files/${fileId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: filePassword }),
      });
      const data = await res.json();
      if (!res.ok) { setFileError(data.error || "Incorrect password"); return; }
      window.location.href = `/api/files/${fileId}/download?token=${data.downloadToken}`;
      setUnlockingFile(null);
      setFilePassword("");
    } catch {
      setFileError("Something went wrong");
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !uploadUserId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);
    formData.append("filePassword", "creative");
    formData.append("userId", uploadUserId);
    formData.append("description", uploadDescription);
    formData.append("folder", "creative");
    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      if (res.ok) {
        setUploadUserId("");
        setUploadDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        refresh();
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  // Build unified file list
  const unified: UnifiedFile[] = [];

  for (const f of files || []) {
    unified.push({
      id: f.id,
      name: f.original_name,
      mimeType: f.mime_type,
      size: f.file_size,
      date: f.uploaded_at,
      source: "portal",
      portalId: f.id,
      description: f.description,
    });
  }

  if (driveState.connected) {
    for (const f of driveState.files) {
      if ((f.driveFolder === "creative" || f.driveFolder === "other" || !f.driveFolder) && f.mimeType !== "application/vnd.google-apps.folder") {
        unified.push({
          id: `drive-${f.id}`,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size ? parseInt(f.size) : 0,
          date: f.modifiedTime,
          source: "drive",
          webViewLink: f.webViewLink,
          thumbnail: f.thumbnailLink,
        });
      }
    }
  }

  // Sort newest first
  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply filter
  const filtered = filter === "all" ? unified : unified.filter((f) => getMediaType(f.mimeType) === filter);

  // Count per type for pills
  const counts: Record<MediaFilter, number> = { all: unified.length, images: 0, videos: 0, audio: 0, docs: 0 };
  for (const f of unified) {
    counts[getMediaType(f.mimeType)]++;
  }

  const FILTERS: { key: MediaFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "images", label: "Images" },
    { key: "videos", label: "Videos" },
    { key: "audio", label: "Audio" },
    { key: "docs", label: "Docs" },
  ];

  return (
    <div className="animate-section-enter">
      <SectionHeader
        title="Creative"
        action={role === "admin" ? { label: uploading ? "Uploading..." : "+ Upload", onClick: () => {} } : undefined}
      />

      {/* Admin upload */}
      {role === "admin" && (
        <form onSubmit={handleUpload} className="glass rounded-lg p-5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                required
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.gif"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:tracking-wider file:uppercase file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100 file:cursor-pointer file:transition-all"
              />
            </div>
            <select
              value={uploadUserId}
              onChange={(e) => setUploadUserId(e.target.value)}
              required
              className="px-3 py-2 rounded-lg text-xs font-light bg-white border border-gray-200 text-gray-900 sm:w-40"
            >
              <option value="" className="bg-white">Client...</option>
              {allUsers.filter((u) => u.role !== "admin").map((u) => (
                <option key={u.id} value={u.id} className="bg-white">{u.display_name || u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-light"
            />
            <button
              type="submit"
              disabled={uploading || !uploadUserId}
              className="px-5 py-2.5 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30 shrink-0"
            >
              Upload
            </button>
          </div>
        </form>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all ${
              filter === f.key
                ? "bg-gray-100 text-gray-900"
                : "bg-white text-gray-400 hover:text-gray-500"
            }`}
          >
            {f.label}{counts[f.key] > 0 ? ` (${counts[f.key]})` : ""}
          </button>
        ))}
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No creative files yet" : `No ${filter} yet`}
          description="Creative projects, photos, videos, and media will appear here"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((file, i) => (
            <div
              key={file.id}
              className="glass-elevated rounded-lg p-4 transition-all duration-200 animate-fade-in hover:bg-gray-50"
              style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {file.thumbnail ? (
                    <img
                      src={file.thumbnail}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <span className="text-[9px] tracking-wider text-gray-400 font-medium">
                        {getFileIcon(file.mimeType)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 font-light truncate">{file.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {file.size > 0 && (
                        <span className="text-[10px] text-gray-300">{formatBytes(file.size)}</span>
                      )}
                      <span className="text-[10px] text-gray-300">{formatDate(file.date)}</span>
                      {file.description && (
                        <span className="text-[10px] text-gray-300 hidden sm:inline truncate max-w-[150px]">{file.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action */}
                {file.source === "drive" ? (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Open
                  </a>
                ) : (
                  <button
                    onClick={() => { setUnlockingFile(unlockingFile === file.portalId ? null : file.portalId!); setFilePassword(""); setFileError(""); }}
                    className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors shrink-0"
                  >
                    <svg width="10" height="12" viewBox="0 0 12 14" fill="none" className="opacity-50">
                      <rect x="0.5" y="6.5" width="11" height="7" rx="1.5" stroke="currentColor" />
                      <path d="M3 6.5V4C3 2.34 4.34 1 6 1s3 1.34 3 3v2.5" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                    Download
                  </button>
                )}
              </div>

              {/* Unlock panel for portal files */}
              {file.source === "portal" && unlockingFile === file.portalId && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {fileError && <p className="text-xs text-red-600 mb-2">{fileError}</p>}
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="File password"
                      value={filePassword}
                      onChange={(e) => setFilePassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUnlock(file.portalId!)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-light"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUnlock(file.portalId!)}
                      className="px-4 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium shrink-0"
                    >
                      Unlock
                    </button>
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
