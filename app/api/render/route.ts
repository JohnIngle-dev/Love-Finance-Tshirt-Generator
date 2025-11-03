import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Replicate from "replicate";

export const runtime = "nodejs";

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function urlOk(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slogan } = await req.json();
    if (!slogan || typeof slogan !== "string" || !slogan.trim()) {
      return fail(400, "Missing 'slogan'.");
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return fail(500, "REPLICATE_API_TOKEN is not set.");

    const modelBase = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const version = process.env.REPLICATE_VERSION; // optional
    const modelRef = (version ? `${modelBase}:${version}` : modelBase) as
      | `${string}/${string}`
      | `${string}/${string}:${string}`;

    // folder is 'refs' in your repo
    const refDir = path.join(process.cwd(), "public", "refs");
    let files: string[];
    try {
      files = await fs.readdir(refDir);
    } catch {
      return fail(500, "Folder public/refs does not exist in the deployment. Create it and add images.");
    }

    const imageFiles = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (imageFiles.length === 0) {
      return fail(500, "No images found in public/refs. Add .png, .jpg or .webp files.");
    }

    const choice = imageFiles[Math.floor(Math.random() * imageFiles.length)];

    // Build absolute URL to the chosen image
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const imageUrl = `${proto}://${host}/refs/${encodeURIComponent(choice)}`;

    const reachable = await urlOk(imageUrl);
    if (!reachable) {
      return fail(500, "Reference image URL is not reachable.", { imageUrl });
    }

    const prompt = `replace text in image with "${slogan}"`;

    const replicate = new Replicate({ auth: token });

    // Inputs per Flux Kontext Max docs
    const input = {
      prompt,
      input_image: imageUrl,
      aspect_ratio: "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    const output = await replicate.run(modelRef, { input });

    // Coerce output into an array of URLs
    let resultImages: string[] = [];
    if (Array.isArray(output)) {
      resultImages = output.map((v) => (typeof v === "string" ? v : String(v)));
    } else if (typeof output === "string") {
      resultImages = [output];
    } else if (output && typeof output === "object" && "output" in (output as any)) {
      const out = (output as any).output;
      if (Array.isArray(out)) resultImages = out.map((v: unknown) => (typeof v === "string" ? v : String(v)));
      else if (typeof out === "string") resultImages = [out];
    }

    if (!resultImages.length) {
      return fail(502, "Replicate returned no images.", { modelRef, imageUrl, input });
    }

    return NextResponse.json({
      prompt,
      reference: imageUrl,
      result: resultImages,
      modelRef,
    });
  } catch (err) {
    console.error("render endpoint error", err);
    return fail(500, "Failed to render with Replicate.");
  }
}