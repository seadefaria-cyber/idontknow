"use client";

import React from "react";

export type Section = "home" | "updates" | "creative" | "legal" | "schedule" | "reimbursements" | "royalties" | "commissions";

interface TabBarProps {
  active: Section;
  onChange: (section: Section) => void;
}

const TABS: { key: Section; label: string }[] = [
  { key: "creative", label: "Creative" },
  { key: "legal", label: "Legal" },
  { key: "schedule", label: "Schedule" },
  { key: "reimbursements", label: "Finances" },
  { key: "royalties", label: "Royalties" },
  { key: "commissions", label: "Commissions" },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-center gap-1 sm:gap-1 min-w-max mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-2.5 sm:px-4 py-3 text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em] uppercase transition-all duration-200 whitespace-nowrap ${
              active === tab.key
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-500"
            }`}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute bottom-0 left-2 right-2 h-px bg-gray-300" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
