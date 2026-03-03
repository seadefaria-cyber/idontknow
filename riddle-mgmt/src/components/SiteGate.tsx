"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SITE_PASSWORD = "seandefaria";
const STORAGE_KEY = "site_unlocked";

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }

  if (checking) return <div className="min-h-screen" />;

  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-[160px] sm:w-[220px] mb-12 animate-fade-in-slow">
          <Image
            src="/logo.png"
            alt="Riddle MGMT LLC"
            width={220}
            height={52}
            priority
            className="opacity-60 w-full h-auto"
          />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 animate-fade-in delay-300">
          <input
            type="password"
            placeholder="Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className={`w-56 px-5 py-3 rounded-lg text-sm font-light text-center tracking-widest bg-white/[0.03] border transition-all duration-300 outline-none ${
              error
                ? "border-red-500/40 text-red-400 placeholder:text-red-400/30"
                : "border-white/10 text-white/80 placeholder:text-white/20 focus:border-white/25"
            }`}
          />
          <button
            type="submit"
            className="text-[10px] tracking-[0.2em] uppercase text-white/30 hover:text-white/60 transition-all duration-300"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
