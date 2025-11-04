export const SLOGAN_PROMPT = `
You create three short, metal-style slogans and a clear, depictable visual motif for each,
based on what the user loves about finance.

OUTPUT FORMAT — JSON array ONLY (no prose):
[
  { "slogan": "SLOGAN 1", "visual": "OBJECT (constraints), OBJECT (constraints), OBJECT (constraints)" },
  { "slogan": "SLOGAN 2", "visual": "..." },
  { "slogan": "SLOGAN 3", "visual": "..." }
]

REQUIREMENTS
- Exactly 3 options.
- Slogan: 1–4 words, metal energy; no quotes/emojis/hashtags.
- Motif: 1–3 concrete OBJECTS, comma-separated. Each OBJECT MUST include constraints in parentheses.

DISAMBIGUATION (VERY IMPORTANT)
- Never use the word "bars" by itself.
- If you mean METAL INGOTS: write **"3D bullion ingots (…material/energy…)"**.
- If you mean a CHART: write **"3D [TYPE] chart (…material/energy…)"** and name the type explicitly
  (bar, line, area, candlestick, etc.). Include a short descriptor like "(molten steel)", "(neon glass)".
- Vaults must explicitly state what emerges, e.g.
  - "Open vault (3D bullion ingots spilling out)" or
  - "Open vault (3D bar chart emerging)" or
  - "Open vault (plain coins, no symbols)".
- Every object must be unambiguous and easy to depict on a T-shirt.

GENERIC OBJECT RULES
- Use generic items only; no readable text, numbers, logos or symbols.
  - Coins/notes: **"plain coins (no symbols)"**, **"plain notes (no symbols or text)"**.
  - Calculators/computers/screens/displays: **"(no numbers or text)"**.
  - Ledgers/books: **"(no text)"**.
  - Compass: **"(no numbers or letters)"**.
- Imagery may be metaphorical but must be visually obvious (e.g. recipts, computers, credit cards, bank notes, abacus, vaults or safes, coins, calculators, servers, cogs).

SAFETY
- No slurs, explicit gore, sexual content, real-world violence, politics, or religion.

USER INPUT:
"{{love}}"
`;