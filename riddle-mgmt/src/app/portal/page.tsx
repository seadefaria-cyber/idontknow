"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Portal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/portal/dashboard");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-lg font-light tracking-tight animate-fade-in">
            Client Portal
          </h1>
          <p className="text-xs text-gray-400 mt-3 tracking-wide animate-fade-in delay-100">
            Secure access to your files
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          <div className="animate-fade-in delay-200">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
              name="portal-user"
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div className="animate-fade-in delay-300">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="off"
              name="portal-pass"
              className="w-full px-4 py-3 rounded-lg text-sm font-light"
            />
          </div>
          <div className="animate-fade-in delay-400">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </div>
        </form>

        {/* Links */}
        <div className="text-center mt-12 space-y-4 animate-fade-in delay-600">
          <div>
            <Link
              href="/portal/submit-expense"
              className="text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-gray-500 transition-colors duration-300"
            >
              Submit an Expense
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-gray-500 transition-colors duration-300"
            >
              &larr; Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
