// app/api/render/route.ts
import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60; // Vercel serverless max for this route

type RenderBody = {
  prompt: string;
  refUrl: string;                 // absolute URL to /public/refs/xxx.png
  safetyTolerance?: number;       // default 2
  aspect?: "match_input_image"|"1:1"|"2:3"|"3:2"|"16:9"|"9:16";
};

const MODEL = "black-forest-labs/flux-kontext-max";

export async function POST(req: Request) {
  try {
    const { prompt, refUrl, safetyTolerance = 2, aspect = "match_input_image" } = await req.json() as RenderBody;

    if (!prompt || !refUrl) {
      return NextResponse.json({ error: "prompt and refUrl required" }, { status: 400 });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Kick off a prediction
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        prompt,
        input_image: refUrl,       // << send your reference image
        aspect_ratio: aspect,
        output_format: "jpg",
        safety_tolerance: safetyTolerance,
        prompt_upsampling: false,
      },
    });

    // Poll until done (within 60s route budget)
    let pred = prediction;
    const start = Date.now();
    while (["starting","processing","queued"].includes(pred.status)) {
      if (Date.now() - start > 55000) {
        return NextResponse.json({ error: "timeout waiting for model" }, { status: 504 });
      }
      await new Promise(r => setTimeout(r, 1200));
      pred = await replicate.predictions.get(pred.id);
    }

    if (pred.status !== "succeeded") {
      return NextResponse.json({ error: pred.error ?? `model status: ${pred.status}` }, { status: 500 });
    }

    // Flux Kontext Max returns a single URL
    const out = (pred.output ?? []) as string[] | string;
    const url = Array.isArray(out) ? out[0] : out;

    if (!url) {
      return NextResponse.json({ error: "No image URL returned from model" }, { status: 502 });
    }

    return NextResponse.json({ url, id: pred.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}