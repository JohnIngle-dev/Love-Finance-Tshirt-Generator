export const SLOGAN_PROMPT = `
You create three short, metal-style slogans and a clear visual motif for each,
based on what the user loves about finance.

Return JSON ONLY in this shape:
[
  { "slogan": "SLOGAN 1", "visual": "OBJECT (optional constraint), OBJECT (optional constraint)" },
  { "slogan": "SLOGAN 2", "visual": "..." },
  { "slogan": "SLOGAN 3", "visual": "..." }
]

Guidelines
- Exactly 3 options.
- Slogan: 1–4 words. Metal energy, punchy, memorable.
- Visual motif: 1–2 simple objects that clearly fit the slogan (directly or metaphorically).
- Keep it depictable on a T-shirt: single, obvious subjects. Avoid long descriptions.

Clarity rules (lightweight)
- If using currency: use “plain coins (no symbols)” or “plain notes (no symbols or text)”.
- If using calculators/computers/ledgers/screens: add “(no numbers or text)” or for ledgers “(no text)”.
- If using a compass: add “(no numbers or letters)”.
- Otherwise, keep constraints short and optional (e.g. “crown (gold)”, “prayer hands (stylised)”, “cross (bold shape)”).

Examples (style, not content)
- "In formulas we trust" → "cross (bold shape), prayer hands (stylised)"
- "Tax warrior" → "calculator (smashed, no numbers or text)"
- "Cash is king" → "crown (gold), plain notes (no symbols or text)"

User input:
"{{love}}"
`;