"use client";

import { useState } from "react";

interface DashboardHeaderProps {
  displayName: string;
  role: string;
  onLogout?: () => void;
  onRefresh?: () => Promise<void>;
}

export default function DashboardHeader({ displayName, role, onRefresh }: DashboardHeaderProps) {
  const [spinning, setSpinning] = useState(false);

  async function handleRefresh() {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-gray-300 mb-3 animate-fade-in">RIDDLE MGMT.</p>
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-light tracking-tight animate-fade-in">
          {displayName}
        </h1>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 transition-all"
            title="Refresh"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-500 ${spinning ? "animate-spin" : ""}`}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 tracking-wide animate-fade-in delay-100">
        {role === "admin" ? "Administrator" : "Client"} &middot; Secure Portal
      </p>
      <a
        href="https://instagram.com/riddle"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors tracking-[0.12em] animate-fade-in mt-2"
      >
        @riddle
      </a>
    </div>
  );
}
