export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

const REPLICATE_URL = 'https://api.replicate.com/v1/predictions'

function snap8(n: number) {
  return Math.max(8, Math.floor(n / 8) * 8)
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    const version = process.env.FLUX_VERSION || 'black-forest-labs/flux-kontext-max'
    if (!token) return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 })

    const body = await req.json()
    const stylePrompt: string = (body?.stylePrompt || '').toString()
    const refs: string[] = Array.isArray(body?.refs) ? body.refs : []

    if (!stylePrompt.trim()) return NextResponse.json({ error: 'stylePrompt required' }, { status: 400 })

    // Validate & clamp dimensions
    const reqW = Number(body?.width) || 1024
    const reqH = Number(body?.height) || 1408
    const width = snap8(Math.min(reqW, 1440))
    const height = snap8(Math.min(reqH, 1440))

    const steps = Number(body?.steps) || 30
    const guidance = Number(body?.guidance) || 5
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
      input.reference_images = refs // <— this is what Kontext expects
    }

    console.log('[render] Flux-Kontext input:', JSON.stringify({ refs, styleStrength, width, height }, null, 2))

    const response = await fetch(REPLICATE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        input,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Replicate error:', err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const prediction = await response.json()
    return NextResponse.json(prediction)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}