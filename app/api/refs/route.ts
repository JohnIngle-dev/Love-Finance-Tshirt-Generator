// app/api/selectRef/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;           // no ISR cache

export async function GET(req: Request) {
  // Disable all caching at the edge/CDN level
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  };

  const refsDir = path.join(process.cwd(), "public", "refs");
  const files = fs.readdirSync(refsDir).filter(f =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );

  if (!files.length) {
    return NextResponse.json({ error: "No refs found in /public/refs" }, { status: 404, headers });
  }

  // true random pick on each request
  const pick = files[Math.floor(Math.random() * files.length)];

  // Use NEXT_PUBLIC_SITE_URL in prod; fall back to request host in dev
  const urlBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin;

  const url = `${urlBase}/refs/${encodeURIComponent(pick)}`;

  return NextResponse.json({ url, filename: pick }, { headers });
}