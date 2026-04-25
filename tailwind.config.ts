/**
 * Tailwind v4 config.
 *
 * v4 prefers CSS-based config via the `@theme { ... }` block in `app/globals.css`,
 * which is the SOURCE OF TRUTH for design tokens (brand colors, font scale, etc).
 * This file exists for tooling that still expects a JS/TS config and as a
 * convenient entry point for future plugins or content-glob overrides.
 *
 * To change a brand color or font size, edit `app/globals.css → @theme { ... }`.
 * Do NOT duplicate values here — they would diverge over time.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  // v4 auto-detects content from project files; explicit globs are a safety net.
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
    "./i18n/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    // Tokens live in @theme inside globals.css (Tailwind v4 convention).
    extend: {},
  },
  plugins: [],
};

export default config;
