import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { REFS_MANIFEST, type ManifestEntry } from "../refs-manifest";

export const runtime = "nodejs";

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

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
    const { slogan, visual, file } = (await req.json()) as {
      slogan: string;
      visual: string;
      file?: string;
    };

    if (!slogan || !visual) {
      return fail(400, "Missing 'slogan' or 'visual'.");
    }

    // Validate manifest
    const manifest: ManifestEntry[] = Array.isArray(REFS_MANIFEST) ? REFS_MANIFEST : [];
    if (!manifest.length) {
      return fail(500, "In-code manifest is empty.", {
        hint: "Edit app/api/refs-manifest.ts and add entries."
      });
    }

    const bad = manifest.find(m => !m?.file || !m?.replace);
    if (bad) {
      return fail(500, "Manifest entry missing 'file' or 'replace'.", { bad });
    }

    // Choose entry
    const entry =
      file
        ? manifest.find(m => m.file === file) || manifest[0]
        : manifest[Math.floor(Math.random() * manifest.length)];

    if (!entry) return fail(500, "No valid entry in manifest.");

    // Build image URL
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    const imageUrl = `${baseUrl}/refs/${encodeURIComponent(entry.file)}`;

    // Check reachability
    const reachable = await urlOk(imageUrl);
    if (!reachable) {
      return fail(500, "Reference image not reachable.", {
        imageTried: imageUrl,
        hint: "Ensure the file exists at public/refs/<filename-with-extension>."
      });
    }

    // Replicate setup
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return fail(500, "REPLICATE_API_TOKEN not set.");

    const modelBase = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const version = process.env.REPLICATE_VERSION;
    const modelRef = (version ? `${modelBase}:${version}` : modelBase) as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

    // Streamlined prompt
    const prompt = `Replace text in the image with "${slogan}", replace ${entry.replace} with ${visual}.`;

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

    let output: unknown;
    try {
      output = await replicate.run(modelRef, { input });
    } catch (e: any) {
      return fail(502, "Replicate run failed.", { modelRef, input, reason: String(e?.message || e) });
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
      modelRef
    });
  } catch (err: any) {
    return fail(500, "Failed to render with Replicate.", { reason: String(err?.message || err) });
  }
}