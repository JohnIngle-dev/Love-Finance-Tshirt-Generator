// app/api/render/route.ts
import Replicate from "replicate";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // use Node runtime for Replicate SDK

type Body = {
  prompt: string;           // full prompt to send
  refUrl: string;           // absolute URL to the reference image
  safety?: number;          // 0–5 (we default to 2)
  outputFormat?: "png" | "jpg" | "webp";
  upsample?: boolean;       // default false
};

export async function POST(req: Request) {
  try {
    const {
      prompt,
      refUrl,
      safety = 2,
      outputFormat = "png",
      upsample = false,
    } = (await req.json()) as Body;

    if (!prompt || !refUrl) {
      return NextResponse.json(
        { error: "prompt and refUrl required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Missing REPLICATE_API_TOKEN" },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Build Flux-Kontext-Max inputs (per Replicate docs)
    const input: Record<string, any> = {
      prompt,
      input_image: refUrl,
      aspect_ratio: "match_input_image",
      output_format: outputFormat,
      safety_tolerance: safety,
      prompt_upsampling: upsample,
    };

    console.log("[render] Flux-Kontext input:", JSON.stringify(input, null, 2));

    // Create prediction
    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-kontext-max",
      input,
    });

    // Poll until terminal state
    let pred: any = prediction;
    const terminal = new Set(["succeeded", "failed", "canceled", "aborted"]);
    while (!terminal.has(pred.status as string)) {
      await new Promise((r) => setTimeout(r, 1200));
      pred = await replicate.predictions.get(pred.id);
    }

    if (pred.status !== "succeeded") {
      console.error("[render] Prediction failed:", pred);
      return NextResponse.json(
        { error: JSON.stringify(pred.error ?? pred) },
        { status: 502 }
      );
    }

    // pred.output is usually a single URL string or array of URLs
    const out =
      Array.isArray(pred.output) && pred.output.length
        ? pred.output[0]
        : pred.output;

    if (!out || typeof out !== "string") {
      return NextResponse.json(
        { error: "No image URL returned from model" },
        { status: 502 }
      );
    }

    return NextResponse.json({ image: out, id: pred.id });
  } catch (err: any) {
    console.error("[render] Error:", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}