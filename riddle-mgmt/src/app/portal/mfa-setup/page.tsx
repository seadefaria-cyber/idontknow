"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"scan" | "backup">("scan");
  const router = useRouter();

  useEffect(() => {
    fetchSetup();
  }, []);

  async function fetchSetup() {
    try {
      const res = await fetch("/api/auth/mfa/setup");
      if (!res.ok) {
        router.push("/portal");
        return;
      }
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
    } catch {
      router.push("/portal");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setVerifying(false);
        return;
      }
      // Show backup codes before redirecting
      setStep("backup");
    } catch {
      setError("Something went wrong");
      setVerifying(false);
    }
  }

  function handleContinue() {
    router.push("/portal/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 sm:px-8">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-lg font-light tracking-tight">Set Up Two-Factor Authentication</h1>
          <p className="text-xs text-gray-400 mt-3 tracking-wide">
            Scan the QR code with your authenticator app
          </p>
        </div>

        {step === "scan" && (
          <>
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              {qrCode && (
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg" />
              )}
            </div>

            {/* Manual entry */}
            <div className="mb-6 px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Manual entry key</p>
              <p className="text-xs text-gray-300 font-mono break-all select-all">{secret}</p>
            </div>

            {/* Verify code */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg text-sm font-light text-center tracking-[0.5em]"
              />
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify & Enable"}
              </button>
            </form>
          </>
        )}

        {step === "backup" && (
          <>
            <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs text-center">
              Save these backup codes somewhere safe. Each code can only be used once.
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {backupCodes.map((bc, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded bg-gray-900/50 border border-gray-800 text-center font-mono text-sm text-gray-300 select-all"
                >
                  {bc}
                </div>
              ))}
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              I&apos;ve Saved My Codes &mdash; Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
