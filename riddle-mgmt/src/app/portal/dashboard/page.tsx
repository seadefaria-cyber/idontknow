"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TabBar, { Section } from "@/components/portal/TabBar";
import DashboardHeader from "@/components/portal/DashboardHeader";
import HomeSection from "@/components/portal/HomeSection";
import NotesSection from "@/components/portal/NotesSection";
import FilesSection from "@/components/portal/FilesSection";
import LegalSection from "@/components/portal/LegalSection";
import ScheduleSection from "@/components/portal/ScheduleSection";
import ReimbursementsSection from "@/components/portal/ReimbursementsSection";
import RoyaltiesSection from "@/components/portal/RoyaltiesSection";
import IntegrationsSection from "@/components/portal/IntegrationsSection";
import { brand } from "@/lib/brand";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; display_name: string; role: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [badges, setBadges] = useState<Partial<Record<Section, number>>>({});
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // Keyboard shortcuts: 1-7 to switch sections
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const map: Record<string, Section> = {
        "1": "home", "2": "updates", "3": "creative",
        "4": "legal", "5": "schedule", "6": "reimbursements", "7": "royalties",
      };
      const section = map[e.key];
      if (section) setActiveSection(section);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch badge counts
  const fetchBadges = useCallback(async () => {
    try {
      const [legalRes, reimbRes] = await Promise.all([
        fetch("/api/legal"),
        fetch("/api/reimbursements"),
      ]);
      const newBadges: Partial<Record<Section, number>> = { ...badges };
      if (legalRes.ok) {
        const d = await legalRes.json();
        const unsigned = (d.documents || []).filter((doc: { status: string }) => doc.status === "sent" || doc.status === "draft").length;
        newBadges.legal = unsigned;
      }
      if (reimbRes.ok) {
        const d = await reimbRes.json();
        newBadges.reimbursements = d.summary?.pending_count || 0;
      }
      setBadges(newBadges);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);
  useEffect(() => { if (refreshKey) fetchBadges(); }, [refreshKey, fetchBadges]);

  const handleUnreadChange = useCallback((count: number) => {
    setBadges((prev) => ({ ...prev, updates: count }));
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
            <TabBar active={activeSection} onChange={setActiveSection} badges={badges} />
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
        {activeSection === "home" && user && (
          <HomeSection
            userId={user.id}
            displayName={user.displayName || user.username}
            role={user.role}
            allUsers={allUsers}
            refreshSignal={refreshKey}
            onNavigate={setActiveSection}
          />
        )}
        {activeSection === "updates" && user && (
          <NotesSection
            userId={user.id}
            role={user.role}
            allUsers={allUsers}
            onUnreadChange={handleUnreadChange}
          />
        )}
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
        {activeSection === "royalties" && (
          <RoyaltiesSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
      </div>

      {/* Sign out + Request + Expense — bottom of page */}
      <div className="mt-16 mb-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveSection("updates")}
            className="text-xs text-gray-300 hover:text-gray-400 transition-colors tracking-[0.12em] uppercase"
          >
            Message Your Team
          </button>
          <span className="text-gray-200">|</span>
          <a
            href="/portal/expenses"
            className="text-xs text-gray-300 hover:text-gray-400 transition-colors tracking-[0.12em] uppercase"
          >
            Submit an Expense
          </a>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] text-gray-200 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
        >
          Sign Out
        </button>
      </div>

      {/* Powered by attribution */}
      {brand.showPoweredBy && (
        <div className="mt-8 mb-6 flex flex-col items-center gap-2">
          <a
            href={brand.poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-gray-400 transition-colors group"
          >
            <span className="text-[9px] tracking-[0.2em] uppercase text-gray-300 group-hover:text-gray-400 transition-colors">Powered by {brand.poweredByName}</span>
          </a>
        </div>
      )}
    </div>
  );
}
