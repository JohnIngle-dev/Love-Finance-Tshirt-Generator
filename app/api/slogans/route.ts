
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  const { love='' } = await req.json();
  if(!love.trim()) return NextResponse.json({error:'Missing input.'},{status:400});

  const prompt = `User loves this about finance: "${love}".
Generate 3 short, punchy, SAFE metal-style slogans (2–5 words) strictly about finance (control, compliance, profit, efficiency, budgets, tax, approvals, procurement).
Return JSON array of strings only.`;

  try{
    if(process.env.USE_REPLICATE_LLM==='true'){
      if(!process.env.REPLICATE_API_TOKEN) return NextResponse.json({error:'Missing REPLICATE_API_TOKEN'},{status:500});
      const model = process.env.REPLICATE_LLM || 'meta/meta-llama-3-8b-instruct';
      const r = await fetch('https://api.replicate.com/v1/models/'+model+'/predictions', {
        method:'POST',
        headers:{ 'Authorization':`Token ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ input:{ prompt } })
      });
      if(!r.ok){ const e = await r.text(); return NextResponse.json({error:e},{status:500}); }
      const data = await r.json();
      const text = JSON.stringify(data);
      const match = text.match(/\[\s*\".*?\"\s*(?:,\s*\".*?\")*\s*\]/s);
      const options = match? JSON.parse(match[0]) : ['FINANCE FURY','CONTROL THE CASH','BUDGET BRUTALITY'];
      return NextResponse.json({ options });
    }else{
      if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:'Missing OPENAI_API_KEY'},{status:500});
      const headers:any = { 'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' };
      if(process.env.OPENAI_PROJECT_ID){ headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID; }
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers,
        body: JSON.stringify({
          model:'gpt-4o-mini',
          messages:[
            { role:'system', content:'Only output a JSON array of 2–3 safe, finance-themed metal slogans. No extra text.' },
            { role:'user', content: prompt }
          ],
          temperature:0.8
        })
      });
      if(!r.ok){ const e = await r.text(); return NextResponse.json({error:e},{status:500}); }
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || '[]';
      let options:string[] = [];
      try { options = JSON.parse(content) } catch { options = [content] }
      options = options.map((s:string)=>s.replace(/[\n\r]+/g,' ').trim()).filter(Boolean).slice(0,3);
      if(options.length<2) options=['FINANCE FURY','CONTROL THE CASH','BUDGET BRUTALITY'];
      return NextResponse.json({ options });
    }
  }catch(e:any){
    return NextResponse.json({error: e?.message || String(e)}, {status:500});
  }
}
