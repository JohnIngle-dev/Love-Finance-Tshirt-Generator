
'use client'
import { useState } from 'react'
import { startRender, pollPrediction } from '@/lib/replicate'

async function pickRandomRef(): Promise<string> {
  const r = await fetch('/api/selectRef')
  const data = await r.json()
  if (data?.url) return data.url
  throw new Error(data?.error || 'No reference found')
}

async function buildPrompt(slogan: string, refUrl: string) {
  const r = await fetch('/api/buildPrompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slogan, refUrl })
  })
  const data = await r.json()
  if (data?.error) throw new Error(data.error)
  return data as { prompt: string; layout: 'single_top'|'stacked_top'|'split_top_bottom'; visual_summary: string }
}

export default function Page(){
  const [love,setLove]=useState('')
  const [options,setOptions]=useState<string[]>([])
  const [selected,setSelected]=useState('')
  const [refUrl,setRefUrl]=useState<string>('')
  const [plan,setPlan]=useState<{prompt:string,layout:string,visual_summary:string}|null>(null)
  const [imgUrl,setImgUrl]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  async function getSlogans(){
    setError(''); setOptions([]); setSelected(''); setImgUrl(''); setRefUrl(''); setPlan(null)
    const r = await fetch('/api/slogans', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ love })})
    const data = await r.json()
    if(data.error){ setError(data.error); return }
    setOptions(data.options || [])
  }

  async function generate(){
    try{
      if(!selected) { setError('Pick a slogan first'); return }
      setBusy(true); setError(''); setImgUrl('')

      const ref = await pickRandomRef()
      setRefUrl(ref)

      const p = await buildPrompt(selected, ref)
      setPlan(p)

      const pred = await startRender({
        stylePrompt: p.prompt,
        refs: [ref],
        width: 1024,
        height: 1536,
        steps: 28,
        guidance: 4.5,
        styleStrength: 0.9
      })
      const done = await pollPrediction(pred)
      const out = Array.isArray(done.output) ? done.output[0] : done.output
      setImgUrl(out || '')

    }catch(e:any){
      setError(e?.message || String(e))
    }finally{
      setBusy(false)
    }
  }

  return (
    <main style={{maxWidth:820, margin:'40px auto', padding:'0 16px', fontFamily:'Inter, system-ui, Arial'}}>
      <h1 style={{fontWeight:700,fontSize:28}}>Love Finance — Kontext Posters</h1>
      <p style={{opacity:0.8}}>Tell me what you love about finance → get metal-style slogans → auto-pick a reference → build a kontext-friendly prompt → generate with Flux-Kontext-Max.</p>

      <div style={{marginTop:24}}>
        <label>What do you love about finance?</label>
        <textarea value={love} onChange={e=>setLove(e.target.value)} rows={3} style={{width:'100%',padding:8}} placeholder='e.g., control, compliance, approvals, budgets' />
        <button onClick={getSlogans} style={{marginTop:8,padding:'8px 12px'}}>Get slogans</button>
      </div>

      {options.length>0 && (
        <div style={{marginTop:24}}>
          <div>Pick one:</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
            {options.map((o,i)=>(
              <button key={i} onClick={()=>setSelected(o)} style={{padding:'8px 12px', border:selected===o?'2px solid #000':'1px solid #aaa', background:'#fff'}}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:24}}>
        <button onClick={generate} disabled={busy || !selected} style={{padding:'10px 14px'}}>
          {busy? 'Generating…' : 'Generate with Flux-Kontext-Max'}
        </button>
      </div>

      {refUrl && (
        <div style={{marginTop:16}}>
          <div style={{opacity:0.7, fontSize:13}}>Reference</div>
          <img src={refUrl} style={{width:220, border:'1px solid #ddd'}} />
        </div>
      )}

      {plan && (
        <div style={{marginTop:16}}>
          <div style={{opacity:0.7, fontSize:13}}>Layout: {plan.layout}</div>
          <div style={{opacity:0.7, fontSize:13}}>Summary: {plan.visual_summary}</div>
          <details style={{marginTop:8}}>
            <summary>Prompt sent to Flux-Kontext-Max</summary>
            <pre style={{whiteSpace:'pre-wrap'}}>{plan.prompt}</pre>
          </details>
        </div>
      )}

      {error && <div style={{marginTop:16, color:'#b00'}}>{error}</div>}

      {imgUrl && (
        <div style={{marginTop:24}}>
          <img src={imgUrl} alt="result" style={{width:'100%', border:'1px solid #ddd'}} />
          <div style={{marginTop:8}}>
            <a href={imgUrl} download>Download image</a>
          </div>
        </div>
      )}
    </main>
  )
}
