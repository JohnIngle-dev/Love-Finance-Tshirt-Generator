import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const dir = path.join(process.cwd(), 'public/refs')
  const images = fs.readdirSync(dir).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i))

  if (!images.length)
    return NextResponse.json({ error: 'No refs found in /public/refs' }, { status: 404 })

  const pick = images[Math.floor(Math.random() * images.length)]
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const url = `${base}/refs/${pick}`
  return NextResponse.json({ url, filename: pick })
}