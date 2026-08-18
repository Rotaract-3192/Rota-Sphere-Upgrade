import type { Config } from "tailwindcss";

// RotaSphere Design System — Tailwind Configuration
// Source of truth: DESIGN-airbnb.md
// Typography: Inter (open-source substitute for Airbnb Cereal VF)
// Spacing: 4px base unit
// Radius: Airbnb-style soft rounded language
// Colors: Rausch (#ff385c) as single brand voltage

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── COLORS ──────────────────────────────────────────────────────────
      // DESIGN-airbnb.md §colors
      colors: {
        // Brand / Accent
        brand: {
          DEFAULT: "var(--primary)",
          active: "var(--sidebar-primary)",
          disabled: "var(--color-brand-disabled)",
        },
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        card: "var(--card)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        border: "var(--border)",
        sidebar: "var(--sidebar)",
        destructive: "var(--destructive)",
        // Error
        error: {
          DEFAULT: "var(--destructive)",
          hover: "#c51824",
        },
        // Sub-brands
        luxe: "#1e9df1",
        plus: "#00b87a",
        // Text
        ink: "var(--foreground)",
        body: "var(--muted-foreground)",
        "muted-soft": "#72767a",
        // Surfaces
        canvas: "var(--background)",
        "surface-soft": "var(--card)",
        "surface-strong": "var(--accent)",
        // Borders / Hairlines
        hairline: "var(--border)",
        "hairline-soft": "var(--sidebar-border)",
        "border-strong": "var(--border)",
        // On-color
        "on-primary": "var(--primary-foreground)",
        "on-dark": "#ffffff",
        // Legal
        "legal-link": "var(--primary)",
        // Overlay
        scrim: "#000000",
      },

      fontFamily: {
        sans: ["Open Sans", "var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        // Design token → [size, { lineHeight, letterSpacing }]
        "display-xl": ["28px", { lineHeight: "1.43", letterSpacing: "0" }],
        "display-lg": ["22px", { lineHeight: "1.18", letterSpacing: "-0.44px" }],
        "display-md": ["21px", { lineHeight: "1.43", letterSpacing: "0" }],
        "display-sm": ["20px", { lineHeight: "1.20", letterSpacing: "-0.18px" }],
        "title-md": ["16px", { lineHeight: "1.25", letterSpacing: "0" }],
        "title-sm": ["16px", { lineHeight: "1.25", letterSpacing: "0" }],
        "body-md": ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
        "body-sm": ["14px", { lineHeight: "1.43", letterSpacing: "0" }],
        "caption": ["14px", { lineHeight: "1.29", letterSpacing: "0" }],
        "caption-sm": ["13px", { lineHeight: "1.23", letterSpacing: "0" }],
        "badge": ["11px", { lineHeight: "1.18", letterSpacing: "0" }],
        "micro-label": ["12px", { lineHeight: "1.33", letterSpacing: "0" }],
        "btn-md": ["16px", { lineHeight: "1.25", letterSpacing: "0" }],
        "btn-sm": ["14px", { lineHeight: "1.29", letterSpacing: "0" }],
        "rating": ["64px", { lineHeight: "1.1", letterSpacing: "-1px" }],
      },

      // ── BORDER RADIUS ────────────────────────────────────────────────────
      borderRadius: {
        "card": "14px",   // property/event cards
      },

      // ── SPACING ──────────────────────────────────────────────────────────
      spacing: {
        "base": "16px",
        "section": "64px",  // major section vertical padding
      },

      // ── BOX SHADOW ───────────────────────────────────────────────────────
      // DESIGN-airbnb.md §elevation
      // Single shadow tier — used on card hover, search bar, dropdowns
      boxShadow: {
        card: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0",
        none: "none",
      },

      // ── HEIGHT TOKENS ───────────────────────────────────────────────────
      height: {
        "nav": "80px",  // top nav height
        "search": "64px",  // search bar height
        "orb": "48px",  // search orb
        "btn": "48px",  // primary button
        "input": "56px",  // text input
      },

      // ── MAX WIDTH ────────────────────────────────────────────────────────
      maxWidth: {
        "content": "1280px",  // editorial pages
        "listing": "1080px",  // listing detail pages
        "wide": "1440px",  // maximum cap
      },

      // ── ANIMATION ───────────────────────────────────────────────────────
      transitionProperty: {
        "shadow": "box-shadow",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0,0,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
