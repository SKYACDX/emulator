import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RomHack Hub",
  description: "Publica y descubre parches de ROM hacks para consolas retro",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-800 px-4 py-6 text-center text-xs text-neutral-500">
          Este sitio distribuye únicamente parches (IPS/BPS/UPS), nunca ROMs completas.
          Necesitas tu propia copia legal del juego original para aplicar un parche.
        </footer>
      </body>
    </html>
  );
}
