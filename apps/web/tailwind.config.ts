import type { Config } from "tailwindcss";
import { fyxvoTailwindPreset } from "../../packages/ui/src/tailwind-preset";

export default {
  presets: [fyxvoTailwindPreset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"]
} satisfies Config;
