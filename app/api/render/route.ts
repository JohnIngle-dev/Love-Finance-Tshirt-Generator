export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const REPLICATE_URL = 'https://api.replicate.com/v1/predictions';

// Snap any dimension to a multiple of 8 (most models require this)
function snap8(n: number) {
  return Math.max(8, Math.floor(n / 8) * 8);
}

export async function POST(req: NextRequest) {
  try {
    // ---- Env checks
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.FLUX_VERSION;
    if (!token) return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 });
    if (!version) return NextResponse.json({ error: 'Missing FLUX_VERSION' }, { status: 500 });

    // ---- Parse body
    const body = await req.json().catch(() => ({} as any));
    const stylePrompt: string = (body?.stylePrompt || '').toString();
    const refs: string[] = Array.isArray(body?.refs) ? body.refs : [];

    if (!stylePrompt.trim()) {
      return NextResponse.json({ error: 'stylePrompt required' }, { status: 400 });
    }

    // ---- User inputs (with safe defaults)
    const requestedW = Number(body?.width) || 1024;
    const requestedH = Number(body?.height) || 1536; // previous default was too tall for Kontext
    const steps = Number(body?.steps) || 28;
    const guidance = Number(body?.guidance) || 4.5;
    const styleStrength = Number(body?.styleStrength ?? 0.9);

    // ---- Flux-Kontext hard limit: height <= 1440
    const SAFE_MAX_H = 1440;

    // Clamp + snap to multiples of 8
    const width = snap8(Math.min(requestedW, 1440));        // you can allow up to 1440 wide if you wish
    const height = snap8(Math.min(requestedH, SAFE_MAX_H)); // MUST be <= 1440

    // Build Replicate input
    const input: Record<string, any> = {
      prompt: stylePrompt,
      width,
      height,
      num_inference_steps: steps,
      guidance,
    };

    if (refs.length > 0) {
      // Replicate needs publicly reachable URLs (no localhost)
      input.reference_images = refs;
      input.style_strength = styleStrength;
    }

    // ---- Call Replicate
    const r = await fetch(REPLICATE_URL, {
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
    });

    if (!r.ok) {
      // Surface the model’s error text so we can see validation issues
      const e = await r.text();
      return NextResponse.json({ error: e }, { status: 500 });
    }

    const prediction = await r.json();
    return NextResponse.json(prediction);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}