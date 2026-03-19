import type { Config } from "tailwindcss";

export const fyxvoTailwindPreset = {
  content: [],
  darkMode: ["class", '[data-theme="fyxvo-dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c"
        }
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "Space Grotesk",
          "IBM Plex Sans",
          "ui-sans-serif",
          "sans-serif"
        ],
        sans: [
          "var(--font-sans)",
          "IBM Plex Sans",
          "ui-sans-serif",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 20px 60px rgba(249, 115, 22, 0.22)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  }
} satisfies Config;

export type FyxvoTailwindPreset = typeof fyxvoTailwindPreset;
