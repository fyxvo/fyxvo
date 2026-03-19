"use client";

import { Button } from "@fyxvo/ui";
import { MoonIcon, SunIcon } from "./icons";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "fyxvo-dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      leadingIcon={isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      className="rounded-full border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-3 text-[var(--fyxvo-text-soft)] hover:bg-[var(--fyxvo-panel)]"
    >
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}
