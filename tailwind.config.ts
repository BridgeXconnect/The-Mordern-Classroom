import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* ── shadcn / existing component compat (HSL aliases) ── */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── EduForge design-token shortcuts ── */
        "ef-bg":          "var(--bg)",
        "ef-surface":     "var(--surface)",
        "ef-surface-2":   "var(--surface-2)",
        "ef-fg":          "var(--fg)",
        "ef-fg-muted":    "var(--fg-muted)",
        "ef-fg-subtle":   "var(--fg-subtle)",
        "ef-fg-faint":    "var(--fg-faint)",
        "ef-border":      "var(--border)",
        "ef-accent":      "var(--accent-color)",
        "ef-accent-soft": "var(--accent-soft)",
        "ef-green":       "var(--green)",
        "ef-green-bg":    "var(--green-bg)",
        "ef-amber":       "var(--amber)",
        "ef-amber-bg":    "var(--amber-bg)",
        "ef-blue":        "var(--blue)",
        "ef-blue-bg":     "var(--blue-bg)",
        "ef-red":         "var(--red)",
        "ef-red-bg":      "var(--red-bg)",
      },
      fontFamily: {
        sans:  ["var(--font-geist)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono:  ["var(--font-jetbrains-mono)", "Fira Code", "monospace"],
      },
      borderRadius: {
        "ef-sm": "var(--r-sm)",
        "ef":    "var(--r)",
        "ef-lg": "var(--r-lg)",
        "ef-xl": "var(--r-xl)",
        lg:      "var(--radius)",
        md:      "calc(var(--radius) - 2px)",
        sm:      "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "ef-sm": "var(--shadow-sm)",
        "ef":    "var(--shadow)",
        "ef-lg": "var(--shadow-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.94)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fadeUp 0.35s cubic-bezier(.2,.7,.3,1) both",
        "pop-in":         "popIn 0.3s cubic-bezier(.2,.7,.3,1) both",
        shimmer:          "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
