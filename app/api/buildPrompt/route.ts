
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  try{
    const { slogan='', refUrl='' } = await req.json();
    if(!slogan.trim() || !refUrl.trim()) return NextResponse.json({error:'slogan and refUrl required'}, {status:400});
    if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:'Missing OPENAI_API_KEY'}, {status:500});

    const system = [
      "You are a creative director and Flux-Kontext-Max prompt engineer.",
      "Input: a finance-themed slogan and a reference poster image URL.",
      "Output JSON with keys: prompt, layout, visual_summary.",
      "Rules:",
      "- Start prompt with: replace text with '...'.",
      "- Mirror reference headline casing (UPPERCASE vs lowercase).",
      "- If headline is warped/spiked, mention that (e.g., 'warp the headline').",
      "- Decide layout: single_top, stacked_top, or split_top_bottom based on the reference and readability.",
      "- Include one symbolic 'metal' motif (snake, sword, spikes, lightning, fire) AND one finance motif (calculator, spreadsheet, receipts, coins, bills, invoices, ledgers, computers).",
      "- Keep within sensitivity boundary level 2 (no gore/explicit/hate).",
      "- Return strictly JSON—no extra commentary."
    ].join("\n");

    const headers:any = { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" };
    if(process.env.OPENAI_PROJECT_ID){ headers["OpenAI-Project"] = process.env.OPENAI_PROJECT_ID; }

    const body = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: `Slogan: ${slogan}\nReference (analyse headline casing, line count, warp, composition). Follow rules and output JSON.` },
            { type: "image_url", image_url: { url: refUrl } }
          ]
        }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" }
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if(!r.ok){ const e = await r.text(); return NextResponse.json({error:e},{status:500}); }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const out = {
      prompt: String(parsed.prompt || "").trim(),
      layout: (parsed.layout==='stacked_top' || parsed.layout==='split_top_bottom') ? parsed.layout : 'single_top',
      visual_summary: String(parsed.visual_summary || "").trim()
    };
    return NextResponse.json(out);
  }catch(e:any){
    return NextResponse.json({error: e?.message || String(e)}, {status:500});
  }
}
