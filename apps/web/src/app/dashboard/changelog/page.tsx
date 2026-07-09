"use client";

/**
 * File:        apps/web/src/app/dashboard/changelog/page.tsx
 * Module:      Web · Dashboard · Changelog · Page
 * Purpose:     Client page that fetches and displays the last git commits.
 *              Lives inside the dashboard layout so the "What's new" tab
 *              does not navigate away from the dashboard shell.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
 */

import { useEffect, useState } from "react";

interface Commit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export default function DashboardChangelogPage() {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/changelog")
      .then((res) => res.json())
      .then((data: { commits?: Commit[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setCommits([]);
        } else {
          setCommits(data.commits ?? []);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(String(err));
        setCommits([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold text-[#101828]">What&apos;s new</h1>
        <p className="text-sm text-[#4A5565] mt-1">
          Recent updates pushed to production. Refresh the page to see new changes.
        </p>
      </header>

      {commits === null && (
        <div
          className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm text-[#6A7282]"
          role="status"
          aria-live="polite"
        >
          Loading recent commits...
        </div>
      )}

      {commits !== null && error && (
        <div
          className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm text-[#EF4444]"
          role="alert"
        >
          Failed to load changelog: {error}
        </div>
      )}

      {commits !== null && !error && commits.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm text-[#6A7282]">
          No commits found yet.
        </div>
      )}

      {commits !== null && !error && commits.length > 0 && (
        <ul className="flex flex-col gap-3">
          {commits.map((commit) => (
            <li
              key={commit.hash}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-baseline gap-3 flex-wrap">
                <code className="font-mono text-sm text-[#FF6A2F] font-semibold">
                  {commit.hash}
                </code>
                <span className="text-xs text-[#9CA3AF]">
                  {commit.date} &middot; {commit.author}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#1F1F1F] break-words">
                {commit.subject}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
