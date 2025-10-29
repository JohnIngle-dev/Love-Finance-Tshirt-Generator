import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept any of these from the client:
    // - stylePrompt (required)
    // - summary (optional)
    // - ref (string) OR refs (string[]) OR input_image (string)
    // - aspect (optional)
    const stylePrompt = (body?.stylePrompt ?? "").toString().trim();
    const summary = (body?.summary ?? "").toString().trim();

    // Normalise reference image into a single string
    let input_image: string | undefined =
      (body?.input_image || body?.ref || "") as string;

    if (!input_image && Array.isArray(body?.refs) && body.refs.length) {
      input_image = body.refs[0]; // take first if array provided
    }

    // Basic validation
    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt required" }, { status: 400 });
    }
    if (!input_image) {
      return NextResponse.json({ error: "ref / input_image required" }, { status: 400 });
    }
    // Must be a public URL (Replicate cannot fetch localhost)
    if (!/^https?:\/\//i.test(input_image)) {
      return NextResponse.json({ error: `input_image must be an absolute URL (got: ${input_image})` }, { status: 400 });
    }

    const aspect = (body?.aspect as string) || "match_input_image";

    // Compose final prompt
    const prompt =
      [stylePrompt, summary].filter(Boolean).join(" ");

    const input = {
      prompt,
      input_image,
      aspect_ratio: aspect,
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    // Log once for verification (remove later)
    console.log("[Flux-Kontext-Max] input:", JSON.stringify(input, null, 2));

    const output = await replicate.run("black-forest-labs/flux-kontext-max", { input });

    return NextResponse.json({ ok: true, input, output });
  } catch (err: any) {
    console.error("Flux render error:", err?.response ?? err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}