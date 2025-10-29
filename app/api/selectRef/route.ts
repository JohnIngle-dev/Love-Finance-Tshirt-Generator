import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET() {
  const refDir = path.join(process.cwd(), "public/refs")
  const files = fs.readdirSync(refDir).filter(f => f.match(/\.(png|jpg|jpeg)$/i))
  if (!files.length)
    return NextResponse.json({ error: "No refs found" }, { status: 404 })

  const pick = files[Math.floor(Math.random() * files.length)]
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const url = `${base}/refs/${pick}`
  return NextResponse.json({ url })
}
