import { NextResponse } from "next/server";
import { headers } from "next/headers";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "refs");
  const files = fs.readdirSync(dir).filter(f =>
    /\.(png|jpe?g|webp)$/i.test(f)
  );
  if (!files.length) {
    return NextResponse.json({ error: "No refs found" }, { status: 404 });
  }

  const pick = files[Math.floor(Math.random() * files.length)];
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

  // This is the critical absolute, publicly reachable URL:
  const url = `${base}/refs/${pick}`;

  return NextResponse.json({ url, filename: pick });
}