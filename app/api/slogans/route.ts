import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

// Keep visuals drawable and on-theme
const ALLOWED_VISUALS = [
  "calculator","coins","bar chart","line chart","pie chart",
  "spreadsheet","ledger","receipt","vault","safe","banknote",
  "credit card","piggy bank","briefcase","computer","keyboard",
  "arrow up","arrow down"
] as const;

type Option = { slogan: string; visual: string };

function coerceOptions(input: string): Option[] {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed
        .map((o: any) => ({
          slogan: String(o?.slogan || "").trim(),
          visual: String(o?.visual || "").trim().toLowerCase(),
        }))
        .filter(o => o.slogan && o.slogan.split(/\s+/).length <= 4 && ALLOWED_VISUALS.includes(o.visual as any))
        .slice(0, 3);
    }
  } catch {}
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const { love } = await req.json();
    if (typeof love !== "string" || !love.trim()) {
      return NextResponse.json({ error: "Missing 'love' string." }, { status: 400 });
    }

    const system =
      "You are the lead singer of a metal band writing t-shirt slogans. " +
      "Only produce safe, clean content. Strictly no profanity, slurs, sexual content, harassment, or hate. " +
      "Each slogan must be 1–4 words. No emojis, no numbering. " +
      "For each slogan, choose ONE visual motif that fits finance and the slogan. " +
      `The motif MUST be chosen ONLY from this list: ${ALLOWED_VISUALS.join(", ")}. ` +
      "Reply as pure JSON: an array of exactly 3 objects, each {\"slogan\":\"...\", \"visual\":\"...\"}. " +
      "Lower-case the visual. No extra text.";

    const user =
      `The fan loves this about finance: “${love}”. ` +
      "Write exactly 3 metal-style slogans with matching visuals. " +
      "Avoid clichés like 'to the moon'. JSON only.";

    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    let raw = r.choices?.[0]?.message?.content?.trim() || "";
    let options = coerceOptions(raw);

    if (options.length !== 3) {
      const fix = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "Return JSON array of exactly 3 items {\"slogan\":\"...\",\"visual\":\"...\"}. Visual must be from the allowed list and lower-case. Slogan 1–4 words." },
          { role: "user", content: raw },
        ],
      });
      raw = fix.choices?.[0]?.message?.content?.trim() || "[]";
      options = coerceOptions(raw);
    }

    if (options.length !== 3) {
      return NextResponse.json({ error: "Failed to generate options." }, { status: 422 });
    }

    return NextResponse.json({ options });
  } catch (err) {
    console.error("slogans endpoint error", err);
    return NextResponse.json({ error: "Failed to generate options." }, { status: 500 });
  }
}