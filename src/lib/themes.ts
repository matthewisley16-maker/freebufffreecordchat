/**
 * Curated Freecord themes.
 *
 * Every theme is a complete dark (or light) palette defined in index.css under
 * `html[data-theme="…"]`; the preview colours here are the same values, so the
 * little preview card in Settings matches what the app will look like.
 *
 * `dark` keeps its old id so existing accounts need no migration.
 */
export type ThemeOption = {
  id: string;
  name: string;
  blurb: string;
  preview: { bg: string; rail: string; side: string; panel: string; accent: string };
};

export const THEMES: ThemeOption[] = [
  {
    id: "dark",
    name: "Freecord",
    blurb: "The classic purple",
    preview: { bg: "#0b0b10", rail: "#0d0d12", side: "#121218", panel: "#17171f", accent: "#8b5cf6" },
  },
  {
    id: "midnight",
    name: "Midnight",
    blurb: "Deep blue calm",
    preview: { bg: "#070b16", rail: "#090f1e", side: "#0c1424", panel: "#101a2e", accent: "#4f8dff" },
  },
  {
    id: "sakura",
    name: "Sakura",
    blurb: "Soft pink dusk",
    preview: { bg: "#120912", rail: "#170b17", side: "#1b0e1b", panel: "#221224", accent: "#f472b6" },
  },
  {
    id: "forest",
    name: "Forest",
    blurb: "Fresh emerald",
    preview: { bg: "#06110d", rail: "#081611", side: "#0a1a14", panel: "#0e211a", accent: "#34d399" },
  },
  {
    id: "sunset",
    name: "Sunset",
    blurb: "Warm amber glow",
    preview: { bg: "#120c0a", rail: "#170f0c", side: "#1c1210", panel: "#231714", accent: "#fb923c" },
  },
  {
    id: "mono",
    name: "Mono",
    blurb: "Quiet greyscale",
    preview: { bg: "#08080a", rail: "#0b0b0e", side: "#101014", panel: "#15151b", accent: "#a1a1aa" },
  },
  {
    id: "light",
    name: "Daylight",
    blurb: "Bright and airy",
    preview: { bg: "#f4f4f8", rail: "#e9e8f2", side: "#eeeef6", panel: "#f7f7fb", accent: "#7c5cf6" },
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
