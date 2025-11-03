import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const proto = (req.headers as any).get("x-forwarded-proto") || "https";
  const host = (req.headers as any).get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const fsPath = path.join(process.cwd(), "public", "refs-map.json");

  const out: any = { fsPath, baseUrl, refsUrl: `${baseUrl}/refs/` };

  try {
    const txt = await fs.readFile(fsPath, "utf8");
    out.fsOk = true;
    out.fsPreview = txt.slice(0, 500);
    const json = JSON.parse(txt);
    out.count = Array.isArray(json) ? json.length : 0;
    out.valid = Array.isArray(json) && json.every((i: any) => i?.file && i?.replace);
  } catch (e: any) {
    out.fsOk = false;
    out.fsError = String(e?.message || e);
  }

  return NextResponse.json(out);
}