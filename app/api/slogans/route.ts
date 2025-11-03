import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID, // optional, but you said you have one
});

function coerceJsonArray(input: string): string[] {
  if (!input) return [];
  const cleaned = input
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.filter(s => typeof s === "string");
  } catch {}
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
      "You are the lead singer of a metal band writing t-shirt slogans. " +
      "Only produce safe, clean content: strictly avoid profanity, slurs, hate, sexual content, or harassment. " +
      "Each slogan must be 1–4 words, no emojis, no numbering. " +
      "Return ONLY a JSON array of strings.";

    const user =
      `The fan loves this about finance: “${love}”. ` +
      "Write EXACTLY 3 metal-style slogans that celebrate it. " +
      "Lean into aggression, grit, and stage-command energy; avoid clichés like 'to the moon'. " +
      "Return JSON array only.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
    });

    let content = completion.choices?.[0]?.message?.content ?? "";
    let ideas = coerceJsonArray(content);

    if (ideas.length !== 3) {
      const fixer = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "Return EXACTLY 3 items as a JSON array of strings. Each item 1–4 words, clean language." },
          { role: "user", content },
        ],
      });
      content = fixer.choices?.[0]?.message?.content ?? "";
      ideas = coerceJsonArray(content).slice(0, 3);
    }

    if (!ideas.length) {
      return NextResponse.json({ error: "No slogans generated." }, { status: 422 });
    }

    return NextResponse.json({ slogans: ideas.slice(0, 3) });
  } catch (err) {
    console.error("slogans endpoint error", err);
    return NextResponse.json({ error: "Failed to generate slogans." }, { status: 500 });
  }
}