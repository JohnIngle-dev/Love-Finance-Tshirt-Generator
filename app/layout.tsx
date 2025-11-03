import "./globals.css";
import { Rock_Salt, Inter } from "next/font/google";

const brush = Rock_Salt({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "T-Shirt Generator",
  description: "Love Finance — Metal merch generator"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-[#1f1f1f] text-white`}>
        <header className="w-full px-6 pt-10 pb-6">
          <div className="max-w-[1100px] mx-auto text-center">
            <h1 className={`hero-title ${brush.className}`}>T-SHIRT<br/>GENERATOR</h1>
          </div>
        </header>

        {/* centred content wrapper (has CSS fallback and Tailwind classes) */}
        <main className="center-page flex items-center justify-center">
          <div className="w-full max-w-[1100px]">{children}</div>
        </main>
      </body>
    </html>
  );
}