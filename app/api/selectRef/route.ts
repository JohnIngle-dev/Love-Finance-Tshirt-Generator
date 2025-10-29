import { NextResponse } from 'next/server'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'refs')
  const files = await readdir(dir).catch(() => [])
  const images = files.filter(f => /\.(png|jpe?g|webp)$/i.test(f))

  if (!images.length) {
    return NextResponse.json({ error: 'No refs found in /public/refs' }, { status: 404 })
  }

  const pick = images[Math.floor(Math.random() * images.length)]

  // Build a proper absolute base URL (no req object)
  const h = headers()
  const xfHost = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const xfProto = h.get('x-forwarded-proto') || (xfHost.includes('localhost') ? 'http' : 'https')
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${xfProto}://${xfHost}`

  const url = `${base}/refs/${encodeURIComponent(pick)}`
  return NextResponse.json({ url, filename: pick })
}