'use client'

import { useState } from 'react'

type SloganPlan = {
  prompt: string
  summary?: string
  layout?: string
}

export default function Page() {
  const [love, setLove] = useState('')
  const [slogans, setSlogans] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const [refUrl, setRefUrl] = useState<string | null>(null)
  const [plan, setPlan] = useState<SloganPlan | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>('')

  // --- Helpers
  async function getJSON(res: Response) {
    const text = await res.text()
    try { return JSON.parse(text) } catch { throw new Error(text || 'Bad JSON') }
  }

  // STEP 1: Get slogans from GPT (server route)
  async function handleGetSlogans() {
    try {
      setError('')
      setSlogans([])
      setSelected(null)
      setImageUrl(null)
      setPlan(null)

      if (!love.trim()) {
        setError('Tell me what you love about finance first.')
        return
      }

      const res = await fetch('/api/slogans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ love }),
      })
      const data = await getJSON(res)

      if (!res.ok) throw new Error(data?.error || 'Failed to get slogans')
      if (!Array.isArray(data?.options) || data.options.length === 0) {
        throw new Error('No slogans returned')
      }

      setSlogans(data.options.slice(0, 3))
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  // STEP 2: Generate with Flux-Kontext-Max
  async function handleGenerate() {
    try {
      setBusy(true)
      setError('')
      setImageUrl(null)
      setPlan(null)

      if (!selected) {
        setError('Choose a slogan first.')
        return
      }

      // 2a) Pick a public ref URL from Vercel
      const refRes = await fetch('/api/selectRef')
      const refData = await getJSON(refRes)
      if (!refRes.ok || !refData?.url) throw new Error(refData?.error || 'No reference found')
      setRefUrl(refData.url)

      // 2b) Ask GPT to build the final style prompt & visual summary
      const buildRes = await fetch('/api/buildPrompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slogan: selected, refUrl: refData.url })
      })
      const build = await getJSON(buildRes)
      if (!buildRes.ok || !build?.prompt) throw new Error(build?.error || 'Prompt builder failed')
      setPlan({ prompt: build.prompt, summary: build.summary, layout: build.layout })

      // 2c) Send to Flux (exact schema required by kontext-max)
      const renderRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylePrompt: build.prompt,     // e.g. “replace text with 'CONTROL THE CASH' …”
          summary: build.summary,        // e.g. “snake coiled around calculator …”
          ref: refData.url,              // absolute URL to /refs/….
          aspect: 'match_input_image',   // per kontext-max docs
        }),
      })
      const render = await getJSON(renderRes)
      if (!renderRes.ok) throw new Error(render?.error || 'Render failed')

      // Replicate SDK usually returns an array of URLs
      const out =
        Array.isArray(render?.output) ? render.output[0] :
        typeof render?.output === 'string' ? render.output :
        ''

      if (!out) throw new Error('No image URL returned from model')
      setImageUrl(out)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Love Finance T-shirt Designer (Flux Kontext Max)
      </h1>

      {/* INPUT */}
      <section style={{ marginBottom: 16 }}>
        <label htmlFor="love" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
          What do you love about finance?
        </label>
        <input
          id="love"
          value={love}
          onChange={(e) => setLove(e.target.value)}
          placeholder="e.g. Control. Compliance. Profit. Efficiency."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16,
          }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button
            onClick={handleGetSlogans}
            disabled={busy}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #222' }}
          >
            Get slogans
          </button>
        </div>
      </section>

      {/* SLOGANS */}
      {slogans.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Pick a slogan</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {slogans.map((s) => (
              <button
                key={s}
                onClick={() => setSelected(s)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: selected === s ? '2px solid #0a7' : '1px solid #ccc',
                  background: selected === s ? '#eafff4' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleGenerate}
              disabled={!selected || busy}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #222' }}
            >
              {busy ? 'Generating…' : 'Generate with Flux'}
            </button>
          </div>
        </section>
      )}

      {/* DEBUG / CONTEXT */}
      {(refUrl || plan) && (
        <section style={{ margin: '16px 0', display: 'grid', gap: 12 }}>
          {refUrl && (
            <div>
              <div style={{ fontWeight: 600 }}>Reference used</div>
              <img
                src={refUrl}
                alt="reference"
                style={{ maxWidth: 320, width: '100%', borderRadius: 8, border: '1px solid #ddd' }}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{refUrl}</div>
            </div>
          )}
          {plan && (
            <div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Prompt & summary</div>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {plan.prompt}
                {plan.summary ? `\n\nSummary: ${plan.summary}` : ''}
              </div>
            </div>
          )}
        </section>
      )}

      {/* RESULT */}
      {imageUrl && (
        <section style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Result</div>
          <img
            src={imageUrl}
            alt="Flux-Kontext result"
            style={{ width: '100%', maxWidth: 768, borderRadius: 8, border: '1px solid #ddd' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{imageUrl}</div>
        </section>
      )}

      {/* ERRORS */}
      {error && (
        <section style={{ marginTop: 16, padding: 12, background: '#fff3f3', border: '1px solid #f3cccc', borderRadius: 8 }}>
          <strong>Error:</strong> {error}
        </section>
      )}
    </main>
  )
}