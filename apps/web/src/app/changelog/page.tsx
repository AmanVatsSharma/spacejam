/**
 * File:        apps/web/src/app/changelog/page.tsx
 * Module:      Web · Changelog · Page
 * Purpose:     Client page that fetches and displays the last 30 git commits
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-04
 */

"use client";

import { useEffect, useState } from "react";

interface Commit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

export default function ChangelogPage() {
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
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">What&apos;s new</h1>
        <p className="text-sm text-[#6A7282] mt-1">
          Recent updates pushed to production. Refresh the page to see new changes.
        </p>
      </header>

      {commits === null && (
        <div
          className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#6A7282]"
          role="status"
          aria-live="polite"
        >
          Loading recent commits...
        </div>
      )}

      {commits !== null && error && (
        <div
          className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#EF4444]"
          role="alert"
        >
          Failed to load changelog: {error}
        </div>
      )}

      {commits !== null && !error && commits.length === 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#6A7282]">
          No commits found yet.
        </div>
      )}

      {commits !== null && !error && commits.length > 0 && (
        <ul className="flex flex-col gap-3">
          {commits.map((commit) => (
            <li
              key={commit.hash}
              className="bg-white border border-[#E5E7EB] rounded-xl p-4"
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
