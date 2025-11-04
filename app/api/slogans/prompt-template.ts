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
- Slogan: 1–4 words. Punchy, metal energy.
- Visual motif: 1–2 simple objects that clearly match the slogan (directly or metaphorically).
- Keep it depictable on a T-shirt: obvious subjects, short constraints only where helpful.
- If the slogan names a finance object, include that same object in the motif.

Clarity rules (light)
- Currency: “plain coins (no symbols)” or “plain notes (no symbols or text)”.
- Devices/records: calculators, computers, screens → “(no numbers or text)”; ledgers/books → “(no text)”.
- Compass: “(no numbers or letters)”.
- Charts: say the type explicitly, e.g. “3D bar chart (neon glass)”.
- Avoid logos, readable text, or numbers in motifs.

Examples (style only)
- "In formulas we trust" → "cross (bold), prayer hands (stylised)"
- "Tax warrior" → "calculator (smashed, no numbers or text)"
- "Cash is king" → "crown (gold), plain notes (no symbols or text)"

User input:
"{{love}}"
`;