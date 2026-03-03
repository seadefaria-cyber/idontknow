"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TabBar, { Section } from "@/components/portal/TabBar";
import DashboardHeader from "@/components/portal/DashboardHeader";
import FilesSection from "@/components/portal/FilesSection";
import LegalSection from "@/components/portal/LegalSection";
import ScheduleSection from "@/components/portal/ScheduleSection";
import ReimbursementsSection from "@/components/portal/ReimbursementsSection";
import IntegrationsSection from "@/components/portal/IntegrationsSection";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("creative");
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    // Auto-open integrations panel if returning from DocuSign OAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ds_connected") || params.get("ds_error")) {
        setShowSettings(true);
        // Clean up URL params
        window.history.replaceState({}, "", "/portal/dashboard");
      }
    }
  }, []);

  // Keyboard shortcuts: 1-4 to switch sections
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const map: Record<string, Section> = { "1": "creative", "2": "legal", "3": "schedule", "4": "reimbursements" };
      const section = map[e.key];
      if (section) setActiveSection(section);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) { router.push("/portal"); return; }
      const data = await res.json();
      setUser(data.user);
      // Auto-sync QuickBooks on every login for all users
      fetch("/api/quickbooks/sync", { method: "POST" }).catch(() => {});
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal");
  }

  const handleRefresh = useCallback(async () => {
    fetch("/api/quickbooks/sync", { method: "POST" }).catch(() => {});
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center sm:justify-center px-4 sm:px-10 md:px-16 pt-16 sm:pt-32 pb-24 md:pb-20">
      <div className="w-full max-w-xl space-y-10">
        <DashboardHeader
          displayName={user?.username || ""}
          role={user?.role || "client"}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <TabBar active={activeSection} onChange={setActiveSection} />
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-all ${showSettings ? "bg-gray-100 text-gray-500" : "text-gray-300 hover:text-gray-400"}`}
            title="Linked Accounts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Linked accounts — toggled by gear icon */}
        {showSettings && (
          <div className="animate-section-enter">
            <IntegrationsSection />
          </div>
        )}

        <div className="w-full h-px bg-gray-50" />

        {/* Section content */}
        {activeSection === "creative" && (
          <FilesSection
            role={user?.role || "client"}
            allUsers={allUsers}
            refreshSignal={refreshKey}
          />
        )}
        {activeSection === "legal" && (
          <LegalSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
        {activeSection === "schedule" && (
          <ScheduleSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
        {activeSection === "reimbursements" && (
          <ReimbursementsSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
      </div>

      {/* Sign out + Request — bottom of page */}
      <div className="mt-16 mb-4 flex flex-col items-center gap-3">
        <a
          href="/portal/request"
          className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
        >
          Submit a Request
        </a>
        <button
          onClick={handleLogout}
          className="text-[10px] text-gray-200 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
        >
          Sign Out
        </button>
      </div>

      {/* Powered by DeFaria */}
      <div className="mt-8 mb-6 flex flex-col items-center gap-2">
        <a
          href="https://defaria.nyc/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-300 hover:text-gray-400 transition-colors group"
        >
          <span className="text-sm font-semibold tracking-tight text-gray-300 group-hover:text-gray-400 transition-colors">dF</span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-gray-300 group-hover:text-gray-400 transition-colors">Powered by DeFaria</span>
        </a>
      </div>
    </div>
  );
}
