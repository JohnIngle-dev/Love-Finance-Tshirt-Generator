import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stylePrompt, summary, ref, aspect } = body;

    if (!stylePrompt) {
      return NextResponse.json({ error: "stylePrompt required" }, { status: 400 });
    }

    if (!ref) {
      return NextResponse.json({ error: "Missing reference image (ref)" }, { status: 400 });
    }

    // Combine text + summary into a single prompt string
    const fullPrompt = summary ? `${stylePrompt}. ${summary}` : stylePrompt;

    // ✅ Flux-Kontext-Max input structure (based on Replicate docs)
    const input = {
      prompt: fullPrompt,
      input_image: ref, // <-- THIS is the fix
      aspect_ratio: aspect || "match_input_image",
      output_format: "jpg",
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    console.log("[Flux-Kontext-Max] input →", JSON.stringify(input, null, 2));

    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-max/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Replicate error:", data);
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    console.log("[Flux-Kontext-Max] success →", data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Flux-Kontext render error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}