export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 })

    const { id, url } = await req.json()
    const target = url || (id ? `https://api.replicate.com/v1/predictions/${id}` : '')
    if (!target) return NextResponse.json({ error: 'id or url required' }, { status: 400 })

    const r = await fetch(target, {
      headers: { Authorization: `Token ${token}` },
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return NextResponse.json({ error: data }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}