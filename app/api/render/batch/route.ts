import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import Replicate from "replicate";
import { REFS_MANIFEST, type ManifestEntry } from "../render/refs-manifest";

export const runtime = "nodejs";

const DEFAULT_ENTRY: ManifestEntry = {
  replace: "the main graphic",
  keep: "the shirt, fabric texture, folds, colours, lighting and background",
};

function getEntry(file: string): ManifestEntry {
  return REFS_MANIFEST[file] ?? DEFAULT_ENTRY;
}
function refUrl(baseUrl: string, file: string) {
  return `${baseUrl}/refs/${encodeURIComponent(file)}`;
}
function buildPrompt(slogan: string, visual: string, entry: ManifestEntry) {
  // Your agreed structure
  return `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}, keep ${entry.keep}.`;
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  try {
    const { slogan, visual, count = 4, files, excludeFiles } = await req.json();

    if (!slogan || !visual) {
      return NextResponse.json({ error: "Missing required fields: slogan and visual" }, { status: 400 });
    }

    const proto = (req.headers as any).get("x-forwarded-proto") || "https";
    const host = (req.headers as any).get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const refsDir = path.join(process.cwd(), "public", "refs");
    let all = await fs.readdir(refsDir).catch(() => []);
    all = all.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (!all.length) {
      return NextResponse.json({ error: "No reference images found in /public/refs" }, { status: 500 });
    }

    // Build selection pool
    let pool = Array.isArray(files) && files.length
      ? all.filter((f) => files.includes(f))
      : all;

    if (Array.isArray(excludeFiles) && excludeFiles.length) {
      pool = pool.filter((f) => !excludeFiles.includes(f));
    }

    if (!pool.length) pool = all;

    const chosen = shuffle(pool).slice(0, Math.max(1, Math.min(4, count)));

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || "" });
    const model = "black-forest-labs/flux-kontext-max" as `${string}/${string}`;

    const results = await Promise.all(
      chosen.map(async (file: string) => {
        const entry = getEntry(file);
        const prompt = buildPrompt(slogan, visual, entry);
        const input = {
          prompt,
          input_image: refUrl(baseUrl, file),
          aspect_ratio: "match_input_image",
          output_format: "jpg",
          safety_tolerance: 2,
          prompt_upsampling: false,
        };
        const output = await replicate.run(model, { input });
        const imgs = Array.isArray(output) ? output : [output];

        return {
          file,
          reference: refUrl(baseUrl, file),
          prompt,
          visual,
          replace: entry.replace,
          keep: entry.keep,
          result: imgs,
        };
      })
    );

    return NextResponse.json({
      modelRef: model,
      count: results.length,
      items: results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Batch render failed" }, { status: 500 });
  }
}