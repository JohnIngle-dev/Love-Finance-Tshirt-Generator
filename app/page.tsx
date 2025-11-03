"use client";

import { useState } from "react";

type Option = { slogan: string; visual: string };
type RenderResponse = {
  prompt: string; reference: string; visual: string;
  replace: string; file: string; result: string[]; modelRef: string;
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
    // show the selected banner immediately
    setChosen(opt);
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
    <div className="w-full text-center px-6 pb-20 max-w-[1100px] mx-auto">
      {/* Input */}
      <section className="mx-auto max-w-[880px]">
        <p className="mb-4 text-2xl font-semibold">What do you love about finance?</p>
        <form onSubmit={getOptions} className="flex flex-col items-center gap-4">
          {/* single-line input (was textarea) */}
          <input
            type="text"
            className="input-pill"
            placeholder="e.g. compounding, clean books, cashflow control…"
            value={love}
            onChange={(e) => setLove(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Generating…" : "Get 3 options"}
            </button>
            <button
              type="button"
              onClick={() => {
                setLove("");
                setOptions([]);
                setRendered(null);
                setErr(null);
                setChosen(null);
              }}
              className="btn-ghost"
            >
              Reset
            </button>
          </div>
        </form>
        {err && <div className="mt-4 text-red-300 text-sm">{err}</div>}
      </section>

      {/* Selected slogan banner */}
      {chosen && (
        <section className="mt-8 selected inline-block text-left">
          <div className="text-lg font-semibold">Selected slogan</div>
          <div className="mt-1 text-2xl font-bold">{chosen.slogan}</div>
          <div className="mt-1 text-sm text-white/80">Motif: {chosen.visual}</div>
          {rendering && <div className="mt-2 text-sm text-white/70">Rendering…</div>}
        </section>
      )}

      {/* Options as buttons */}
      {!rendered && options.length > 0 && (
        <section className="mt-10 flex flex-col gap-4 items-center">
          {options.map((o, i) => (
            <button
              key={i}
              onClick={() => renderWithReplicate(o)}
              disabled={rendering}
              className="card w-full max-w-[720px] text-white text-2xl font-semibold py-5 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-2xl shadow-lg transition"
            >
              {o.slogan}
              <div className="text-sm mt-2 text-zinc-300">Visual: {o.visual}</div>
            </button>
          ))}
        </section>
      )}

      {/* Result */}
      {rendered && (
        <section className="mt-12">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold">Generated design</h3>
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
              <img
                key={idx}
                src={url}
                alt="Generated"
                className="w-full rounded-xl border border-white/20"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}