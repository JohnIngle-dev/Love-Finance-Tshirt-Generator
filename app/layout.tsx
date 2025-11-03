import "./globals.css";
import { UnifrakturMaguntia, Inter } from "next/font/google";

const gothic = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Love Finance — T-Shirt Generator",
  description: "Metal-style finance merch generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-screen ${inter.className} text-zinc-100 bg-base`}>
        {/* Ramp-like clean chrome with a metal twist */}
        <div className="fixed inset-0 -z-10 bg-vignette" />
        <div className="fixed inset-0 -z-10 bg-noise opacity-20 mix-blend-soft-light pointer-events-none" />

        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/55 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600/90 to-fuchsia-700/90 ring-1 ring-white/15 shadow-[0_6px_22px_rgba(239,68,68,0.35)]" />
              <div className={`${gothic.className} text-2xl md:text-3xl tracking-wide select-none`}>LOVE FINANCE</div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
              <span className="nav-link">Generator</span>
              <span className="nav-link">Designs</span>
              <span className="nav-link">About</span>
              <button className="btn-ghost">Sign in</button>
              <button className="btn-primary">Create</button>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}