import "./globals.css";
import { Rock_Salt, Inter } from "next/font/google";

const brush = Rock_Salt({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "T-Shirt Generator",
  description: "Love Finance — Metal merch generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-screen ${inter.className} bg-ink text-ink-100 antialiased`}>
        <div className="theme-root pointer-events-none fixed inset-0 -z-10" />
        <header className="py-6">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h1 className={`${brush.className} hero-title select-none`}>T-SHIRT<br />GENERATOR</h1>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}