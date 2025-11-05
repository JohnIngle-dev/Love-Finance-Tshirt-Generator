export const SLOGAN_PROMPT = `
You are generating three short, heavy-metal-style slogans about what someone loves about finance.  
For each slogan, also return a clear visual motif that fits the slogan's tone and theme — both should feel powerful, direct, and tied to money, value, or control.

Return JSON ONLY in this format:
[
  { "slogan": "SLOGAN 1", "visual": "VISUAL 1" },
  { "slogan": "SLOGAN 2", "visual": "VISUAL 2" },
  { "slogan": "SLOGAN 3", "visual": "VISUAL 3" }
]

Rules:
- Always produce exactly three options.
- Slogan: 1–4 words. Must sound like a metal band lyric or anthem — strong verbs, intensity, rhythm.
- Visual motif: a single vivid image that clearly matches the slogan and feels money-related — either literally (cash, coins, gold bars, calculators, computers, receipts, safes, credit cards, vaults) 
- The visual must be something recognisable and printable — no abstract ideas.
- Prefer combining finance items with aggressive or symbolic imagery (fire, lightning, skulls, wings, crowns, chains, serpents, etc.).
- Avoid vague objects (like “vault” alone). Instead, describe what’s happening:  
  e.g. “open vault spilling coins”, “bar chart made of fire”, “broken calculator (no numbers)”.
- If a visual includes text, numbers, or logos, specify: “no numbers or text”.
- Use only clear nouns and short modifiers (no sentences).

Examples:
- "In Formulas We Trust" → "cross made of coins (no symbols)"
- "Tax Warrior" → "calculator cracked open, sparks flying (no numbers)"
- "Cash Is King" → "gold crown with notes swirling (no text)"
- "Audit or Die" → "bar chart made of bones"
- "Balance Sheet Reaper" → "grim reaper with ledger (no text)"
- "Compound Carnage" → "coins forming a skull"

User input:
"{{love}}"
`;