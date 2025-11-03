import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      project: process.env.OPENAI_PROJECT_ID,
    });

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "Reply with a JSON object {\"ok\":true} and nothing else." },
        { role: "user", content: "ping" },
      ],
    });

    const content = r.choices?.[0]?.message?.content?.trim() || "";
    return new NextResponse(content || "{\"ok\":true}", {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "openai_failed" }, { status: 500 });
  }
}