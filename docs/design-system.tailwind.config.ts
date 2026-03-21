/**
 * Englishfully Design System — Tailwind config
 * Use with Tailwind v3. For Tailwind v4, theme is in globals.css via @theme inline;
 * this file serves as reference or for a standalone/other app.
 */
import type { Config } from "tailwindcss";

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        comic: {
          primary: "#ff4757",
          secondary: "#00d2d3",
          accent: "#3742fa",
          warning: "#ffa502",
          success: "#2ed573",
          danger: "#ff3838",
          dark: "#2f3542",
          light: "#f1f2f6",
          white: "#ffffff",
          black: "#000000",
          yellow: "#ffdd59",
          pink: "#ff6b9d",
          purple: "#a55eea",
        },
      },
      fontFamily: {
        fredoka: ["Fredoka", "cursive"],
        bungee: ["Bungee", "cursive"],
        "comic-neue": ["Comic Neue", "cursive"],
      },
      fontWeight: {
        normal: "400",
        bold: "700",
      },
      boxShadow: {
        "comic-sm": "3px 3px 0px #000000",
        "comic-md": "5px 5px 0px #000000",
        "comic-lg": "8px 8px 0px #000000",
        "comic-xl": "12px 12px 0px #000000",
        "comic-2xl": "16px 16px 0px #000000",
      },
      borderWidth: {
        "comic": "4px",
        "comic-thick": "6px",
        "comic-xl": "8px",
      },
      borderRadius: {
        "comic": "0.5rem",   // rounded-lg
        "comic-xl": "0.75rem", // rounded-xl
      },
      maxWidth: {
        "content": "72rem",   // max-w-6xl
        "prose": "56rem",     // max-w-4xl
        "narrow": "48rem",    // max-w-3xl
      },
      transitionDuration: {
        "comic": "200ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
