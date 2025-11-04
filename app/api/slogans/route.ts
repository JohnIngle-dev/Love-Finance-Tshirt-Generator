import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SLOGAN_PROMPT } from "./prompt-template";

export const runtime = "nodejs";

type Option = { slogan: string; visual: string };

/** ── TUNABLE DEFAULTS (no logic changes needed) ───────────────────────────── */
const CONFIG = {
  defaultChartType: "bar",             // "bar" | "line" | "area" | "candlestick"
  defaultChartMaterial: "molten steel",
  defaultIngotMaterial: "brushed metal",
};

/** ── Helpers ──────────────────────────────────────────────────────────────── */
function tidy(s: string) {
  return s.replace(/[“”"’‘]+/g, "").replace(/\s{2,}/g, " ").trim();
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Normalise one object token like:
 *  "Open vault (bars pouring out)" →
 *  "Open vault (3D bullion ingots spilling out)" OR
 *  "Open vault (3D bar chart emerging)"
 */
function normaliseObjectToken(token: string, contextHasChart: boolean): string {
  let t = tidy(token.toLowerCase());

  // Standardise common synonyms around charts and currency
  t = t
    .replace(/\bdollars?\b/g, "plain coins")
    .replace(/\bpounds?\b/g, "plain coins")
    .replace(/\beuros?\b/g, "plain coins")
    .replace(/\bcash\b/g, "plain notes")
    .replace(/\bbills?\b/g, "plain notes")
    .replace(/\bcurrency\b/g, "plain notes")
    .replace(/\bgraph\b/g, "chart");

  const m = t.match(/^([^()]+?)(\s*\(([^)]*)\))?$/);
  let base = tidy(m ? m[1] : t);
  let constraint = tidy(m && m[3] ? m[3] : "");

  const mentionsChart =
    /\bchart\b/.test(base) || /\bchart\b/.test(constraint);
  const mentionsBars =
    /\bbars\b/.test(base) || /\bbars\b/.test(constraint);
  const mentionsVault = /\bvault\b/.test(base);

  // If "bars" is used without chart context → treat as ingots
  if (mentionsBars && !mentionsChart) {
    base = base.replace(/\bbars\b/g, "bullion ingots");
    constraint = constraint.replace(/\bbars\b/g, "bullion ingots");
  }

  // CHARTS: require explicit type and 3D
  if (mentionsChart || (contextHasChart && mentionsBars)) {
    // force explicit chart type if missing
    if (!/\b(bar|line|area|candlestick)\s*chart\b/.test(base)) {
      base = base.replace(/\bchart\b/g, `${CONFIG.defaultChartType} chart`);
    }
    // add "3D" prefix if missing
    if (!/\b3d\b/.test(base)) base = `3d ${base}`;
    // material if missing
    if (!constraint) constraint = CONFIG.defaultChartMaterial;
  }

  // BULLION INGOTS: require "3D bullion ingots"
  if (/\bbullion ingots\b/.test(base)) {
    if (!/\b3d\b/.test(base)) base = `3d ${base}`;
    if (!constraint) constraint = CONFIG.defaultIngotMaterial;
  }

  // Vaults must say what emerges explicitly
  if (mentionsVault) {
    const talksChart =
      /\bchart\b/.test(base) || /\bchart\b/.test(constraint);
    const talksIngots =
      /\bbullion ingots\b/.test(base) || /\bbullion ingots\b/.test(constraint);
    const talksCoins = /\bplain coins\b/.test(base) || /\bplain coins\b/.test(constraint);
    const talksNotes = /\bplain notes\b/.test(base) || /\bplain notes\b/.test(constraint);

    base = "open vault";
    if (talksChart) {
      constraint = `3D ${CONFIG.defaultChartType} chart emerging`;
    } else if (talksIngots) {
      constraint = "3D bullion ingots spilling out";
    } else if (talksCoins) {
      constraint = "plain coins (no symbols) spilling out";
    } else if (talksNotes) {
      constraint = "plain notes (no symbols or text) spilling out";
    } else {
      // default to ingots if unspecified
      constraint = "3D bullion ingots spilling out";
    }
  }

  // Per-object constraints
  if (/\bcompass\b/.test(base) && !/no numbers|no letters/i.test(constraint)) {
    constraint = "no numbers or letters";
  }
  if (/\bplain coins\b/.test(base) && !/no symbols/i.test(constraint)) {
    constraint = "no symbols";
  }
  if (/\bplain notes\b/.test(base) && !/no symbols|no text/i.test(constraint)) {
    constraint = "no symbols or text";
  }
  if (/\b(calculator|computer|screen|display)\b/.test(base) && !/no numbers|no text/i.test(constraint)) {
    constraint = "no numbers or text";
  }
  if (/\bledger\b/.test(base) && !/no text/i.test(constraint)) {
    constraint = "no text";
  }

  // Generic fallback to be safe
  if (!constraint) constraint = "generic, no text";

  return `${cap(base)} (${cap(constraint)})`;
}

function normaliseVisual(visual: string): string {
  const rawParts = visual
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (rawParts.length === 0) {
    // sensible default
    return `3D ${CONFIG.defaultChartType} chart (${cap(CONFIG.defaultChartMaterial)})`;
  }

  const contextHasChart = rawParts.some((p) => /\bchart\b/i.test(p));
  const fixed = rawParts.map((p) => normaliseObjectToken(p, contextHasChart));

  // Ensure any chart comes first for clarity, limit to 3 items
  const charts = fixed.filter((p) => /\b3d\b.*\bchart\b/i.test(p));
  const nonCharts = fixed.filter((p) => !/\b3d\b.*\bchart\b/i.test(p));
  const ordered = (charts.length ? [charts[0]] : []).concat(nonCharts).slice(0, 3);

  // Final sweep: never leave bare "bars"
  const unambiguous = ordered.map((p) =>
    /\bbars\b/i.test(p) && !/\bchart\b|\bbullion ingots\b/i.test(p)
      ? p.replace(/\bbars\b/gi, "bullion ingots")
      : p
  );

  return unambiguous.join(", ");
}

/** ── Route ────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const { love } = await req.json();
    if (!love) {
      return NextResponse.json({ error: "Missing input 'love'" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = SLOGAN_PROMPT.replace("{{love}}", String(love));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";

    let options: Option[] = [];
    try {
      options = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[.*\]/s);
      options = match ? JSON.parse(match[0]) : [];
    }

    options = (options || [])
      .filter((o) => o && typeof o.slogan === "string" && typeof o.visual === "string")
      .map((o) => {
        const slogan = tidy(o.slogan).split(/\s+/).slice(0, 4).join(" ");
        const visual = normaliseVisual(o.visual);
        return { slogan, visual };
      })
      .slice(0, 3);

    if (options.length !== 3) {
      return NextResponse.json({ error: "No slogans generated" }, { status: 500 });
    }

    return NextResponse.json({ options });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to generate slogans" }, { status: 500 });
  }
}