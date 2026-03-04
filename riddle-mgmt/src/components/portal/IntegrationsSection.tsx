"use client";

import { useState, useEffect } from "react";

interface DriveStatus {
  connected: boolean;
  email: string | null;
}

interface QBStatus {
  connected: boolean;
  company_name?: string;
}

export default function IntegrationsSection() {
  const [drive, setDrive] = useState<DriveStatus>({ connected: false, email: null });
  const [qb, setQB] = useState<QBStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnectingDrive, setDisconnectingDrive] = useState(false);
  const [disconnectingQB, setDisconnectingQB] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/google-drive/files").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/quickbooks/expenses").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([driveData, qbData]) => {
      if (driveData) setDrive({ connected: driveData.connected, email: driveData.email });
      if (qbData) setQB({ connected: qbData.connected, company_name: qbData.company_name });
      setLoading(false);
    });
  }, []);

  async function handleDriveDisconnect() {
    setDisconnectingDrive(true);
    await fetch("/api/google-drive/disconnect", { method: "POST" }).catch(() => {});
    setDrive({ connected: false, email: null });
    setDisconnectingDrive(false);
  }

  async function handleQBSync() {
    setSyncing(true);
    await fetch("/api/quickbooks/sync", { method: "POST" }).catch(() => {});
    setSyncing(false);
  }

  async function handleQBDisconnect() {
    setDisconnectingQB(true);
    await fetch("/api/quickbooks/disconnect", { method: "POST" }).catch(() => {});
    setQB({ connected: false });
    setDisconnectingQB(false);
  }

  if (loading) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 text-center">Integrations</p>

      {/* Google Workspace */}
      <div className="glass rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <span className="text-[10px] tracking-wider text-gray-400 font-medium">GW</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 font-light">Google Workspace</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Files, Docs &amp; Drive</p>
          </div>
          {drive.connected && (
            <span className="text-[9px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wider uppercase shrink-0">Connected</span>
          )}
        </div>
        {drive.connected ? (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light truncate">{drive.email}</p>
            <button
              onClick={handleDriveDisconnect}
              disabled={disconnectingDrive}
              className="text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"
            >
              {disconnectingDrive ? "..." : "Disconnect"}
            </button>
          </div>
        ) : (
          <a
            href="/api/google-drive/connect"
            className="block w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase text-center bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium"
          >
            Connect Google Workspace
          </a>
        )}
      </div>

      {/* QuickBooks */}
      <div className="glass rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <span className="text-[10px] tracking-wider text-gray-400 font-medium">QB</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 font-light">QuickBooks</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Expenses, Invoices &amp; Accounting</p>
          </div>
          {qb.connected && (
            <span className="text-[9px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 tracking-wider uppercase shrink-0">Connected</span>
          )}
        </div>
        {qb.connected ? (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light truncate">{qb.company_name}</p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleQBSync}
                disabled={syncing}
                className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={handleQBDisconnect}
                disabled={disconnectingQB}
                className="text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"
              >
                {disconnectingQB ? "..." : "Disconnect"}
              </button>
            </div>
          </div>
        ) : (
          <a
            href="/api/quickbooks/connect"
            className="block w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase text-center bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium"
          >
            Connect QuickBooks
          </a>
        )}
      </div>

    </div>
  );
}
