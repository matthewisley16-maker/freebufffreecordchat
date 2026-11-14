/**
 * Curated Freecord themes.
 *
 * Two collections: "signature" (clean, classic looks) and "nitro" (deeper
 * gradients, glow and saturated accents). Every theme is a complete palette in
 * index.css under `html[data-theme="…"]`; the preview colours here mirror those
 * values so the card in Settings matches the app.
 *
 * `dark` keeps its old id so existing accounts need no migration.
 */
export type ThemeGroup = "signature" | "nitro";
export type ThemeOption = {
  id: string;
  name: string;
  blurb: string;
  group: ThemeGroup;
  preview: {
    bg: string;
    rail: string;
    side: string;
    panel: string;
    accent: string;
    accent2: string;
    glow: string;
  };
};

export const THEMES: ThemeOption[] = [
  {
    id: "dark",
    name: "Freecord",
    blurb: "The classic purple",
    group: "signature",
    preview: { bg: "#0b0b10", rail: "#0d0d12", side: "#121218", panel: "#17171f", accent: "#8b5cf6", accent2: "#6d3ff5", glow: "rgba(139,92,246,.20)" },
  },
  {
    id: "midnight",
    name: "Midnight",
    blurb: "Deep blue calm",
    group: "signature",
    preview: { bg: "#070b16", rail: "#090f1e", side: "#0c1424", panel: "#101a2e", accent: "#4f8dff", accent2: "#2563eb", glow: "rgba(79,141,255,.20)" },
  },
  {
    id: "sakura",
    name: "Sakura",
    blurb: "Soft pink dusk",
    group: "signature",
    preview: { bg: "#120912", rail: "#170b17", side: "#1b0e1b", panel: "#221224", accent: "#f472b6", accent2: "#db2777", glow: "rgba(244,114,182,.20)" },
  },
  {
    id: "forest",
    name: "Forest",
    blurb: "Fresh emerald",
    group: "signature",
    preview: { bg: "#06110d", rail: "#081611", side: "#0a1a14", panel: "#0e211a", accent: "#34d399", accent2: "#059669", glow: "rgba(52,211,153,.18)" },
  },
  {
    id: "sunset",
    name: "Sunset",
    blurb: "Warm amber glow",
    group: "signature",
    preview: { bg: "#120c0a", rail: "#170f0c", side: "#1c1210", panel: "#231714", accent: "#fb923c", accent2: "#ea580c", glow: "rgba(251,146,60,.19)" },
  },
  {
    id: "mono",
    name: "Mono",
    blurb: "Quiet greyscale",
    group: "signature",
    preview: { bg: "#08080a", rail: "#0b0b0e", side: "#101014", panel: "#15151b", accent: "#d4d4d8", accent2: "#a1a1aa", glow: "rgba(228,228,231,.12)" },
  },
  {
    id: "light",
    name: "Daylight",
    blurb: "Bright and airy",
    group: "signature",
    preview: { bg: "#f4f4f8", rail: "#e9e8f2", side: "#eeeef6", panel: "#f7f7fb", accent: "#7c5cf6", accent2: "#6d3ff5", glow: "rgba(124,92,246,.12)" },
  },
  {
    id: "aurora",
    name: "Aurora",
    blurb: "Teal light, violet air",
    group: "nitro",
    preview: { bg: "#05100f", rail: "#071615", side: "#08201d", panel: "#0b2622", accent: "#2dd4bf", accent2: "#0ea5e9", glow: "rgba(45,212,191,.22)" },
  },
  {
    id: "nebula",
    name: "Nebula",
    blurb: "Cosmic violet drift",
    group: "nitro",
    preview: { bg: "#0a0618", rail: "#0e0820", side: "#120b28", panel: "#170e33", accent: "#c084fc", accent2: "#6366f1", glow: "rgba(192,132,252,.22)" },
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    blurb: "Neon sunset nostalgia",
    group: "nitro",
    preview: { bg: "#0d0716", rail: "#120a1e", side: "#170d26", panel: "#1e1130", accent: "#ff5fd2", accent2: "#7c5cff", glow: "rgba(255,95,210,.22)" },
  },
  {
    id: "cyber",
    name: "Cyber",
    blurb: "Acid lime circuitry",
    group: "nitro",
    preview: { bg: "#050806", rail: "#070b08", side: "#091009", panel: "#0c150d", accent: "#b6ff3c", accent2: "#22d3ee", glow: "rgba(182,255,60,.18)" },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    blurb: "Black tie, gold trim",
    group: "nitro",
    preview: { bg: "#070707", rail: "#0a0a0b", side: "#0d0d0f", panel: "#111114", accent: "#f5c86b", accent2: "#c9962f", glow: "rgba(245,200,107,.16)" },
  },
  {
    id: "ember",
    name: "Ember",
    blurb: "Molten charcoal",
    group: "nitro",
    preview: { bg: "#0c0605", rail: "#110807", side: "#150a09", panel: "#1b0e0c", accent: "#ff6a3d", accent2: "#e11d48", glow: "rgba(255,106,61,.20)" },
  },
  {
    id: "glacier",
    name: "Glacier",
    blurb: "Frozen steel blue",
    group: "nitro",
    preview: { bg: "#071018", rail: "#0a1620", side: "#0c1c28", panel: "#102533", accent: "#67e8f9", accent2: "#3b82f6", glow: "rgba(103,232,249,.18)" },
  },
  {
    id: "lavender",
    name: "Lavender",
    blurb: "Soft violet haze",
    group: "nitro",
    preview: { bg: "#0b0912", rail: "#0f0c19", side: "#130f1f", panel: "#181228", accent: "#a78bfa", accent2: "#818cf8", glow: "rgba(167,139,250,.20)" },
  },
  {
    id: "rosegold",
    name: "Rose Gold",
    blurb: "Blush and champagne",
    group: "nitro",
    preview: { bg: "#120a0d", rail: "#170d11", side: "#1c1015", panel: "#23141a", accent: "#f9a8a8", accent2: "#e08a6d", glow: "rgba(249,168,168,.18)" },
  },
];

const THEME_STORAGE_KEY = "freecord:theme";

export function storedTheme(): string | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value && THEMES.some((theme) => theme.id === value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Put a theme on <html> and remember it locally, so a refresh paints the right
 * palette before the account query returns (no purple flash for a pink theme).
 */
export function applyTheme(id: string) {
  const theme = THEMES.some((option) => option.id === id) ? id : "dark";
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("fc-light", theme === "light");
    root.classList.toggle("fc-midnight", theme === "midnight");
    root.classList.toggle("fc-contrast", false);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / full storage: the theme still applies for this tab.
  }
}
