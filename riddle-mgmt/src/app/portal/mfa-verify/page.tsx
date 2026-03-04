"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaVerify() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setLoading(false);
        return;
      }
      router.push("/portal/dashboard");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-lg font-light tracking-tight">Two-Factor Authentication</h1>
          <p className="text-xs text-gray-400 mt-3 tracking-wide">
            Enter the code from your authenticator app
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={8}
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm font-light text-center tracking-[0.5em]"
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="text-center mt-6 text-[10px] text-gray-500 tracking-wide">
          You can also use a backup code
        </p>
      </div>
    </div>
  );
}
