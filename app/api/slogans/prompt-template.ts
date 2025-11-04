export const SLOGAN_PROMPT = `
You are creating three short, metal-style slogans and one clear visual motif for each,
based on what the user loves about finance.

OUTPUT FORMAT (JSON array only — no prose):
[
  { "slogan": "SLOGAN 1", "visual": "VISUAL 1" },
  { "slogan": "SLOGAN 2", "visual": "VISUAL 2" },
  { "slogan": "SLOGAN 3", "visual": "VISUAL 3" }
]

REQUIREMENTS
- Count: exactly 3 options.
- Slogan: 1–4 words, bold metal energy, rockstar, don't give a fuck, attitude, cool, poetic or metaphorical is fine.
- Motif: one concrete, visually obvious subject, easy to depict on a T-shirt.

MOTIF CLARITY RULES (very important)
- If you use charts: use ONLY a **3D bar chart** (never pie/line/area/candles). Make it visually exciting (e.g. molten steel bars, neon glass bars, grave stone bars).
- Allowed imagery can be anything that fits the slogan AND evokes accounting/finance either directly or metaphorically (e.g. ledgers, recipts, computers, credit cards, bank notes, abacus, vaults or safes, coins, calculators, servers, cogs).
- The motif must be a single clear subject, optionally with a brief texture/energy adjective.
- Use generic objects: 
  - coins/notes/cash with **no symbols, no writing, no currency marks**,
  - calculators/computers **without numbers or text**,
  - images should be explicit: e.g. "open vault with coins flying out".
- No logos, trademarks, real text, or readable numbers.
- Keep it short: ideally 2–6 words for "visual".

SAFETY / TONE
- Metal vibe is welcome (skulls, fire, chains, storms), but avoid explicit gore, hate, sexual content, or real-world violence.
- No slurs, no politics, no religion.

USER INPUT (what they love about finance):
"{{love}}"
`;