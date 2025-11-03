"use client";

import { useState } from "react";

type RenderResponse = {
  prompt: string;
  reference: string;
  result: string[]; // array of URLs
};

export default function Page() {
  const [love, setLove] = useState("");
  const [loading, setLoading] = useState(false);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState<RenderResponse | null>(null);

  async function getSlogans(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setRendered(null);
    setSlogans([]);
    setLoading(true);
    try {
      const res = await fetch("/api/slogans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate slogans");
      setSlogans(data.slogans || []);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function renderWithReplicate(slogan: string) {
    setRendering(true);
    setErr(null);
    setRendered(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slogan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to render");
      setRendered(data as RenderResponse);
    } catch (e: any) {
      setErr(e.message || "Render failed");
    } finally {
      setRendering(false);
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Love Finance — T-shirt Generator
      </h1>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        <form onSubmit={getSlogans} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">What do you love about finance?</span>
            <textarea
              className="mt-2 w-full rounded-lg border p-3"
              placeholder="e.g. compounding, clean books, cashflow control…"
              value={love}
              onChange={(e) => setLove(e.target.value)}
              rows={3}
              required
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border px-4 py-2"
            >
              {loading ? "Summoning the riffs…" : "Get 3 metal slogans"}
            </button>
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() => { setLove(""); setSlogans([]); setRendered(null); setErr(null); }}
            >
              Reset
            </button>
          </div>
        </form>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {slogans.length === 3 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pick one</h3>
            <div className="grid gap-2">
              {slogans.map((s, i) => (
                <button
                  key={i}
                  onClick={() => renderWithReplicate(s)}
                  disabled={rendering}
                  className="text-left rounded-lg border p-3 leading-tight hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {rendering && <p className="text-sm">Rendering with Replicate…</p>}

        {rendered && (
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Result</h3>
            <p className="text-sm"><span className="font-medium">Prompt:</span> {rendered.prompt}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <figure className="space-y-2">
                <figcaption className="text-sm font-medium">Reference</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rendered.reference} alt="Reference" className="w-full rounded-lg border" />
              </figure>
              <figure className="space-y-2 md:col-span-1">
                <figcaption className="text-sm font-medium">Output</figcaption>
                {/* Replicate may return multiple frames/variants */}
                {rendered.result?.map((url, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={idx} src={typeof url === "string" ? url : String(url)} alt="Generated" className="w-full rounded-lg border mb-2" />
                ))}
              </figure>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}