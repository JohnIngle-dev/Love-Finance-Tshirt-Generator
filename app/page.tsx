"use client";

import { useState } from "react";
import { UnifrakturMaguntia, Inter } from "next/font/google";

const gothic = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

type Option = { slogan: string; visual: string };
type RenderResponse = {
  prompt: string;
  reference: string; // hidden in UI
  visual: string;
  replace: string;
  file: string;      // which reference image was used (for refresh exclusion)
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
    <div
      className={`${inter.className} min-h-screen text-zinc-100 relative`}
      style={{
        background:
          "radial-gradient(1200px 800px at 10% -10%, rgba(239,68,68,0.25), transparent 45%), radial-gradient(900px 600px at 110% -20%, rgba(139,92,246,0.25), transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 100%)",
      }}
    >
      {/* subtle texture / noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-25 mix-blend-soft-light"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"1.2\" numOctaves=\"2\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.25\"/></svg>')",
        }}
      />

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-600/70 to-fuchsia-700/70 ring-1 ring-white/15 shadow-[0_4px_20px_rgba(239,68,68,0.35)]" />
            <div className={`${gothic.className} text-2xl tracking-wide select-none`}>
              LOVE FINANCE
            </div>
          </div>
          {/* no version badge per request */}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14 space-y-10">
        {/* Input panel */}
        <section className="rounded-2xl ring-1 ring-white/10 bg-gradient-to-b from-zinc-900/80 to-black/70 shadow-[0_15px_50px_rgba(0,0,0,0.45)]">
          <div className="p-6 md:p-8">
            <h2 className={`${gothic.className} text-3xl md:text-4xl tracking-wide mb-4`}>
              T-Shirt Generator
            </h2>

            <form onSubmit={getOptions} className="space-y-5">
              <label className="block">
                <div className="text-sm font-medium text-zinc-300 mb-2">
                  What do you love about finance?
                </div>
                <textarea
                  className="w-full rounded-2xl bg-black/60 border border-zinc-700/60 focus:border-red-500/70 focus:outline-none focus:ring-2 focus:ring-red-600/40 text-base md:text-lg leading-relaxed p-5 md:p-6 placeholder:text-zinc-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
                  placeholder="e.g. compounding, clean books, cashflow control…"
                  value={love}
                  onChange={(e) => setLove(e.target.value)}
                  rows={5}
                  required
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center gap-3 rounded-xl px-5 py-3 text-sm md:text-[15px] font-semibold tracking-wide text-white
                  bg-[linear-gradient(180deg,rgba(239,68,68,0.95),rgba(190,24,93,0.95))] hover:bg-[linear-gradient(180deg,rgba(239,68,68,1),rgba(190,24,93,1))]
                  ring-1 ring-white/15 shadow-[0_10px_30px_rgba(239,68,68,0.35)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                  disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                      Summoning riffs…
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 opacity-90 group-hover:opacity-100"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 3l2.122 4.3 4.748.69-3.435 3.348.811 4.73L12 14.77 7.754 16.07l.811-4.73L5.13 7.99l4.748-.69L12 3z" />
                      </svg>
                      Get 3 metal options
                    </>
                  )}
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
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm md:text-[15px] font-medium
                  bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-700/60 ring-1 ring-white/10"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Error */}
        {err && (
          <div className="rounded-xl border border-red-500/40 bg-red-600/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Options */}
        {options.length === 3 && !rendered && (
          <section className="grid gap-5 md:grid-cols-3">
            {options.map((o, i) => (
              <button
                key={i}
                onClick={() => renderWithReplicate(o)}
                disabled={rendering}
                className="group text-left rounded-2xl bg-zinc-950/80 border border-zinc-800/70 hover:border-red-500/60 hover:shadow-[0_15px_40px_rgba(239,68,68,0.2)] transition
                p-5 md:p-6 ring-1 ring-white/5"
              >
                <div className={`${gothic.className} text-2xl tracking-wide`}>
                  {o.slogan}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-widest text-zinc-400">
                  Motif
                </div>
                <div className="text-sm text-zinc-200">{o.visual}</div>

                <div className="mt-5 inline-flex items-center text-xs text-zinc-300 group-hover:text-white transition">
                  Select
                  <svg className="ml-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z" />
                  </svg>
                </div>
              </button>
            ))}
          </section>
        )}

        {/* Result */}
        {rendered && (
          <section className="rounded-2xl ring-1 ring-white/10 bg-gradient-to-b from-zinc-900/80 to-black/70 shadow-[0_15px_50px_rgba(0,0,0,0.45)] p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className={`${gothic.className} text-2xl md:text-3xl tracking-wide`}>
                  Generated design
                </h3>
                <p className="text-sm text-zinc-300 mt-1">
                  Text: <span className="font-semibold text-zinc-100">{chosen?.slogan}</span> · Motif:{" "}
                  <span className="font-semibold text-zinc-100">{rendered.visual}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={refreshDifferentRef}
                disabled={rendering || !chosen}
                className="group inline-flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold tracking-wide text-white
                bg-[linear-gradient(180deg,rgba(244,63,94,0.95),rgba(147,51,234,0.95))] hover:bg-[linear-gradient(180deg,rgba(244,63,94,1),rgba(147,51,234,1))]
                ring-1 ring-white/15 shadow-[0_10px_30px_rgba(244,63,94,0.35)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                disabled:opacity-60 disabled:cursor-not-allowed"
                title="New design with the same text and motif, different reference image"
              >
                {rendering ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Refresh design
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 opacity-90 group-hover:opacity-100"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1h-2.02A7 7 0 1 0 19 12c0-1.93-.78-3.68-2.05-4.95z" />
                    </svg>
                    Refresh design
                  </>
                )}
              </button>
            </div>

            {/* Generated outputs only */}
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
          </section>
        )}
      </main>
      {/* no footer text */}
    </div>
  );
}