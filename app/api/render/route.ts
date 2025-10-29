import Replicate from "replicate"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { prompt, refUrl } = await req.json()
  if (!prompt || !refUrl)
    return NextResponse.json({ error: "prompt and refUrl required" }, { status: 400 })

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
  const input = {
    prompt,
    input_image: refUrl,
    aspect_ratio: "match_input_image",
    output_format: "png",
    safety_tolerance: 2,
    prompt_upsampling: false
  }

  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-kontext-max",
    input
  })

  let pred: any = prediction
  const terminal = new Set(["succeeded", "failed", "canceled", "aborted"])
  while (!terminal.has(pred.status)) {
    await new Promise(r => setTimeout(r, 1200))
    pred = await replicate.predictions.get(pred.id)
  }

  if (pred.status !== "succeeded")
    return NextResponse.json({ error: pred.error || "Render failed" }, { status: 500 })

  const out = Array.isArray(pred.output) ? pred.output[0] : pred.output
  return NextResponse.json({ image: out })
}
