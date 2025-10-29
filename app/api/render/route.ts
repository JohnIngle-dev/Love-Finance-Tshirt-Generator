import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stylePrompt: string = body.stylePrompt || "";
    const summary: string = body.summary || "";
    const ref: string | undefined = body.ref; // absolute reference image URL
    const aspect: string = body.aspect || "match_input_image";

    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt required" }, { status: 400 });
    }
    if (!ref) {
      return NextResponse.json({ error: "ref (input_image URL) required" }, { status: 400 });
    }

    // Combine only what you need for the final prompt
    const fullPrompt = [stylePrompt.trim(), summary.trim()]
      .filter(Boolean)
      .join(" ");

    const input = {
      prompt: fullPrompt,
      input_image: ref,
      aspect_ratio: aspect,
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    console.log("[Flux input]", input);

    const output = await replicate.run("black-forest-labs/flux-kontext-max", { input });

    return NextResponse.json({ ok: true, input, output });
  } catch (err: any) {
    console.error("Flux render error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}