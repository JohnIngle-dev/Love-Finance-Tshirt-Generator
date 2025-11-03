import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

type MapEntry = { file: string; replace: string };

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slogan, visual, file } = (await req.json()) as { slogan: string; visual: string; file?: string };
    if (!slogan || !visual) return fail(400, "Missing 'slogan' or 'visual'.");

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return fail(500, "REPLICATE_API_TOKEN not set.");

    const modelBase = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const version = process.env.REPLICATE_VERSION;
    const modelRef = (version ? `${modelBase}:${version}` : modelBase) as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    // Load the simple map
    const mapUrl = `${baseUrl}/refs-map.json`;
    const map = await fetchJson<MapEntry[]>(mapUrl, []);
    if (!map.length) return fail(500, "refs-map.json missing or empty.");

    // Choose entry
    const entry = file ? map.find(m => m.file === file) || map[0] : map[Math.floor(Math.random() * map.length)];
    if (!entry) return fail(500, "No valid entry in refs-map.json.");

    const imageUrl = `${baseUrl}/refs/${encodeURIComponent(entry.file)}`;

    // Single prompt
    const prompt =
      `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}. ` +
      "Keep composition natural; preserve garment texture and folds. No bevel or glow. " +
      "Avoid faces, people, weapons, logos, or religious symbols.";

    // Replicate call
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

    let resultImages: string[] = [];
    if (Array.isArray(output)) resultImages = output.map(v => (typeof v === "string" ? v : String(v)));
    else if (typeof output === "string") resultImages = [output];
    else if (output && typeof output === "object" && "output" in (output as any)) {
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