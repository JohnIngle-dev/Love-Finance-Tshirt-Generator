import "./globals.css";
import { Rock_Salt, Inter } from "next/font/google";

const brush = Rock_Salt({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "T-Shirt Generator",
  description: "Love Finance — Metal Merch Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen ${inter.className} bg-[#1f1f1f] text-white`}>
        <div className="fixed inset-0 -z-10 bg-[#1f1f1f]" />
        <header className="pt-12 pb-8 text-center">
          <h1 className={`${brush.className} text-6xl md:text-8xl text-white leading-none`}>
            T-SHIRT<br />GENERATOR
          </h1>
        </header>
        {children}
      </body>
    </html>
  );
}