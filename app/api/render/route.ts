import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type MapEntry = { file: string; replace: string };

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// Load refs-map.json directly from the filesystem to avoid 401s on internal fetches
async function loadRefsMapFromFs(): Promise<MapEntry[]> {
  const fsPath = path.join(process.cwd(), "public", "refs-map.json");
  const raw = await fs.readFile(fsPath, "utf8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("refs-map.json is not a non-empty array");
  }
  const ok = json.every((i: any) => typeof i?.file === "string" && i.file && typeof i?.replace === "string" && i.replace);
  if (!ok) {
    throw new Error("refs-map.json entries must be objects like { \"file\": \"name.png\", \"replace\": \"description\" }");
  }
  return json as MapEntry[];
}

export async function POST(req: NextRequest) {
  try {
    const { slogan, visual, file } = (await req.json()) as { slogan: string; visual: string; file?: string };

    if (!slogan || !visual) {
      return fail(400, "Missing 'slogan' or 'visual'.");
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return fail(500, "REPLICATE_API_TOKEN not set.");

    // Compose model ref, optionally with a version hash
    const modelBase = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const version = process.env.REPLICATE_VERSION;
    const modelRef = (version ? `${modelBase}:${version}` : modelBase) as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

    // Build absolute base URL for serving images from /public
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    // Load refs map from filesystem (robust on Vercel)
    const map = await loadRefsMapFromFs();

    // Choose the entry (specific file if provided, else random)
    const entry = file ? map.find(m => m.file === file) || map[0] : map[Math.floor(Math.random() * map.length)];
    if (!entry) return fail(500, "No valid entry in refs-map.json.");

    // Important: entry.file must include its extension (e.g. .png/.jpg/.webp)
    const imageUrl = `${baseUrl}/refs/${encodeURIComponent(entry.file)}`;

    // Single prompt using your lookup and selected visual
    const prompt =
      `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}. ` +
      "Keep composition natural; preserve garment texture and folds. No bevel or glow. " +
      "Avoid faces, people, weapons, logos, or religious symbols.";

    // Call Replicate
    const replicate = new Replicate({ auth: token });
    const input = {
      prompt,
      input_image: imageUrl,
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false
    };

    const output = await replicate.run(modelRef, { input });

    // Normalise Replicate outputs
    let resultImages: string[] = [];
    if (Array.isArray(output)) {
      resultImages = output.map(v => (typeof v === "string" ? v : String(v)));
    } else if (typeof output === "string") {
      resultImages = [output];
    } else if (output && typeof output === "object" && "output" in (output as any)) {
      const out = (output as any).output;
      if (Array.isArray(out)) resultImages = out.map((v: unknown) => (typeof v === "string" ? v : String(v)));
      else if (typeof out === "string") resultImages = [out];
    }

    if (!resultImages.length) {
      return fail(502, "Replicate returned no images.", { modelRef, input });
    }

    return NextResponse.json({
      prompt,
      reference: imageUrl,
      visual,
      replace: entry.replace,
      file: entry.file,
      result: resultImages,
      modelRef
    });
  } catch (err) {
    console.error("render endpoint error", err);
    return fail(500, "Failed to render with Replicate.");
  }
}