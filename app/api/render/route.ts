import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import Replicate from "replicate";
import { REFS_MANIFEST, type ManifestEntry } from "./refs-manifest";

export const runtime = "nodejs";

const DEFAULT_ENTRY: ManifestEntry = {
  replace: "the main graphic",
  keep: "the shirt, fabric texture, folds, colours, lighting and background",
};

function getEntryForFile(file: string): ManifestEntry {
  return REFS_MANIFEST[file] ?? DEFAULT_ENTRY;
}
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

    const proto = (req.headers as any).get("x-forwarded-proto") || "https";
    const host = (req.headers as any).get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const refsDir = path.join(process.cwd(), "public", "refs");
    let files = await fs.readdir(refsDir).catch(() => []);
    files = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (!files.length) {
      return NextResponse.json(
        { error: "No reference images found in /public/refs" },
        { status: 500 }
      );
    }

    // choose the reference file
    let chosen = file && files.includes(file) ? file : undefined;
    if (!chosen) {
      const pool = excludeFile ? files.filter((f) => f !== excludeFile) : files;
      chosen = pool[Math.floor(Math.random() * pool.length)];
    }

    const entry = getEntryForFile(chosen!);

    // Your requested prompt structure:
    const prompt = `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}, keep ${entry.keep}.`;

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

    // Include debug so you can verify whether we hit the manifest or fallback
    const usedFallback = REFS_MANIFEST[chosen!] ? false : true;

    return NextResponse.json({
      prompt,
      visual,
      replace: entry.replace,
      keep: entry.keep,
      reference: refUrl(baseUrl, chosen!),
      file: chosen,
      result: resultImages,
      modelRef: model,
      debug: { chosen, usedFallback, knownKeys: Object.keys(REFS_MANIFEST) },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Render failed" },
      { status: 500 }
    );
  }
}