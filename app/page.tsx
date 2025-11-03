"use client";

import { useState } from "react";
import { UnifrakturMaguntia } from "next/font/google";

const gothic = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], display: "swap" });

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
    <main>
      {/* HERO — Ramp-style centre hero with gothic wordmark */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-10 md:pt-16 pb-8 text-center">
        <div className={`${gothic.className} text-5xl md:text-6xl tracking-wide`}>T-Shirt Generator</div>
        <div className="mx-auto max-w-3xl mt-4 text-zinc-300/95">
          {/* keep minimal copy */}
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <form onSubmit={getOptions} className="grid gap-3 md:gap-4">
            <textarea
              className="w-full rounded-2xl bg-black/75 border border-zinc-700/70 focus:border-rose-500/70
                         focus:outline-none focus:ring-2 focus:ring-rose-600/40 text-lg md:text-xl leading-relaxed
                         p-6 md:p-7 placeholder:text-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
              placeholder="What do you love about finance?"
              value={love}
              onChange={(e) => setLove(e.target.value)}
              rows={5}
              required
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                    Generating…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 3l2.122 4.3 4.748.69-3.435 3.348.811 4.73L12 14.77 7.754 16.07l.811-4.73L5.13 7.99l4.748-.69L12 3z" />
                    </svg>
                    Get 3 options
                  </span>
                )}
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

          {err && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-600/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}
        </div>
      </section>

      {/* SUGGESTIONS — pill cards like Ramp sections */}
      {!rendered && options.length === 3 && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 pb-10 md:pb-14">
          <div className="grid md:grid-cols-3 gap-5">
            {options.map((o, i) => (
              <button
                key={i}
                onClick={() => renderWithReplicate(o)}
                disabled={rendering}
                className="card text-left p-5 md:p-6 hover:ring-white/20 hover:shadow-[0_18px_50px_rgba(239,68,68,0.20)] transition"
              >
                <div className={`${gothic.className} text-2xl md:text-3xl tracking-wide`}>{o.slogan}</div>
                <div className="mt-3 text-[11px] uppercase tracking-widest text-zinc-400">Motif</div>
                <div className="text-sm text-zinc-200">{o.visual}</div>
                <div className="mt-5 inline-flex items-center text-xs text-zinc-300">
                  Select
                  <svg className="ml-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* RESULT — clean two-up gallery like Ramp’s product shots */}
      {rendered && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 pb-12">
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className={`${gothic.className} text-3xl tracking-wide`}>Generated design</div>
                <p className="text-sm text-zinc-300 mt-1">
                  Text: <span className="font-semibold text-zinc-100">{chosen?.slogan}</span> · Motif:{" "}
                  <span className="font-semibold text-zinc-100">{rendered.visual}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={async () => { if (!chosen) return; await renderWithReplicate(chosen, undefined, rendered?.file); }}
                disabled={rendering || !chosen}
                className="btn-primary"
                title="Same text & motif, different reference image"
              >
                {rendering ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                    Refresh design
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1h-2.02A7 7 0 1 0 19 12c0-1.93-.78-3.68-2.05-4.95z" />
                    </svg>
                    Refresh design
                  </span>
                )}
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {rendered.result?.map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={url}
                  alt="Generated"
                  className="w-full rounded-xl border border-zinc-800/60 ring-1 ring-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}