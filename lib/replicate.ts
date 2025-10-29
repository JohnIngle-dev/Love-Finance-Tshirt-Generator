export async function startRender(payload: any) {
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function pollPrediction(prediction: any, intervalMs = 1500, maxMs = 180000) {
  const start = Date.now()
  let cur = prediction

  // Use server-side proxy for polling so the Replicate token stays secret
  const poll = async (u: string) => {
    const r = await fetch('/api/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: u }),
    })
    if (!r.ok) throw new Error(await r.text())
    return r.json()
  }

  while (true) {
    const url = cur?.urls?.get || cur?.urls?.self
    if (!url) throw new Error('Missing prediction URL for polling')

    cur = await poll(url)

    if (cur.status === 'succeeded') return cur
    if (cur.status === 'failed' || cur.status === 'canceled') {
      throw new Error(typeof cur.error === 'string' ? cur.error : JSON.stringify(cur.error || {}))
    }
    if (Date.now() - start > maxMs) throw new Error('Prediction timed out')

    await new Promise(res => setTimeout(res, intervalMs))
  }
}