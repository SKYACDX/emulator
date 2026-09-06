import type { ReactNode } from "react";

export type Theme = {
  id: string;
  name: string;
  /** CSS custom property values applied on <html data-theme="..."> */
  accent: string;
  accentHover: string;
  accentText: string;
  icon: ReactNode;
};

// All icons below are original, simple geometric shapes evoking a genre
// (mushroom, sword, planet, flag) — not traces or reproductions of any
// official Nintendo character, sprite, or logo.

function MushroomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M4 11C4 6.58 7.58 4 12 4s8 2.58 8 7c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1Z"
        fill="currentColor"
      />
      <circle cx="9" cy="8.5" r="1" fill="white" fillOpacity="0.6" />
      <circle cx="14" cy="7.5" r="0.8" fill="white" fillOpacity="0.6" />
      <rect x="9.5" y="12" width="5" height="7" rx="2" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

function SwordLeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M12 3v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 6.5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16l-2 3h4l-2-3Z" fill="currentColor" />
      <path
        d="M17 10c1.5 1.5 1.5 4 0 5.5-1.5-1.5-1.5-4 0-5.5Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  );
}

function PlanetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-20 12 12)"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M6 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4h12l-3 3.5L18 11H6V4Z" fill="currentColor" />
      <path d="M9 4v7M12 4v7M15 4v3.5" stroke="white" strokeOpacity="0.5" strokeWidth="1.2" />
    </svg>
  );
}

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Clásico",
    accent: "#10b981",
    accentHover: "#34d399",
    accentText: "#ffffff",
    icon: null,
  },
  {
    id: "mushroom",
    name: "Reino de Hongos",
    accent: "#dc2626",
    accentHover: "#ef4444",
    accentText: "#ffffff",
    icon: <MushroomIcon />,
  },
  {
    id: "forest",
    name: "Aventura en el Bosque",
    accent: "#16a34a",
    accentHover: "#22c55e",
    accentText: "#ffffff",
    icon: <SwordLeafIcon />,
  },
  {
    id: "cosmic",
    name: "Estrella Espacial",
    accent: "#9333ea",
    accentHover: "#a855f7",
    accentText: "#ffffff",
    icon: <PlanetIcon />,
  },
  {
    id: "speedway",
    name: "Carrera Veloz",
    accent: "#eab308",
    accentHover: "#facc15",
    accentText: "#1c1917",
    icon: <FlagIcon />,
  },
];

export const DEFAULT_THEME_ID = "default";

export function isValidThemeId(id: string): boolean {
  return THEMES.some((t) => t.id === id);
}

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
