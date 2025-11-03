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
    <main className="mx-auto w-full max-w-5xl px-6 pb-16">
      {/* centred input block */}
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="mb-3 text-[15px] tracking-wide opacity-85">What do you love about finance?</p>
        <form onSubmit={getOptions} className="grid gap-4">
          <textarea
            className="input-pill"
            placeholder="e.g. compounding, clean books, cashflow control…"
            value={love}
            onChange={(e) => setLove(e.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-center gap-3">
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
        {err && <div className="mt-4 card px-4 py-3 text-sm text-red-200 border-red-400/30 bg-red-500/10">{err}</div>}
      </section>

      {/* suggestions */}
      {!rendered && options.length === 3 && (
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {options.map((o, i) => (
            <button
              key={i}
              onClick={() => renderWithReplicate(o)}
              disabled={rendering}
              className="card text-left p-5 hover:border-white/30 transition"
            >
              <div className="option-title">{o.slogan}</div>
              <div className="mt-3 text-[11px] uppercase tracking-widest opacity-60">Motif</div>
              <div className="text-sm opacity-90">{o.visual}</div>
              <div className="mt-5 inline-flex items-center gap-2 text-xs opacity-85">
                Select
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z" />
                </svg>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* result */}
      {rendered && (
        <section className="mt-10 card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold tracking-wide">Generated design</h3>
              <p className="text-sm opacity-85 mt-1">
                Text: <span className="font-semibold">{chosen?.slogan}</span> · Motif: <span className="font-semibold">{rendered.visual}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={refreshDifferentRef}
              disabled={rendering || !chosen}
              className="btn-primary"
              title="Same text and motif, different reference image"
            >
              {rendering ? "Refreshing…" : "Refresh design"}
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {rendered.result?.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt="Generated" className="w-full rounded-xl border border-white/15" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}