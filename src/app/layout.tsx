import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_THEME_ID,
  CUSTOM_THEME_ID,
  DEFAULT_CUSTOM_COLORS,
  buildCustomThemeStyle,
} from "@/lib/themes";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Used sparingly — logo + hero titles only. Legible enough at large sizes,
// but a pixel font kills readability fast on body copy or long headings.
const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // The apex domain 308-redirects here — www is what's actually served.
  metadataBase: new URL("https://www.emulatornds.online"),
  title: {
    default: "RomHack Hub",
    template: "%s — RomHack Hub",
  },
  description:
    "Publica y descubre parches de ROM hacks para consolas retro (NES, SNES, N64, Game Boy, GBA, DS, 3DS, Switch). Solo parches, nunca ROMs.",
  openGraph: {
    siteName: "RomHack Hub",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const themeId = user?.theme ?? DEFAULT_THEME_ID;

  const customStyle =
    themeId === CUSTOM_THEME_ID
      ? buildCustomThemeStyle({
          bg: user?.customThemeBg ?? DEFAULT_CUSTOM_COLORS.bg,
          surface: user?.customThemeSurface ?? DEFAULT_CUSTOM_COLORS.surface,
          accent: user?.customThemeAccent ?? DEFAULT_CUSTOM_COLORS.accent,
          text: user?.customThemeText ?? DEFAULT_CUSTOM_COLORS.text,
        })
      : undefined;

  return (
    <html
      lang="es"
      data-theme={themeId}
      style={customStyle}
      className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} h-full antialiased`}
    >
      {ADSENSE_CLIENT_ID && (
        <head>
          {/*
            Deliberately a raw <script> tag, not next/script: Google's
            AdSense site-verification check looks for this exact literal
            snippet in the server-rendered HTML. next/script's
            beforeInteractive strategy instead injects the tag via a JS
            bootstrap call, so the literal snippet never appears in the raw
            HTML and verification fails even though the script does load.
          */}
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body className="bg-page text-base min-h-full flex flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-base text-muted border-t px-4 py-6 text-center text-xs">
          <p>
            Este sitio distribuye únicamente parches (IPS/BPS/UPS), nunca ROMs completas.
            Necesitas tu propia copia legal del juego original para aplicar un parche.
          </p>
          <nav className="mt-2 flex justify-center gap-4">
            <Link href="/about" className="hover-text-accent">
              Acerca de
            </Link>
            <Link href="/contact" className="hover-text-accent">
              Contacto
            </Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
