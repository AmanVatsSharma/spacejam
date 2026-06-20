/**
 * File:        apps/web/src/app/api/changelog/route.ts
 * Module:      Web · API · Changelog
 * Purpose:     Returns the last 30 git commits as JSON for the /changelog page
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-04
 */

import { NextResponse } from "next/server";
import { execFileSync } from "node:child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const out = execFileSync(
      "git",
      ["log", "--pretty=format:%h%x09%an%x09%ad%x09%s", "--date=short", "-n", "30"],
      { cwd: process.cwd(), encoding: "utf-8" }
    );
    const commits = out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, author, date, ...rest] = line.split("\t");
        return { hash, author, date, subject: rest.join("\t") };
      });
    return NextResponse.json({ commits });
  } catch (err) {
    return NextResponse.json({ commits: [], error: String(err) }, { status: 500 });
  }
}
