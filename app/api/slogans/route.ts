import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { love } = await req.json()
  if (!love)
    return NextResponse.json({ error: "Missing input" }, { status: 400 })

  const ideas = [
    "CONTROL THE CASH",
    "FINANCE FURY",
    "BUDGET BRUTALITY",
    "MONEY SLAYER",
    "TAX WARRIOR"
  ]
  return NextResponse.json({ slogans: ideas.slice(0, 3) })
}
