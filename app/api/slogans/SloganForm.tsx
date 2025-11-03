"use client";

import { useState } from "react";

export default function SloganForm() {
  const [love, setLove] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slogans, setSlogans] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSlogans([]);
    setLoading(true);
    try {
      const res = await fetch("/api/slogans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate slogans");
      setSlogans(data.slogans || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
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
            {loading ? "Generating…" : "Get 1–4 word metal slogans"}
          </button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2"
            onClick={() => { setLove(""); setSlogans([]); setError(null); }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {slogans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Suggestions</h3>
          <ul className="grid gap-2">
            {slogans.map((s, i) => (
              <li key={i} className="rounded-lg border p-3 leading-tight">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}