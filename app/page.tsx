"use client";

import { useState } from "react";

type Option = { slogan: string; visual: string };
type RenderResponse = {
  prompt: string; reference: string; visual: string;
  replace: string; keep: string; file: string; result: string[]; modelRef?: string;
};
type BatchResponse = { modelRef: string; count: number; items: RenderResponse[] };

export default function Page() {
  const [love, setLove] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState<RenderResponse | null>(null);
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [chosen, setChosen] = useState<Option | null>(null);

  async function getOptions(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setRendered(null);
    setBatch(null);
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
    setChosen(opt);
    setOptions([]);
    setRendering(true);
    setErr(null);
    setRendered(null);
    setBatch(null);

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

  async function renderBatch(opt: Option) {
    setChosen(opt);
    setOptions([]);
    setRendering(true);
    setErr(null);
    setRendered(null);
    setBatch(null);

    try {
      const res = await fetch("/api/render/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slogan: opt.slogan, visual: opt.visual, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to batch render");
      setBatch(data as BatchResponse);
    } catch (e: any) {
      setErr(e.message || "Batch render failed");
    } finally {
      setRendering(false);
    }
  }

  async function refreshDifferentRef() {
    if (!chosen || !rendered) return;
    await renderWithReplicate(chosen, undefined, rendered.file);
  }

  return (
    <div className="w-full text-center px-6 pb-20 max-w-[1100px] mx-auto">
      {/* Input */}
      <section className="mx-auto max-w-[880px]">
        <p className="mb-4 text-2xl font-semibold">What do you love about finance?</p>
        <form onSubmit={getOptions} className="flex flex-col items-center gap-4">
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
                setBatch(null);
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

      {/* Selected slogan card */}
      {chosen && (
        <section className="mt-10 flex justify-center">
          <div className="card w-full max-w-[720px] border-2 border-[#d7e14c] bg-[#262626] flex flex-col items-center text-center">
            <div className="text-3xl font-bold text-white leading-tight">{chosen.slogan}</div>
            <div className="text-sm mt-2 text-zinc-300 italic">Motif: {chosen.visual}</div>
            {rendering && <div className="mt-2 text-sm text-white/70">Rendering…</div>}
            {!rendering && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => renderWithReplicate(chosen!)}
                  className="btn-primary"
                >
                  Render 1 design
                </button>
                <button
                  type="button"
                  onClick={() => renderBatch(chosen!)}
                  className="btn-ghost"
                >
                  Render across 4 refs
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Options (pre-selection) */}
      {!chosen && options.length > 0 && (
        <section className="mt-10 flex flex-col gap-4 items-center">
          {options.map((o, i) => (
            <button
              key={i}
              onClick={() => renderWithReplicate(o)}
              disabled={rendering}
              className="card w-full max-w-[720px] text-white text-2xl font-semibold py-5 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-2xl shadow-lg transition text-center"
            >
              {o.slogan}
              <div className="text-sm mt-2 text-zinc-400 italic">Visual: {o.visual}</div>
            </button>
          ))}
        </section>
      )}

      {/* Single render result */}
      {rendered && !batch && (
        <section className="mt-12 flex flex-col items-center">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-semibold">Generated design</h3>
            <p className="text-sm text-white/80">
              Text: <span className="font-semibold">{chosen?.slogan}</span> · Motif:{" "}
              <span className="font-semibold">{rendered.visual}</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl mb-8">
            {rendered.result?.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt="Generated design" className="max-w-full md:max-w-[480px] rounded-xl border border-white/20" />
            ))}
          </div>

          <button type="button" onClick={refreshDifferentRef} disabled={rendering || !chosen} className="btn-primary">
            {rendering ? "Refreshing…" : "Refresh design"}
          </button>
        </section>
      )}

      {/* Batch render result */}
      {batch && (
        <section className="mt-12 flex flex-col items-center">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-semibold">Generated across 4 references</h3>
            <p className="text-sm text-white/80">
              Text: <span className="font-semibold">{chosen?.slogan}</span> · Motif:{" "}
              <span className="font-semibold">{chosen?.visual}</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
            {batch.items.flatMap((item, i) =>
              item.result?.map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${i}-${idx}`} src={url} alt={`Generated ${i + 1}`} className="max-w-full md:max-w-[480px] rounded-xl border border-white/20" />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}