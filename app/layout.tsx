import "./globals.css";
import { Rock_Salt, Inter } from "next/font/google";

const brush = Rock_Salt({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = { title: "T-Shirt Generator", description: "Metal merch generator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-[#1f1f1f] text-white flex flex-col`}>
        <header className="w-full flex justify-center pt-10 pb-6">
          <div className="w-full max-w-5xl px-6 text-center">
            <h1 className={`${brush.className} leading-none text-white text-[10vw] md:text-[7rem]`}>
              T-SHIRT<br />GENERATOR
            </h1>
          </div>
        </header>
        <main className="w-full flex-1 flex justify-center items-start md:items-center">
          {children}
        </main>
      </body>
    </html>
  );
}