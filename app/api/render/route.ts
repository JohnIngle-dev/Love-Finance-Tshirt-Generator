// app/api/render/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import Replicate from "replicate";

export const runtime = "nodejs";

// ───────────────────────────────────────────────────────────────────────────────
// Manifest: add/adjust entries here. Keyed by filename inside /public/refs.
// Each entry must include:
//   - replace: what visual element to swap out
//   - keep: what must be preserved in the image
// You can add as many as you like; unlisted files will use the DEFAULT_ENTRY.
// ───────────────────────────────────────────────────────────────────────────────
type ManifestEntry = { replace: string; keep: string };
const MANIFEST: Record<string, ManifestEntry> = {
  // EXAMPLES — edit to match the actual files in /public/refs
  // "tee_star.png":       { replace: "the centre star emblem", keep: "the shirt, fabric texture, lighting and background" },
  // "tee_badge.jpg":      { replace: "the chest badge graphic", keep: "the shirt, seams, fabric folds, background" },
  // "tee_skull.png":      { replace: "the skull motif", keep: "the shirt, perspective, fabric detail, background" },
  // "tee_circle.png":     { replace: "the circular logo", keep: "the shirt, colour, lighting and background" },
};

// Sensible fallback if a file isn't listed in MANIFEST yet
const DEFAULT_ENTRY: ManifestEntry = {
  replace: "the main graphic",
  keep: "the shirt, fabric texture, folds, colours, lighting and background",
};

// Utility: get manifest entry for file or fallback
function getEntryForFile(file: string): ManifestEntry {
  return MANIFEST[file] ?? DEFAULT_ENTRY;
}

// Build the public URL for a ref image in /public/refs
function refUrl(baseUrl: string, file: string) {
  return `${baseUrl}/refs/${encodeURIComponent(file)}`;
}

export async function POST(req: Request) {
  try {
    const { slogan, visual, file, excludeFile } = await req.json();

    if (!slogan || !visual) {
      return NextResponse.json(
        { error: "Missing required fields: slogan and visual" },
        { status: 400 }
      );
    }

    // Resolve deployment base URL
    const proto = (req.headers as any).get("x-forwarded-proto") || "https";
    const host = (req.headers as any).get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    // Resolve available reference images
    const refsDir = path.join(process.cwd(), "public", "refs");
    let files = await fs.readdir(refsDir).catch(() => []);
    files = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (!files.length) {
      return NextResponse.json(
        { error: "No reference images found in /public/refs" },
        { status: 500 }
      );
    }

    // Pick the file to use:
    //  - if client specified a file and it's present, use it
    //  - otherwise pick randomly (excluding excludeFile, if provided)
    let chosen = file && files.includes(file) ? file : undefined;
    if (!chosen) {
      const pool = excludeFile ? files.filter((f) => f !== excludeFile) : files;
      chosen = pool[Math.floor(Math.random() * pool.length)];
    }

    const entry = getEntryForFile(chosen!);

    // Your requested prompt structure
    const prompt = `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}, keep ${entry.keep}.`;

    // Prepare Replicate input
    const input = {
      prompt,
      input_image: refUrl(baseUrl, chosen!),
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN || "",
    });

    const model = "black-forest-labs/flux-kontext-max";
    const output = await replicate.run(model as `${string}/${string}`, { input });

    const resultImages = Array.isArray(output) ? output : [output];

    return NextResponse.json({
      prompt,
      visual,
      replace: entry.replace,
      keep: entry.keep,
      reference: refUrl(baseUrl, chosen!),
      file: chosen,
      result: resultImages,
      modelRef: model,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Render failed" },
      { status: 500 }
    );
  }
}