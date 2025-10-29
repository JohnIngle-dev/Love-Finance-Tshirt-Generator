import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept either {stylePrompt, summary, ref} or {prompt, input_image}
    const stylePrompt = (body?.stylePrompt ?? body?.prompt ?? "").toString().trim();
    const summary     = (body?.summary ?? "").toString().trim();

    // Normalise the reference image to a single public URL
    let input_image: string | undefined = body?.input_image || body?.ref;
    if (!input_image && Array.isArray(body?.refs) && body.refs.length) {
      input_image = body.refs[0];
    }

    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt required" }, { status: 400 });
    }
    if (!input_image) {
      return NextResponse.json({ error: "ref / input_image required" }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(input_image)) {
      return NextResponse.json({ error: `input_image must be an absolute URL (got: ${input_image})` }, { status: 400 });
    }

    const aspect = (body?.aspect as string) || "match_input_image";

    // Build the exact prompt Flux should see
    const prompt = [stylePrompt, summary].filter(Boolean).join(" ");

    // The ONLY fields Kontext-Max expects
    const input = {
      prompt,
      input_image,
      aspect_ratio: aspect,
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    // Log what we’re actually sending to Replicate (for debugging)
    console.log("[Flux-Kontext-Max] input ->", JSON.stringify(input, null, 2));

    const output = await replicate.run("black-forest-labs/flux-kontext-max", { input });
    return NextResponse.json({ ok: true, input, output });
  } catch (err: any) {
    console.error("Flux render error:", err?.response ?? err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}