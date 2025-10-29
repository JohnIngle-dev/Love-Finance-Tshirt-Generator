'use client'
import { useState, useEffect } from "react"

export default function Page() {
  const [love, setLove] = useState("")
  const [slogans, setSlogans] = useState<string[]>([])
  const [slogan, setSlogan] = useState("")
  const [refUrl, setRefUrl] = useState("")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/selectRef").then(r => r.json()).then(d => setRefUrl(d.url))
  }, [])

  async function handleGenerate() {
    try {
      setError("")
      setLoading(true)
      const prompt = `replace text with '${slogan.toUpperCase()}' in bold, uppercase letters. warp the headline slightly for a dynamic effect.`
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, refUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setResult(data.image)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Love Finance T-shirt Designer (Flux Kontext Max)</h1>
      <p>What do you love about finance?</p>
      <input value={love} onChange={e => setLove(e.target.value)} />
      <button onClick={async () => {
        const r = await fetch("/api/slogans", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ love })})
        const d = await r.json(); setSlogans(d.slogans)
      }}>Get slogans</button>

      {slogans.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <b>Pick a slogan</b><br/>
          {slogans.map(s => (
            <button key={s} onClick={() => setSlogan(s)} style={{ margin: 4, background: s === slogan ? "#9ef" : "#eee" }}>{s}</button>
          ))}
        </div>
      )}

      {refUrl && (
        <div style={{ marginTop: 20 }}>
          <b>Reference used</b><br/>
          <img src={refUrl} width={250} />
        </div>
      )}

      {slogan && (
        <button onClick={handleGenerate} disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Generating..." : "Generate with Flux"}
        </button>
      )}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {result && <img src={result} width={512} style={{ marginTop: 20 }} />}
    </main>
  )
}
