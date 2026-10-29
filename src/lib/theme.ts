"use client";

export type ThemeMode = "light" | "dark" | "midnight";

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  icon: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: "light",
    name: "Classic Light",
    description: "Clean & high contrast slate look",
    icon: "☀️",
  },
  {
    id: "dark",
    name: "Obsidian Night",
    description: "Deep neutral dark mode for night work",
    icon: "🌙",
  },
  {
    id: "midnight",
    name: "Midnight Sapphire",
    description: "Deep navy and royal blue luxury tint",
    icon: "🌌",
  },
];

const THEME_STORAGE_KEY = "stockledger_theme";

export function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
  if (saved === "dark" || saved === "midnight" || saved === "light") {
    return saved;
  }
  return "light";
}

export function saveTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemeToDOM(theme);
  window.dispatchEvent(new CustomEvent("stockledger_theme_changed", { detail: theme }));
}

export function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark", "theme-midnight", "dark");

  if (theme === "dark") {
    root.classList.add("dark", "theme-dark");
    root.style.colorScheme = "dark";
  } else if (theme === "midnight") {
    root.classList.add("dark", "theme-midnight");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("theme-light");
    root.style.colorScheme = "light";
  }
}
