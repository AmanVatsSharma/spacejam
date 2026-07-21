/**
 * File:        apps/web/src/app/dashboard/calendar-sync/page.tsx
 * Module:      Web · Dashboard · Calendar Sync
 * Purpose:     External calendar connection management — Google / Outlook.
 *              Connect, disconnect, sync, toggle.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
"use client";

import { useState } from "react";
import { useCalendarConnections, useCalendarSyncMutations, CalendarProvider } from "@/hooks/use-enterprise";
import { QueryLoading, QueryError } from "@/components/ui/query-status";
import { toast } from "sonner";

export default function CalendarSyncPage() {
  const userId = (typeof window !== "undefined" && (window as any).__CURRENT_USER_ID__) || "";
  const { connections, loading, error, refetch } = useCalendarConnections(userId);
  const { connect, disconnect, sync, toggle } = useCalendarSyncMutations();

  const [connectForm, setConnectForm] = useState<{ provider: CalendarProvider; email: string } | null>(null);

  const handleConnect = async (provider: CalendarProvider) => {
    // Real flow: redirect to OAuth provider. Stubbed for demo.
    toast.info(`Connect to ${provider} would redirect to OAuth flow here.`);
    setConnectForm(null);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-[#1F1F1F]">Calendar Sync</h1>
      <p className="text-sm text-[#6A7282]">Two-way sync with Google Calendar, Outlook, and Apple Calendar. Bookings flow to your external calendar automatically.</p>

      {loading && <QueryLoading />}
      {error && <QueryError error={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['GOOGLE', 'OUTLOOK', 'APPLE'] as CalendarProvider[]).map((provider) => {
          const conn = connections.find((c: any) => c.provider === provider);
          return (
            <div key={provider} className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#1F1F1F]">{provider}</h3>
                {conn && <span className={`px-2 py-1 rounded-full text-xs ${conn.syncEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{conn.syncEnabled ? "Synced" : "Paused"}</span>}
              </div>
              {conn ? (
                <>
                  <p className="text-sm text-[#4A5565]">{conn.email ?? "Connected"}</p>
                  <p className="text-xs text-[#6A7282] mt-1">Last sync: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : "Never"}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => sync(conn.id)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">Sync now</button>
                    <button onClick={() => toggle(conn.id, !conn.syncEnabled)} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg">{conn.syncEnabled ? "Pause" : "Resume"}</button>
                    <button onClick={() => disconnect(conn.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg">Disconnect</button>
                  </div>
                </>
              ) : (
                <button onClick={() => handleConnect(provider)} className="w-full px-3 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium">
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}