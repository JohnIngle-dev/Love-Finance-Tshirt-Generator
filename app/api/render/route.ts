export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

function snap8(n: number) {
  return Math.max(8, Math.floor(n / 8) * 8)
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    const model = process.env.FLUX_MODEL || 'black-forest-labs/flux-kontext-max'
    if (!token)  return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 })
    if (!model)  return NextResponse.json({ error: 'Missing FLUX_MODEL' },          { status: 500 })

    const body = await req.json().catch(() => ({} as any))
    const stylePrompt: string = (body?.stylePrompt ?? body?.prompt ?? '').toString()
    const refs: string[] = Array.isArray(body?.refs) ? body.refs : []
    if (!stylePrompt.trim()) return NextResponse.json({ error: 'stylePrompt required' }, { status: 400 })

    // safe dims for Flux (height ≤ 1440, multiples of 8)
    const reqW = Number(body?.width) || 1024
    const reqH = Number(body?.height) || 1408
    const width  = snap8(Math.min(reqW, 1440))
    const height = snap8(Math.min(reqH, 1440))

    const steps         = Number(body?.steps) || 30
    const guidance      = Number(body?.guidance) || 5
    const styleStrength = Number(body?.styleStrength ?? 1.0)

    const input: Record<string, any> = {
      prompt: stylePrompt,
      width,
      height,
      num_inference_steps: steps,
      guidance,
      style_strength: styleStrength,
    }
    if (refs.length > 0) {
      input.reference_images = refs // Kontext expects an array of public URLs
    }

    const endpoint = `https://api.replicate.com/v1/models/${model}/predictions`
    console.log('[render] POST', endpoint, JSON.stringify({ width, height, refs: refs.length }, null, 2))

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
      cache: 'no-store',
    })

    if (!r.ok) {
      const e = await r.text()
      console.error('Replicate error:', e)
      return NextResponse.json({ error: e }, { status: 500 })
    }

    const prediction = await r.json()
    return NextResponse.json(prediction)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}