// app/page.tsx  (only the parts that fetch/select refs & call /api/render)
'use client'
import { useEffect, useState } from "react";

type GenState = "idle"|"preparing"|"rendering";

export default function Page(){
  const [love, setLove] = useState("");
  const [slogans, setSlogans] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string>("");
  const [refUrl, setRefUrl] = useState<string>("");
  const [status, setStatus] = useState<GenState>("idle");
  const [error, setError] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  // always fetch a fresh random reference (no cache)
  async function getRef() {
    setRefUrl("");
    const r = await fetch("/api/selectRef", { cache: "no-store" });
    const data = await r.json();
    if (data?.url) setRefUrl(data.url);
  }

  useEffect(() => { getRef(); }, []);

  async function getSlogans() {
    setSlogans([]); setChosen(""); setImageUrl(""); setError("");
    const r = await fetch("/api/slogans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ love }),
    });
    const data = await r.json();
    setSlogans(data?.slogans ?? []);
  }

  async function generate() {
    try {
      setError(""); setImageUrl(""); setStatus("preparing");

      if (!chosen) throw new Error("Pick a slogan first");
      if (!refUrl)  throw new Error("No reference image yet—hit refresh or wait a second");

      // Build a concise prompt for Kontext
      const r = await fetch("/api/buildPrompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slogan: chosen,
          refUrl,
        }),
      });
      const { prompt } = await r.json();
      if (!prompt) throw new Error("Prompt builder failed");

      setStatus("rendering");
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          refUrl,            // << send the ref to the render route
          safetyTolerance: 2,
          aspect: "match_input_image",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Render failed");
      setImageUrl(data.url);
      setStatus("idle");
    } catch (e:any) {
      setStatus("idle");
      setError(e.message || String(e));
    }
  }

  // ... your existing JSX (buttons, preview, etc) ...
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
