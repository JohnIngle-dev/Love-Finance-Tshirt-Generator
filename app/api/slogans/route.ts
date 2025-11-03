import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID, // <- pick up your Project ID if set
});

function coerceJsonArray(input: string): string[] {
  if (!input) return [];
  // strip code fences if any
  const cleaned = input
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  // try JSON first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.filter(s => typeof s === "string");
  } catch {}

  // fallback: split lines -> 1–4 words only
  return cleaned
    .split(/\r?\n/)
    .map(s => s.replace(/^\d+[\.)-]\s*/, "").trim())
    .filter(Boolean)
    .filter(s => s.split(/\s+/).length <= 4);
}

export async function POST(req: NextRequest) {
  try {
    const { love } = await req.json();

    if (typeof love !== "string" || !love.trim()) {
      return NextResponse.json({ error: "Missing 'love' string." }, { status: 400 });
    }

    const system =
      "You are a copywriter for rock/metal-style t-shirts. " +
      "Only produce safe, clean content: strictly avoid profanity, slurs, hate, sexual content, or harassment. " +
      "Each slogan must be 1–4 words, no emojis, no numbering. " +
      "Return ONLY a JSON array of strings.";

    const user =
      `User loves this about finance: “${love}”. ` +
      "Write 12 rock/metal-style t-shirt slogans that celebrate it. " +
      "Avoid clichés like 'to the moon'. Return JSON array only.";

    // Use Chat Completions for consistent shape
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
    });

    let content = completion.choices?.[0]?.message?.content ?? "";

    // If the model ignored the JSON instruction, repair it with a second pass
    let ideas = coerceJsonArray(content);

    if (!ideas.length) {
      const fixer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "Convert the user content into a JSON array of 1–4 word clean slogans. Output JSON only." },
          { role: "user", content },
        ],
      });
      content = fixer.choices?.[0]?.message?.content ?? "";
      ideas = coerceJsonArray(content);
    }

    // final tidy: cap at 12 and dedupe (case-insensitive)
    const seen = new Set<string>();
    const out = ideas
      .map(s => s.trim())
      .filter(s => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
      .slice(0, 12);

    if (!out.length) {
      return NextResponse.json({ error: "No slogans generated." }, { status: 422 });
    }

    return NextResponse.json({ slogans: out });
  } catch (err) {
    console.error("slogans endpoint error", err);
    return NextResponse.json({ error: "Failed to generate slogans." }, { status: 500 });
  }
}