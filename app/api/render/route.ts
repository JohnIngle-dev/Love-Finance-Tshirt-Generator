import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Replicate from "replicate";

export async function POST(req: NextRequest) {
  try {
    const { slogan } = await req.json();
    if (!slogan || typeof slogan !== "string") {
      return NextResponse.json({ error: "Missing 'slogan'." }, { status: 400 });
    }

    // Pick a random ref image from /public/ref
    const refDir = path.join(process.cwd(), "public", "ref");
    let files = await fs.readdir(refDir);
    files = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f));
    if (!files.length) {
      return NextResponse.json({ error: "No reference images found in public/ref." }, { status: 500 });
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

    // Model: use the Flux Kontext Max ID you already use in this repo.
    // If you keep it in envs, set REPLICATE_MODEL to that full model ref.
    // Example placeholder below – replace if you hardcode in your project:
    const model = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";

    // Inputs vary by model; these names match typical Replicate models that accept an image+prompt.
    // If your model expects different keys (e.g. 'command' or 'edit_prompt'), rename accordingly.
    const input: Record<string, unknown> = {
      prompt,
      image: imageUrl,
    };

    const output = await replicate.run(model, { input });

    // Replicate outputs are usually an array of image URLs; handle string or array safely:
    const resultImages = Array.isArray(output) ? output : [output];

    return NextResponse.json({
      prompt,
      reference: imageUrl,
      result: resultImages,
    });
  } catch (err) {
    console.error("render endpoint error", err);
    return NextResponse.json({ error: "Failed to render with Replicate." }, { status: 500 });
  }
}