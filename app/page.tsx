"use client";

import { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <div className={`${jakarta.className} min-h-screen bg-[radial-gradient(1200px_800px_at_20%_-10%,#0ea5e9,transparent_40%),radial-gradient(1000px_600px_at_100%_0%,#8b5cf6,transparent_45%),linear-gradient(180deg,#0b0b10_0%,#0b0b10_100%)] text-slate-100`}>
      <header className="border-b border-white/10 backdrop-blur sticky top-0 z-10 bg-black/20">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15 shadow-inner" />
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              Love Finance — T-shirt Generator
            </h1>
          </div>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex text-xs uppercase tracking-wider text-white/70 hover:text-white transition"
          >
            v1.0
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 md:py-12 space-y-10">
        {/* Input card */}
        <section className="rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="p-5 md:p-7">
            <form onSubmit={getOptions} className="space-y-5">
              <label className="block">
                <div className="text-sm font-medium text-white/90">What do you love about finance?</div>
                <textarea
                  className="mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-sky-400/70 outline-none p-4 text-[15px] leading-relaxed placeholder:text-white/40"
                  placeholder="e.g. compounding, clean books, cashflow control…"
                  value={love}
                  onChange={(e) => setLove(e.target.value)}
                  rows={3}
                  required
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-300 focus-visible:ring-offset-black disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-900/20"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                      Summoning riffs…
                    </>
                  ) : (
                    <>Get 3 metal options</>
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
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Error notice */}
        {err && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Options */}
        {options.length === 3 && !rendered && (
          <section className="grid md:grid-cols-3 gap-4">
            {options.map((o, i) => (
              <button
                key={i}
                onClick={() => renderWithReplicate(o)}
                disabled={rendering}
                className="group text-left rounded-2xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/10 transition shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 md:p-5"
              >
                <div className="text-[15px] font-semibold tracking-tight">{o.slogan}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-white/60">Motif</div>
                <div className="text-sm text-white/85">{o.visual}</div>
                <div className="mt-4 inline-flex items-center text-xs text-white/70 group-hover:text-white transition">
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
          <section className="rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 md:p-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold tracking-tight">Generated design</h3>
                <p className="text-sm text-white/70 mt-1">
                  Text: <span className="font-medium text-white/90">{chosen?.slogan}</span> · Motif:{" "}
                  <span className="font-medium text-white/90">{rendered.visual}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={refreshDifferentRef}
                  disabled={rendering || !chosen}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-black disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-900/20"
                  title="New design with the same text and motif, different reference image"
                >
                  {rendering ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                      Refresh design
                    </>
                  ) : (
                    <>Refresh design</>
                  )}
                </button>
              </div>
            </div>

            {/* Only show generated output(s), not the reference image */}
            <div className="grid gap-5 md:grid-cols-2">
              {rendered.result?.map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={url}
                  alt="Generated"
                  className="w-full rounded-xl ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                />
              ))}
            </div>

            {/* Subtle developer hint; remove if you prefer a clean public UI */}
            <div className="text-xs text-white/50">
              Ref file used: <span className="font-mono">{rendered.file}</span>
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Love Finance · Built with Next.js
      </footer>
    </div>
  );
}