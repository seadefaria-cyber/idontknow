"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  display_name: string;
  role: string;
  email: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.status === 401) {
      router.push("/portal");
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName, email, role }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setUsername("");
    setPassword("");
    setDisplayName("");
    setEmail("");
    setRole("client");
    setShowForm(false);
    loadUsers();
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      loadUsers();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-light tracking-tight">User Management</h1>
            <p className="text-xs text-gray-400 mt-1">{users.length} users</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/portal/dashboard"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors tracking-wide"
            >
              Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs tracking-[0.15em] uppercase px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showForm ? "Cancel" : "Add User"}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-8 p-5 border border-gray-200 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2.5 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900"
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="text-xs tracking-[0.15em] uppercase px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-light text-gray-900 truncate">
                    {user.display_name || user.username}
                  </span>
                  <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full ${
                    user.role === "admin"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">@{user.username}</span>
                  {user.email && <span className="text-xs text-gray-300">{user.email}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(user.id, user.username)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors ml-4"
                title="Delete user"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
