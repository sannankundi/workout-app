import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff4b2b",
          dark: "#e63e1d",
          light: "#ff6b4b",
          lighter: "#ff8b6b",
        },
        secondary: {
          DEFAULT: "#1f2937",
          dark: "#111827",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      transitionDuration: {
        "2000": "2000ms",
      },
      scale: {
        "101": "1.01",
        "102": "1.02",
      },
    },
  },
  plugins: [],
} satisfies Config;
