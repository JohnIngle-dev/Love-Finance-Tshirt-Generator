import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Replicate from "replicate";

// Force Node runtime (fs and path need it)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { slogan } = await req.json();
    if (!slogan || typeof slogan !== "string") {
      return NextResponse.json({ error: "Missing 'slogan'." }, { status: 400 });
    }

    // Pick a random ref image from /public/ref
    const refDir = path.join(process.cwd(), "public", "ref");
    let files = await fs.readdir(refDir);
    files = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!files.length) {
      return NextResponse.json(
        { error: "No reference images found in public/ref." },
        { status: 500 }
      );
    }
    const choice = files[Math.floor(Math.random() * files.length)];

    // Build a public URL to the ref image (works on Vercel)
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const imageUrl = `${proto}://${host}/ref/${encodeURIComponent(choice)}`;

    // Your exact prompt
    const prompt = `replace text in image with "${slogan}"`;

    // Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Compose model reference with optional version, then cast to the SDK's template literal types.
    // e.g. "black-forest-labs/flux-kontext-max:abcdef1234..."
    const modelBase =
      process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
    const modelVersion = process.env.REPLICATE_VERSION; // optional
    const modelRef = (modelVersion
      ? `${modelBase}:${modelVersion}`
      : modelBase) as `${string}/${string}` | `${string}/${string}:${string}`;

    // Inputs vary by model; adjust keys if your model expects different names.
    const input: Record<string, unknown> = {
      prompt,
      image: imageUrl,
    };

    // The SDK type for run() wants the template-form modelRef (cast above).
    const output = (await replicate.run(modelRef, {
      input,
    })) as unknown;

    // Coerce output into an array of URLs/strings
    let resultImages: string[] = [];
    if (Array.isArray(output)) {
      resultImages = output.map((v) => (typeof v === "string" ? v : String(v)));
    } else if (typeof output === "string") {
      resultImages = [output];
    } else if (output && typeof output === "object" && "output" in (output as any)) {
      const out = (output as any).output;
      if (Array.isArray(out)) {
        resultImages = out.map((v: unknown) => (typeof v === "string" ? v : String(v)));
      } else if (typeof out === "string") {
        resultImages = [out];
      }
    }

    return NextResponse.json({
      prompt,
      reference: imageUrl,
      result: resultImages,
    });
  } catch (err) {
    console.error("render endpoint error", err);
    return NextResponse.json(
      { error: "Failed to render with Replicate." },
      { status: 500 }
    );
  }
}