"use client";

import React from "react";

export type Section = "files" | "notes" | "legal" | "schedule" | "reimbursements";

interface SidebarProps {
  active: Section;
  onChange: (section: Section) => void;
  unreadNotes: number;
}

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; shortcut: string }[] = [
  {
    key: "files",
    label: "Files",
    shortcut: "1",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    key: "notes",
    label: "Notes",
    shortcut: "2",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    key: "legal",
    label: "Legal",
    shortcut: "3",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    shortcut: "4",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: "reimbursements",
    label: "Expenses",
    shortcut: "5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
];

export default function Sidebar({ active, onChange, unreadNotes }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-black border-r border-white/[0.06] z-40 pt-20">
        <div className="px-4 py-6 flex-1">
          <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase px-4 mb-4">Portal</p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => onChange(s.key)}
                className={`sidebar-item w-full ${active === s.key ? "sidebar-item-active" : ""}`}
              >
                {s.icon}
                <span className="flex-1 text-left">{s.label}</span>
                {s.key === "notes" && unreadNotes > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-medium">
                    {unreadNotes > 9 ? "9+" : unreadNotes}
                  </span>
                )}
                <span className="text-[10px] text-white/15 font-mono">{s.shortcut}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] flex items-center justify-around px-2 py-2 safe-area-pb">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all ${
              active === s.key ? "text-white" : "text-white/30"
            }`}
          >
            <span className="relative">
              {s.icon}
              {s.key === "notes" && unreadNotes > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
              )}
            </span>
            <span className="text-[9px] tracking-wide">{s.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
