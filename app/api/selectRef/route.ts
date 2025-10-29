
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function GET(){
  const dir = path.join(process.cwd(), "public", "refs");
  const files = await readdir(dir).catch(()=>[]);
  const images = files.filter(f=>/\.(png|jpe?g|webp)$/i.test(f));
  if(!images.length) return NextResponse.json({error:'No refs found in /public/refs'}, {status:404});
  const pick = images[Math.floor(Math.random()*images.length)];
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base}/refs/${encodeURIComponent(pick)}`;
  return NextResponse.json({ url, filename: pick });
}
