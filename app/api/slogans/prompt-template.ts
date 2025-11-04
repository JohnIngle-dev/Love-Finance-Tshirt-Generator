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
- METAL INGOTS: write **"3D bullion ingots (…material/energy…)"**.
- CHARTS: write **"3D [TYPE] chart (…material/energy…)"**, type named explicitly (bar, line, area, candlestick, etc.).
- Vaults MUST state what emerges, e.g.
  - "Open vault (3D bullion ingots spilling out)" OR
  - "Open vault (plain coins, no symbols)".
- Every object must be unambiguous and easy to depict on a T-shirt.

GENERIC OBJECT RULES
- Use generic items only; no readable text, numbers, logos or symbols.
  - Coins/notes: **"plain coins (no symbols)"**, **"plain notes (no symbols or text)"**.
  - Calculators/computers/screens/displays: **"(no numbers or text)"**.
  - Ledgers/books: **"(no text)"**.
  - Compass: **"(no numbers or letters)"**.

MIRROR THE SLOGAN (CRITICAL)
- If the slogan explicitly mentions a finance item/visual, INCLUDE THAT SAME ITEM in the motif with correct constraints.
  Example mappings:
  - “vault” → include **Open vault (…explicit contents…)**
  - “chart / bar chart / graph” → include **3D [TYPE] chart (…material/energy…)**
  - “coins / cash / notes / dollars” → **plain coins (no symbols)** or **plain notes (no symbols or text)**
  - recipets / book / spreadsheet” → **recipets (no text)** or **spreadsheet grid (no text)**
  - “calculator / computer / server / screen” → **(no numbers or text)**
  - “compass” → **(no numbers or letters)**
  - “safe” → **open safe (generic, no text, explicit contents)** OR **open vault (…explicit contents… )**
- Imagery may be metaphorical but must still be visually obvious and finance-adjacent.

SAFETY
- No slurs, explicit gore, sexual content, real-world violence, politics, or religion.

USER INPUT:
"{{love}}"
`;