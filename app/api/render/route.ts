import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type MapEntry = { file: string; replace: string };

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function loadRefsMap(): Promise<MapEntry[]> {
  const fsPath = path.join(process.cwd(), "public", "refs-map.json");
  const raw = await fs.readFile(fsPath, "utf8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("refs-map.json is not a non-empty array");
  }
  const ok = json.every((i: any) => typeof i?.file === "string" && i.file && typeof i?.replace === "string" && i.replace);
  if (!ok) {
    throw new Error("refs-map.json entries must be { \"file\": \"name.png\", \"replace\": \"description\" }");
  }
  return json as MapEntry[];
}

// Optional: verify the image URL actually resolves in the deployed env
async function urlOk(url: string) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slogan, visual, file } = (await req.json()) as { slogan: string; visual: string; file?: string };

    if (!slogan || !visual) {
      return fail(400, "Missing 'slogan' or 'visual'.");
    }

    // Load manifest from filesystem (avoids Vercel 401 on internal fetch)
    let map: MapEntry[];
    try {
      map = await loadRefsMap();
    } catch (e: any) {
      return fail(500, "refs-map.json missing or invalid.", {
        expects: "public/refs-map.json as a non-empty array of { file, replace } with file extensions",
        reason: String(e?.message || e),
      });
    }

    // Choose entry (specific file if provided; else random)
    const entry = file ? map.find(m => m.file === file) || map[0] : map[Math.floor(Math.random() * map.length)];
    if (!entry) return fail(500, "No valid entry in refs-map.json.");

    // Build absolute URL for the reference image (must include extension in JSON)
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    const imageUrl = `${baseUrl}/refs/${encodeURIComponent(entry.file)}`;

    // Verify the image URL is publicly reachable before calling Replicate
    const reachable = await urlOk(imageUrl);
    if (!reachable) {
      return fail(500, "Reference image is not reachable at runtime.", {
        imageUrl,
        hint: "Ensure the file exists at public/refs/<name-with-extension> and is committed in this deployment.",
      });
    }

    // Compose model ref
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return fail(500, "REPLICATE_API_TOKEN not set.");
    const modelBase = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const version = process.env.REPLICATE_VERSION;
    const modelRef = (version ? `${modelBase}:${version}` : modelBase) as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

    // Single prompt
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
      prompt_upsampling: false,
    };

    let output: unknown;
    try {
      output = await replicate.run(modelRef, { input });
    } catch (e: any) {
      return fail(502, "Replicate run failed.", {
        modelRef,
        input,
        reason: String(e?.message || e),
      });
    }

    // Normalise outputs
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
      modelRef,
    });
  } catch (err: any) {
    console.error("render endpoint error", err?.stack || err);
    return fail(500, "Failed to render with Replicate.");
  }
}