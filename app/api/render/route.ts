// app/api/render/route.ts
import Replicate from "replicate";
import { NextResponse } from "next/server";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Flux Kontext Max – set the exact version you got from the Replicate model page
const MODEL = "black-forest-labs/flux-kontext-max";
const VERSION = process.env.REPLICATE_KONTEXT_VERSION || ""; // optional override

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stylePrompt = (body?.stylePrompt ?? "").toString().trim();
    const summary = (body?.summary ?? "").toString().trim();
    const ref = (body?.ref ?? "").toString().trim();

    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt required" }, { status: 400 });
    }
    if (!ref) {
      return NextResponse.json({ error: "ref (input image URL) required" }, { status: 400 });
    }

    const prompt = stylePrompt; // you already combined text/layout rules upstream

    // Build input exactly as per Replicate docs
    const input: Record<string, any> = {
      prompt,
      input_image: ref,
      aspect_ratio: "match_input_image",
      output_format: "png",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    // Create prediction
    const prediction = await replicate.predictions.create({
      // either use explicit version or model name
      ...(VERSION ? { version: VERSION } : { model: MODEL }),
      input,
    });

    // Poll until done
    let pred = prediction;
    const started = Date.now();
    while (pred.status === "starting" || pred.status === "processing" || pred.status === "queued") {
      // small backoff
      await new Promise(r => setTimeout(r, 1200));
      pred = await replicate.predictions.get(pred.id);
      // (optional) hard timeout safeguard
      if (Date.now() - started > 120000) { // 2 min
        return NextResponse.json({ error: "Timed out waiting for image" }, { status: 504 });
      }
    }

    if (pred.status !== "succeeded") {
      return NextResponse.json({ error: pred.error || "Generation failed" }, { status: 500 });
    }

    // Flux returns an array of URLs; sometimes a single string.
    const out = pred.output as any;
    const url: string =
      (Array.isArray(out) ? out[0] : typeof out === "string" ? out : out?.image || out?.url) ?? "";

    if (!url) {
      return NextResponse.json({ error: "Model returned no image URL" }, { status: 502 });
    }

    return NextResponse.json({ url, predictionId: pred.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}