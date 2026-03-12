"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TabBar, { Section } from "@/components/portal/TabBar";
import DashboardHeader from "@/components/portal/DashboardHeader";
import FilesSection from "@/components/portal/FilesSection";
import LegalSection from "@/components/portal/LegalSection";
import ScheduleSection from "@/components/portal/ScheduleSection";
import ReimbursementsSection from "@/components/portal/ReimbursementsSection";
import RoyaltiesSection from "@/components/portal/RoyaltiesSection";
import CommissionsSection from "@/components/portal/CommissionsSection";
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
  const [activeSection, setActiveSection] = useState<Section>("creative");
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; display_name: string; role: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // Keyboard shortcuts: 1-5 to switch sections
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const map: Record<string, Section> = {
        "1": "creative", "2": "legal", "3": "schedule",
        "4": "reimbursements", "5": "royalties", "6": "commissions",
      };
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
    <div className="min-h-screen flex flex-col items-center sm:justify-center px-5 sm:px-10 md:px-16 pt-8 sm:pt-32 pb-20 md:pb-20">
      <div className="w-full max-w-xl space-y-6 sm:space-y-10">
        <DashboardHeader
          displayName={user?.username || ""}
          role={user?.role || "client"}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />

        <TabBar active={activeSection} onChange={setActiveSection} />

        {/* Linked accounts — toggled by gear icon */}
        {showSettings && (
          <div className="animate-section-enter">
            <IntegrationsSection />
          </div>
        )}

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
        {activeSection === "royalties" && (
          <RoyaltiesSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
        {activeSection === "commissions" && (
          <CommissionsSection role={user?.role || "client"} allUsers={allUsers} refreshSignal={refreshKey} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-20 mb-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/portal/expenses"
            className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
          >
            Submit an Expense
          </a>
          <span className="text-gray-100">|</span>
          <a
            href="/portal/commissions"
            className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
          >
            Upload a Commission
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`text-[10px] tracking-[0.15em] uppercase transition-colors ${showSettings ? "text-gray-500" : "text-gray-200 hover:text-gray-400"}`}
          >
            Settings
          </button>
          <span className="text-gray-100">|</span>
          <button
            onClick={handleLogout}
            className="text-[10px] text-gray-200 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase"
          >
            Sign Out
          </button>
        </div>

        {/* Brand logo */}
        {brand.logoUrl && (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-10 sm:h-12 opacity-20 brightness-0 mt-2"
          />
        )}

        {/* Powered by */}
        {brand.showPoweredBy && (
          <a
            href={brand.poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] tracking-[0.2em] uppercase text-gray-200 hover:text-gray-400 transition-colors"
          >
            Powered by {brand.poweredByName} Technologies
          </a>
        )}
      </div>
    </div>
  );
}
