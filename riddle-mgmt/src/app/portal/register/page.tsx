"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (loginRes.ok) {
        router.push("/portal/dashboard");
      } else {
        router.push("/portal");
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-lg font-light tracking-tight animate-fade-in">
            Create Account
          </h1>
          <p className="text-xs text-gray-400 mt-3 tracking-wide animate-fade-in delay-100">
            Set up your client portal access
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="animate-fade-in delay-200">
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div className="animate-fade-in delay-300">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div className="animate-fade-in delay-400">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div className="animate-fade-in delay-500">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Login link */}
        <div className="text-center mt-8 animate-fade-in delay-600">
          <Link
            href="/portal"
            className="text-xs text-gray-400 hover:text-gray-500 transition-colors duration-300 tracking-wide"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
