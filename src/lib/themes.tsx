import type { CSSProperties, ReactNode } from "react";

export type Theme = {
  id: string;
  name: string;
  /** CSS custom property values applied on <html data-theme="..."> */
  bg: string;
  surface: string;
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

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M12 4a8 8 0 1 0 0 16h1a2 2 0 0 0 2-2 2 2 0 0 1 2-2h1a4 4 0 0 0 4-4c0-4.4-4.5-8-10-8Z"
        fill="currentColor"
      />
      <circle cx="8.5" cy="10.5" r="1.2" fill="white" fillOpacity="0.7" />
      <circle cx="12" cy="8" r="1.2" fill="white" fillOpacity="0.7" />
      <circle cx="15.5" cy="10.5" r="1.2" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

export const CUSTOM_THEME_ID = "custom";
export const DEFAULT_THEME_ID = "default";

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Clásico",
    bg: "#0a0a0a",
    surface: "#171717",
    accent: "#10b981",
    accentHover: "#34d399",
    accentText: "#ffffff",
    icon: null,
  },
  {
    id: "mushroom",
    name: "Reino de Hongos",
    bg: "#1a0a0a",
    surface: "#2a1212",
    accent: "#dc2626",
    accentHover: "#ef4444",
    accentText: "#ffffff",
    icon: <MushroomIcon />,
  },
  {
    id: "forest",
    name: "Aventura en el Bosque",
    bg: "#0a140d",
    surface: "#102015",
    accent: "#16a34a",
    accentHover: "#22c55e",
    accentText: "#ffffff",
    icon: <SwordLeafIcon />,
  },
  {
    id: "cosmic",
    name: "Estrella Espacial",
    bg: "#120a1a",
    surface: "#1e1030",
    accent: "#9333ea",
    accentHover: "#a855f7",
    accentText: "#ffffff",
    icon: <PlanetIcon />,
  },
  {
    id: "speedway",
    name: "Carrera Veloz",
    bg: "#14120a",
    surface: "#241f10",
    accent: "#eab308",
    accentHover: "#facc15",
    accentText: "#1c1917",
    icon: <FlagIcon />,
  },
];

export const CUSTOM_THEME_META = {
  id: CUSTOM_THEME_ID,
  name: "Personalizado",
  icon: <PaletteIcon />,
};

export function isValidPresetThemeId(id: string): boolean {
  return THEMES.some((t) => t.id === id);
}

export function isValidThemeId(id: string): boolean {
  return id === CUSTOM_THEME_ID || isValidPresetThemeId(id);
}

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

export type CustomThemeColors = {
  bg: string;
  surface: string;
  accent: string;
  text: string;
};

/** Rough perceptual brightness check to auto-pick readable text-on-accent color. */
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/**
 * Builds the inline `style` object for <html> when theme === "custom" —
 * custom colors are arbitrary per-user hex values, not one of the static
 * [data-theme] blocks in globals.css, so they're set directly as CSS custom
 * properties here instead.
 */
export function buildCustomThemeStyle(colors: CustomThemeColors): CSSProperties {
  return {
    ["--color-bg" as string]: colors.bg,
    ["--color-surface" as string]: colors.surface,
    ["--color-surface-hover" as string]: colors.surface,
    ["--color-border" as string]: colors.surface,
    ["--color-border-hover" as string]: colors.surface,
    ["--color-text" as string]: colors.text,
    ["--color-text-muted" as string]: colors.text,
    ["--color-accent" as string]: colors.accent,
    ["--color-accent-hover" as string]: colors.accent,
    ["--color-accent-text" as string]: isLight(colors.accent) ? "#1c1917" : "#ffffff",
  };
}

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  bg: "#0a0a0a",
  surface: "#171717",
  accent: "#10b981",
  text: "#f5f5f5",
};

/**
 * Applies colors straight to <html> for an unsaved live preview (used by
 * the theme editor and the community theme gallery). Client-only — never
 * called during server rendering.
 */
export function applyLivePreview(colors: CustomThemeColors): void {
  const style = buildCustomThemeStyle(colors);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(style)) {
    root.style.setProperty(key, value as string);
  }
}

const PREVIEW_CSS_VARS = [
  "--color-bg",
  "--color-surface",
  "--color-surface-hover",
  "--color-border",
  "--color-border-hover",
  "--color-text",
  "--color-text-muted",
  "--color-accent",
  "--color-accent-hover",
  "--color-accent-text",
];

/**
 * Undoes applyLivePreview(). Needed because these properties were set via
 * direct DOM manipulation, outside React's own style-prop bookkeeping — if
 * the resting layout has no inline style at all (style={undefined}, e.g.
 * anonymous visitors or any non-custom theme), React's diffing sees
 * "undefined before and after" and never touches the style attribute on
 * its own, so a plain re-render/refresh would otherwise leave the preview
 * colors stuck.
 */
export function clearLivePreview(): void {
  const root = document.documentElement;
  for (const key of PREVIEW_CSS_VARS) {
    root.style.removeProperty(key);
  }
}
