"use client";

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type Theme = "fyxvo-dark" | "fyxvo-light";

interface ThemeContextValue {
  readonly theme: Theme;
  readonly resolvedTheme: Theme;
  setTheme(theme: Theme): void;
  toggleTheme(): void;
}

const STORAGE_KEY = "fyxvo.web.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "fyxvo-dark"
}: PropsWithChildren<{
  readonly defaultTheme?: Theme;
}>) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "fyxvo-light" || storedTheme === "fyxvo-dark" ? storedTheme : defaultTheme;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme(nextTheme) {
        setThemeState(nextTheme);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, nextTheme);
        }
        applyTheme(nextTheme);
      },
      toggleTheme() {
        const nextTheme = theme === "fyxvo-dark" ? "fyxvo-light" : "fyxvo-dark";
        setThemeState(nextTheme);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, nextTheme);
        }
        applyTheme(nextTheme);
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
