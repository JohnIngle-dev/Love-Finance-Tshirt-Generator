import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SLOGAN_PROMPT } from "./prompt-template";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { love } = await req.json();
    if (!love) {
      return NextResponse.json({ error: "Missing input 'love'" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = SLOGAN_PROMPT.replace("{{love}}", love);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";

    let options;
    try {
      options = JSON.parse(raw);
    } catch {
      // try to salvage partial JSON
      const match = raw.match(/\[.*\]/s);
      options = match ? JSON.parse(match[0]) : [];
    }

    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: "No slogans generated" }, { status: 500 });
    }

    return NextResponse.json({ options });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to generate slogans" }, { status: 500 });
  }
}