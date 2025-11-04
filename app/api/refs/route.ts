import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { REFS_MANIFEST } from "../render/refs-manifest";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const proto = (req.headers as any).get("x-forwarded-proto") || "https";
  const host = (req.headers as any).get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  const refsDir = path.join(process.cwd(), "public", "refs");
  try {
    let files = await fs.readdir(refsDir);
    files = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

    const items = files.map((f) => ({
      file: f,
      url: `${baseUrl}/refs/${encodeURIComponent(f)}`,
      inManifest: Boolean(REFS_MANIFEST[f]),
      manifestSnippet: REFS_MANIFEST[f]
        ? undefined
        : `"${f}": { replace: "the main graphic", keep: "the shirt, fabric texture, folds, colours, lighting and background" }`,
    }));

    return NextResponse.json({
      count: items.length,
      manifestKeys: Object.keys(REFS_MANIFEST),
      missingInManifest: items.filter((i) => !i.inManifest).map((i) => i.file),
      items,
      tip: "Copy any missing filenames and add them to app/api/render/refs-manifest.ts",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || e || "Failed to read /public/refs" },
      { status: 500 }
    );
  }
}