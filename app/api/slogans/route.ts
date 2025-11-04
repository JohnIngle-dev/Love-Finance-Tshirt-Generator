import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SLOGAN_PROMPT } from "./prompt-template";

export const runtime = "nodejs";

type Option = { slogan: string; visual: string };

/** Tunable defaults */
const CONFIG = {
  defaultChartType: "bar",          // "bar" | "line" | "area" | "candlestick"
  defaultChartMaterial: "neon glass",
  defaultIngotMaterial: "brushed metal"
};

/* ─── tiny helpers ─────────────────────────────────────────────── */
const tidy = (s: string) => s.replace(/[“”"’‘]+/g, "").replace(/\s{2,}/g, " ").trim();
const cap  = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* ─── step 1: mirror obvious finance cues from the slogan ──────── */
function mirrorFinanceCue(slogan: string, visual: string) {
  const s = slogan.toLowerCase();
  const has = (re: RegExp) => re.test(visual.toLowerCase());

  const inserts: { test: RegExp; token: string }[] = [
    { test: /\bvault|safe\b/,                 token: "Open vault" },
    { test: /\bchart|graph\b/,                token: `3D ${CONFIG.defaultChartType} chart (${CONFIG.defaultChartMaterial})` },
    { test: /\bcoins?\b/,                     token: "Plain coins (no symbols)" },
    { test: /\bnotes?|cash|bills?\b/,         token: "Plain notes (no symbols or text)" },
    { test: /\bledger|book|spreadsheet\b/,    token: "Ledger (no text)" },
    { test: /\bcalculator\b/,                 token: "Calculator (no numbers or text)" },
    { test: /\bcomputer|server|screen\b/,     token: "Computer (no numbers or text)" },
    { test: /\bcompass\b/,                    token: "Compass (no numbers or letters)" },
    { test: /\bcrown\b/,                      token: "Crown (gold)" }
  ];

  const tokens = visual.split(",").map(tidy).filter(Boolean);
  for (const rule of inserts) {
    if (rule.test.test(s) && !has(rule.test)) {
      tokens.unshift(rule.token);
      break; // only enforce the first matching finance cue
    }
  }
  return tokens.slice(0, 2).join(", ");
}

/* ─── step 2: keep motifs concise but unambiguous ──────────────── */
function normaliseObjectToken(token: string, contextHasChart: boolean): string {
  let t = tidy(token.toLowerCase());

  // standard synonyms
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

  const mentionsChart = /\bchart\b/.test(base) || /\bchart\b/.test(constraint);
  const mentionsBars  = /\bbars\b/.test(base) || /\bbars\b/.test(constraint);
  const mentionsVault = /\bvault\b/.test(base) || /\bsafe\b/.test(base);

  // If "bars" without chart → interpret as bullion ingots
  if (mentionsBars && !mentionsChart) {
    base = base.replace(/\bbars\b/g, "bullion ingots");
    constraint = constraint.replace(/\bbars\b/g, "bullion ingots");
  }

  // CHARTS: explicit type + 3D + short material
  if (mentionsChart || (contextHasChart && mentionsBars)) {
    if (!/\b(bar|line|area|candlestick)\s*chart\b/.test(base)) {
      base = base.replace(/\bchart\b/g, `${CONFIG.defaultChartType} chart`);
    }
    if (!/\b3d\b/.test(base)) base = `3d ${base}`;
    if (!constraint) constraint = CONFIG.defaultChartMaterial;
  }

  // INGOTS: explicit 3D + short material
  if (/\bbullion ingots\b/.test(base)) {
    if (!/\b3d\b/.test(base)) base = `3d ${base}`;
    if (!constraint) constraint = CONFIG.defaultIngotMaterial;
  }

  // Vaults / Safe: state contents simply if hinted
  if (mentionsVault) {
    const talksChart  = /\bchart\b/.test(base) || /\bchart\b/.test(constraint);
    const talksIngots = /\bbullion ingots\b/.test(base) || /\bbullion ingots\b/.test(constraint);
    const talksCoins  = /\bplain coins\b/.test(base) || /\bplain coins\b/.test(constraint);
    const talksNotes  = /\bplain notes\b/.test(base) || /\bplain notes\b/.test(constraint);

    base = /safe/.test(base) ? "open safe" : "open vault";
    if (talksChart)       constraint = `3D ${CONFIG.defaultChartType} chart emerging`;
    else if (talksIngots) constraint = "3D bullion ingots spilling out";
    else if (talksCoins)  constraint = "plain coins (no symbols) spilling out";
    else if (talksNotes)  constraint = "plain notes (no symbols or text) spilling out";
    else                  constraint = "generic, no text";
  }

  // Minimal necessary constraints
  if (/\bcompass\b/.test(base) && !/no numbers|no letters/i.test(constraint)) {
    constraint = "no numbers or letters";
  }
  if (/\bplain coins\b/.test(base) && !/no symbols/i.test(constraint)) {
    constraint = "no symbols";
  }
  if (/\bplain notes\b/.test(base) && !/no symbols|no text/i.test(constraint)) {
    constraint = "no symbols or text";
  }
  if (/\b(calculator|computer|server|screen|display)\b/.test(base) && !/no numbers|no text/i.test(constraint)) {
    constraint = "no numbers or text";
  }
  if (/\bledger\b/.test(base) && !/no text/i.test(constraint)) {
    constraint = "no text";
  }

  // Keep short; if still empty, leave generic and brief
  if (!constraint) constraint = "generic, no text";

  return `${cap(base)} (${cap(constraint)})`;
}

function normaliseVisual(visual: string): string {
  const raw = visual.split(",").map((p) => tidy(p)).filter(Boolean).slice(0, 2);
  if (raw.length === 0) return `3D ${CONFIG.defaultChartType} chart (${cap(CONFIG.defaultChartMaterial)})`;

  const contextHasChart = raw.some((p) => /\bchart\b/i.test(p));
  const fixed = raw.map((p) => normaliseObjectToken(p, contextHasChart));

  // Put chart first if present
  const charts = fixed.filter((p) => /\b3d\b.*\bchart\b/i.test(p));
  const non    = fixed.filter((p) => !/\b3d\b.*\bchart\b/i.test(p));
  const ordered = (charts.length ? [charts[0]] : []).concat(non).slice(0, 2);

  // Never leave bare "bars"
  return ordered.map((p) =>
    /\bbars\b/i.test(p) && !/\bchart\b|\bbullion ingots\b/i.test(p)
      ? p.replace(/\bbars\b/gi, "bullion ingots")
      : p
  ).join(", ");
}

/* ─── route ─────────────────────────────────────────────────────── */
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
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }]
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
      .filter(o => o && typeof o.slogan === "string" && typeof o.visual === "string")
      .map(o => {
        const slogan = tidy(o.slogan).split(/\s+/).slice(0, 4).join(" ");
        const mirrored = mirrorFinanceCue(slogan, o.visual);
        const visual = normaliseVisual(mirrored);
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