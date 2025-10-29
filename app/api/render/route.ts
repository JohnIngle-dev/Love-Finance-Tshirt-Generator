
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
const REPLICATE_URL = "https://api.replicate.com/v1/predictions";
export async function POST(req: NextRequest){
  try{
    if(!process.env.REPLICATE_API_TOKEN) return NextResponse.json({error:'Missing REPLICATE_API_TOKEN'},{status:500});
    if(!process.env.FLUX_VERSION) return NextResponse.json({error:'Missing FLUX_VERSION'},{status:500});
    const body = await req.json();
    const { stylePrompt='', refs=[], width=1024, height=1536, steps=28, guidance=4.5, styleStrength=0.9 } = body || {};
    if(!stylePrompt.trim()) return NextResponse.json({error:'stylePrompt required'}, {status:400});

    const input:any = { prompt: stylePrompt, width, height, num_inference_steps: steps, guidance };
    if(Array.isArray(refs) && refs.length>0){ input.reference_images = refs; input.style_strength = styleStrength; }

    const r = await fetch(REPLICATE_URL, {
      method:'POST',
      headers:{ 'Authorization':`Token ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ version: process.env.FLUX_VERSION, input }),
      cache: "no-store"
    });
    if(!r.ok){ const e = await r.text(); return NextResponse.json({error:e},{status:500}); }
    const prediction = await r.json();
    return NextResponse.json(prediction);
  }catch(e:any){
    return NextResponse.json({error: e?.message || String(e)}, {status:500});
  }
}
