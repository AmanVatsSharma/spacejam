/**
 * File:        apps/web/src/app/dashboard/loading.tsx
 * Module:      Web · Dashboard · Loading
 * Purpose:     Route-level loading UI shown by Next.js while the
 *              /dashboard/* segment streams in. Centered spinner + pulse
 *              animation, kept consistent with the app's orange accent.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
 */

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16">
      {/* Spinner */}
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border-4 border-[#FF6A2F]/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#FF6A2F]" />
      </div>

      {/* Pulsing label */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-ping rounded-full bg-[#FF6A2F]" />
        <p className="text-sm font-medium text-[#4A5565]">Loading...</p>
      </div>
    </div>
  );
}
