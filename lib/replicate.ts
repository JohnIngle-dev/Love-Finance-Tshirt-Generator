
export async function startRender(payload: any) {
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function pollPrediction(prediction: any, intervalMs = 1500, maxMs = 180000) {
  const start = Date.now(); let cur = prediction;
  while (true) {
    const url = cur?.urls?.get || cur?.urls?.self; if (!url) throw new Error('Missing prediction URL for polling');
    const r = await fetch(url, { cache: 'no-store' }); cur = await r.json();
    if (cur.status === 'succeeded') return cur;
    if (cur.status === 'failed' || cur.status === 'canceled') { throw new Error(JSON.stringify(cur.error||{})); }
    if (Date.now() - start > maxMs) throw new Error('Prediction timed out');
    await new Promise(res => setTimeout(res, intervalMs));
  }
}
