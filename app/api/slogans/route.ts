import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { love } = await req.json();

    if (typeof love !== "string" || !love.trim()) {
      return NextResponse.json({ error: "Missing 'love' string." }, { status: 400 });
    }

    const system =
      "You are a copywriter for rock/metal-style t-shirts. " +
      "Produce only safe, clean content. Strictly avoid profanity, slurs, hate, sexual content, or harassment. " +
      "Each slogan must be between 1 and 4 words long. " +
      "No emojis, no numbering. Return only a JSON array of strings.";

    const user =
      `User loves this about finance: “${love}”. ` +
      "Write 12 rock/metal-style t-shirt slogans that celebrate it. " +
      "Avoid clichés like 'to the moon'. Return JSON array only.";

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.8
    });

    const raw = resp.output_text ?? "";
    let ideas: string[] = [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) ideas = parsed;
    } catch {
      // If not JSON, re-ask the model to fix it
      const fix = await client.responses.create({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: "Convert this text into a JSON array of clean slogans." },
          { role: "user", content: raw }
        ]
      });
      try {
        const repaired = JSON.parse(fix.output_text ?? "[]");
        if (Array.isArray(repaired)) ideas = repaired;
      } catch {
        ideas = [];
      }
    }

    if (!ideas.length) {
      return NextResponse.json({ error: "No slogans generated." }, { status: 422 });
    }

    return NextResponse.json({ slogans: ideas.slice(0, 12) });
  } catch (err) {
    console.error("slogans endpoint error", err);
    return NextResponse.json({ error: "Failed to generate slogans." }, { status: 500 });
  }
}