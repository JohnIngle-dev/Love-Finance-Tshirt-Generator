"use client";

import { useState } from "react";

type Option = { slogan: string; visual: string };
type RenderResponse = {
  prompt: string;
  reference: string;
  visual: string;
  replace: string;
  file: string;
  result: string[];
  modelRef: string;
};

export default function Page() {
  const [love, setLove] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState<RenderResponse | null>(null);
  const [chosen, setChosen] = useState<Option | null>(null);

  async function getOptions(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setRendered(null);
    setChosen(null);
    setOptions([]);
    setLoading(true);
    try {
      const res = await fetch("/api/slogans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate options");
      setOptions(data.options || []);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function renderWithReplicate(opt: Option, file?: string, excludeFile?: string) {
    setRendering(true);
    setErr(null);
    setRendered(null);
    try {
      const body: any = { slogan: opt.slogan, visual: opt.visual };
      if (file) body.file = file;
      if (excludeFile) body.excludeFile = excludeFile;

      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to render");
      setRendered(data as RenderResponse);
      setChosen(opt);
    } catch (e: any) {
      setErr(e.message || "Render failed");
    } finally {
      setRendering(false);
    }
  }

  async function refreshDifferentRef() {
    if (!chosen) return;
    await renderWithReplicate(chosen, undefined, rendered?.file);
  }

  return (
    <main className="flex flex-col items-center justify-center w-full px-6 pb-20 text-center">
      {/* Input */}
      <section className="max-w-2xl w-full">
        <p className="mb-4 text-lg">What do you love about finance?</p>
        <form onSubmit={getOptions} className="flex flex-col gap-4 items-center">
          <textarea
            className="input-pill"
            placeholder="e.g. compounding, clean books, cashflow control…"
            value={love}
            onChange={(e) => setLove(e.target.value)}
            rows={3}
            required
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Generating…" : "Get 3 options"}
            </button>
            <button
              type="button"
              onClick={() => { setLove(""); setOptions([]); setRendered(null); setErr(null); setChosen(null); }}
              className="btn-ghost"
            >
              Reset
            </button>
          </div>
        </form>
        {err && <div className="mt-4 text-red-400 text-sm">{err}</div>}
      </section>

      {/* Options */}
      {!rendered && options.length === 3 && (
        <section className="mt-10 grid gap-6 w-full max-w-4xl text-center md:grid-cols-3">
          {options.map((o, i) => (
            <button
              key={i}
              onClick={() => renderWithReplicate(o)}
              disabled={rendering}
              className="card hover:border-[#d7e14c]/70 transition"
            >
              <div className="option-title">{o.slogan}</div>
              <div className="mt-3 text-sm text-white/70 uppercase">Motif</div>
              <div className="text-sm text-white/90">{o.visual}</div>
            </button>
          ))}
        </section>
      )}

      {/* Result */}
      {rendered && (
        <section className="mt-12 w-full max-w-5xl">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-1">Generated design</h3>
            <p className="text-sm text-white/80">
              Text: <span className="font-semibold">{chosen?.slogan}</span> · Motif:{" "}
              <span className="font-semibold">{rendered.visual}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={refreshDifferentRef}
            disabled={rendering || !chosen}
            className="btn-primary mb-6"
          >
            {rendering ? "Refreshing…" : "Refresh design"}
          </button>

          <div className="grid gap-6 md:grid-cols-2">
            {rendered.result?.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt="Generated" className="w-full rounded-xl border border-white/20" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}