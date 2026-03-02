"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

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
}

const FOLDERS = [
  { key: "documents", label: "Documents" },
  { key: "metrics", label: "Metrics" },
  { key: "assets", label: "Assets" },
] as const;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("audio")) return "AUD";
  if (mimeType.includes("video")) return "VID";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "ZIP";
  return "FILE";
}

/* macOS-style folder icon */
function MacFolder({ itemCount }: { itemCount: number }) {
  return (
    <div className="relative w-20 h-16 group-hover:scale-105 transition-transform duration-200">
      {/* Folder tab */}
      <svg viewBox="0 0 80 64" fill="none" className="w-full h-full drop-shadow-lg">
        {/* Tab */}
        <path
          d="M2 12C2 10.8954 2.89543 10 4 10H24L28 4H4C2.89543 4 2 4.89543 2 6V12Z"
          fill="#4A9EF5"
          opacity="0.9"
        />
        {/* Back face */}
        <rect x="2" y="10" width="76" height="50" rx="4" fill="#2D7DD2" opacity="0.5" />
        {/* Front face */}
        <rect x="2" y="16" width="76" height="46" rx="4" fill="url(#folderGrad)" />
        {/* Highlight */}
        <rect x="2" y="16" width="76" height="8" rx="4" fill="white" opacity="0.08" />
        <defs>
          <linearGradient id="folderGrad" x1="40" y1="16" x2="40" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5AABF7" />
            <stop offset="1" stopColor="#2D7DD2" />
          </linearGradient>
        </defs>
      </svg>
      {/* Item count badge */}
      {itemCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
          <span className="text-[9px] font-semibold text-black">{itemCount}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [unlockingFile, setUnlockingFile] = useState<string | null>(null);
  const [filePassword, setFilePassword] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPassword, setUploadPassword] = useState("");
  const [uploadUserId, setUploadUserId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFolder, setUploadFolder] = useState("documents");
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/portal");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      await loadFiles();

      if (data.user.role === "admin") {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData.users);
        }
      }
    } catch {
      router.push("/portal");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles() {
    const res = await fetch("/api/files");
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal");
  }

  async function handleUnlock(fileId: string) {
    setFileError("");
    try {
      const res = await fetch(`/api/files/${fileId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: filePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFileError(data.error || "Incorrect password");
        return;
      }
      window.location.href = `/api/files/${fileId}/download?token=${data.downloadToken}`;
      setUnlockingFile(null);
      setFilePassword("");
    } catch {
      setFileError("Something went wrong");
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !uploadPassword || !uploadUserId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);
    formData.append("filePassword", uploadPassword);
    formData.append("userId", uploadUserId);
    formData.append("description", uploadDescription);
    formData.append("folder", uploadFolder);

    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setShowUpload(false);
        setUploadPassword("");
        setUploadUserId("");
        setUploadDescription("");
        setUploadFolder("documents");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadFiles();
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  function getFilesInFolder(folderKey: string) {
    return files.filter((f) => f.folder === folderKey);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-white/30 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-24 pb-20 px-5 sm:px-8 md:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 sm:mb-12 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight animate-fade-in truncate">
              {user?.displayName || user?.username}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/30 mt-1 sm:mt-2 tracking-wide animate-fade-in delay-100">
              {user?.role === "admin" ? "Administrator" : "Client"} &middot; Secure Portal
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] sm:text-xs text-white/30 hover:text-white/60 transition-colors tracking-[0.15em] uppercase animate-fade-in shrink-0"
          >
            Sign Out
          </button>
        </div>

        <div className="w-full h-px bg-white/5 mb-10 animate-fade-in delay-100" />

        {/* Admin upload */}
        {user?.role === "admin" && (
          <div className="mb-10 animate-fade-in delay-200">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="text-xs tracking-[0.2em] uppercase glass rounded-lg px-5 py-3 hover:bg-white/10 transition-all duration-300"
            >
              {showUpload ? "Cancel" : "+ Upload File"}
            </button>

            {showUpload && (
              <form onSubmit={handleUpload} className="mt-6 space-y-4 glass rounded-lg p-6">
                <div>
                  <label className="text-xs text-white/40 tracking-wide block mb-2">File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:tracking-wider file:uppercase file:bg-white/5 file:text-white/60 hover:file:bg-white/10 file:cursor-pointer file:transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 tracking-wide block mb-2">Folder</label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white/[0.03] border border-white/10 text-white"
                  >
                    {FOLDERS.map((f) => (
                      <option key={f.key} value={f.key} className="bg-black">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 tracking-wide block mb-2">Assign to Client</label>
                  <select
                    value={uploadUserId}
                    onChange={(e) => setUploadUserId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white/[0.03] border border-white/10 text-white"
                  >
                    <option value="" className="bg-black">Select a client...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-black">
                        {u.display_name || u.username} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 tracking-wide block mb-2">File Password</label>
                  <input
                    type="text"
                    placeholder="Password to protect this file"
                    value={uploadPassword}
                    onChange={(e) => setUploadPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm font-light"
                  />
                  <p className="text-[10px] text-white/20 mt-1">Share this password with the client separately</p>
                </div>
                <div>
                  <label className="text-xs text-white/40 tracking-wide block mb-2">Description (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 2026 Royalty Statement"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-light"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-white text-black hover:bg-white/90 transition-all duration-300 font-medium disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload & Protect"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Folder view — when no folder is open */}
        {!openFolder && (
          <>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-xs tracking-[0.2em] uppercase text-white/30 mb-10 animate-fade-in delay-200 text-center">
              {user?.role === "admin" ? "All Folders" : "Your Folders"}
            </h2>

            <div className="grid grid-cols-3 gap-6 sm:gap-12 animate-fade-in delay-300 place-items-center">
              {FOLDERS.map((folder) => {
                const count = getFilesInFolder(folder.key).length;
                return (
                  <button
                    key={folder.key}
                    onClick={() => setOpenFolder(folder.key)}
                    className="group flex flex-col items-center gap-3 py-6 rounded-xl hover:bg-white/[0.02] transition-all duration-200"
                  >
                    <MacFolder itemCount={count} />
                    <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors duration-200 tracking-wide">
                      {folder.label}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>
          </>
        )}

        {/* Open folder — file list */}
        {openFolder && (
          <div className="animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => {
                  setOpenFolder(null);
                  setUnlockingFile(null);
                  setFilePassword("");
                  setFileError("");
                }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-[0.15em] uppercase"
              >
                &larr; All Folders
              </button>
              <span className="text-white/10">/</span>
              <span className="text-xs text-white/60 tracking-[0.15em] uppercase">
                {FOLDERS.find((f) => f.key === openFolder)?.label}
              </span>
            </div>

            {/* Folder header with icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="scale-75 origin-left">
                <MacFolder itemCount={getFilesInFolder(openFolder).length} />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight">
                  {FOLDERS.find((f) => f.key === openFolder)?.label}
                </h2>
                <p className="text-xs text-white/25 mt-1">
                  {getFilesInFolder(openFolder).length} {getFilesInFolder(openFolder).length === 1 ? "file" : "files"}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-white/5 mb-6" />

            {/* Files in this folder */}
            {getFilesInFolder(openFolder).length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-white/25 font-light">This folder is empty</p>
                <p className="text-xs text-white/15 mt-2">Files will appear here when uploaded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilesInFolder(openFolder).map((file, i) => (
                  <div
                    key={file.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                  >
                    <div className="glass rounded-lg p-4 sm:p-5 hover:bg-white/[0.04] transition-all duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <span className="text-[9px] sm:text-[10px] tracking-wider text-white/40 font-medium">
                              {getFileIcon(file.mime_type)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-white/80 font-light truncate">{file.original_name}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                              <span className="text-[9px] sm:text-[10px] text-white/25">{formatBytes(file.file_size)}</span>
                              <span className="text-[9px] sm:text-[10px] text-white/25">{formatDate(file.uploaded_at)}</span>
                              {file.description && (
                                <span className="text-[9px] sm:text-[10px] text-white/25 hidden sm:inline">{file.description}</span>
                              )}
                              {file.owner && (
                                <span className="text-[9px] sm:text-[10px] text-white/25 hidden sm:inline">Owner: {file.owner}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setUnlockingFile(unlockingFile === file.id ? null : file.id);
                            setFilePassword("");
                            setFileError("");
                          }}
                          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors"
                        >
                          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="opacity-40">
                            <rect x="0.5" y="6.5" width="11" height="7" rx="1.5" stroke="currentColor" />
                            <path d="M3 6.5V4C3 2.34 4.34 1 6 1s3 1.34 3 3v2.5" stroke="currentColor" strokeLinecap="round" />
                          </svg>
                          Unlock
                        </button>
                      </div>

                      {unlockingFile === file.id && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          {fileError && (
                            <p className="text-xs text-red-400/80 mb-3">{fileError}</p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="password"
                              placeholder="File password"
                              value={filePassword}
                              onChange={(e) => setFilePassword(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleUnlock(file.id)}
                              className="flex-1 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-light"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUnlock(file.id)}
                              className="px-5 py-2.5 sm:py-2 rounded-lg text-xs tracking-[0.15em] uppercase bg-white text-black hover:bg-white/90 transition-all font-medium shrink-0"
                            >
                              Download
                            </button>
                          </div>
                          <p className="text-[10px] text-white/15 mt-2">
                            Enter the file-specific password to download
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
