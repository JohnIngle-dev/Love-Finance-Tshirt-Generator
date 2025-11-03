"use client";

import { useState } from "react";

type Option = { slogan: string; visual: string };
type RenderResponse = {
  prompt: string;
  reference: string; // we won't show it
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
    // Keep same text + motif, but exclude the last used reference file
    await renderWithReplicate(chosen, undefined, rendered?.file);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Love Finance — T-shirt Generator</h1>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        <form onSubmit={getOptions} className="space-y-4">
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
            <button type="submit" disabled={loading} className="rounded-lg border px-4 py-2">
              {loading ? "Summoning riffs…" : "Get 3 metal options"}
            </button>
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() => { setLove(""); setOptions([]); setRendered(null); setErr(null); setChosen(null); }}
            >
              Reset
            </button>
          </div>
        </form>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {options.length === 3 && !rendered && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pick one</h3>
            <div className="grid gap-2">
              {options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => renderWithReplicate(o)}
                  disabled={rendering}
                  className="text-left rounded-lg border p-3 leading-tight hover:bg-gray-50"
                  title={`Visual motif: ${o.visual}`}
                >
                  <div className="font-medium">{o.slogan}</div>
                  <div className="text-xs opacity-70">Visual motif: {o.visual}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {rendered && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Result</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2"
                  onClick={refreshDifferentRef}
                  disabled={rendering || !chosen}
                  title="New design with the same text and motif, different reference image"
                >
                  {rendering ? "Refreshing…" : "Refresh design"}
                </button>
              </div>
            </div>

            {/* Only show generated output(s), not the reference image */}
            <div className="grid gap-4">
              {rendered.result?.map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={idx} src={url} alt="Generated" className="w-full rounded-lg border" />
              ))}
            </div>

            {/* Optional debug line (remove if you like) */}
            <p className="text-xs text-gray-500">
              Slogan: <span className="font-medium">{chosen?.slogan}</span> · Motif: <span className="font-medium">{rendered.visual}</span> · Ref file: <span className="font-mono">{rendered.file}</span>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}