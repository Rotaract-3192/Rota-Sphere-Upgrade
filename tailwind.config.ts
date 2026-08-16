import type { Config } from "tailwindcss";

// RotaSphere Design System — Tailwind Configuration
// Source of truth: DESIGN-airbnb.md
// Typography: Inter (open-source substitute for Airbnb Cereal VF)
// Spacing: 4px base unit
// Radius: Airbnb-style soft rounded language
// Colors: Rausch (#ff385c) as single brand voltage

const config: Config = {
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
        // Brand / Accent — Rausch
        brand: {
          DEFAULT: "#ff385c",  // primary CTA, search orb, heart saves
          active:  "#e00b41",  // button press state
          disabled:"#ffd1da",  // disabled CTA
        },
        // Error
        error: {
          DEFAULT: "#c13515",
          hover:   "#b32505",
        },
        // Sub-brands (reserved — not used in main UI)
        luxe: "#460479",
        plus: "#92174d",
        // Text
        ink:         "#222222",  // headlines, body, nav
        body:        "#3f3f3f",  // long-form running text
        muted:       "#6a6a6a",  // sub-titles, inactive tabs
        "muted-soft":"#929292",  // disabled link text
        // Surfaces
        canvas:          "#ffffff",  // page floor
        "surface-soft":  "#f7f7f7",  // disabled fields, hover bg
        "surface-strong":"#f2f2f2",  // icon button surfaces
        // Borders / Hairlines
        hairline:        "#dddddd",  // default 1px divider
        "hairline-soft": "#ebebeb",  // light separators
        "border-strong": "#c1c1c1",  // focus borders, disabled outline
        // On-color
        "on-primary": "#ffffff",
        "on-dark":    "#ffffff",
        // Legal
        "legal-link": "#428bff",
        // Overlay
        scrim: "#000000",  // used at 50% opacity for modals
      },

      // ── TYPOGRAPHY ──────────────────────────────────────────────────────
      // DESIGN-airbnb.md §typography
      // Font loaded via next/font/google (Inter) in src/app/layout.tsx
      fontFamily: {
        sans: ["var(--font-inter)", "Circular", "-apple-system", "system-ui", "Roboto", "Helvetica Neue", "sans-serif"],
      },
      fontSize: {
        // Design token → [size, { lineHeight, letterSpacing }]
        "display-xl": ["28px", { lineHeight: "1.43", letterSpacing: "0"       }],
        "display-lg": ["22px", { lineHeight: "1.18", letterSpacing: "-0.44px" }],
        "display-md": ["21px", { lineHeight: "1.43", letterSpacing: "0"       }],
        "display-sm": ["20px", { lineHeight: "1.20", letterSpacing: "-0.18px" }],
        "title-md":   ["16px", { lineHeight: "1.25", letterSpacing: "0"       }],
        "title-sm":   ["16px", { lineHeight: "1.25", letterSpacing: "0"       }],
        "body-md":    ["16px", { lineHeight: "1.5",  letterSpacing: "0"       }],
        "body-sm":    ["14px", { lineHeight: "1.43", letterSpacing: "0"       }],
        "caption":    ["14px", { lineHeight: "1.29", letterSpacing: "0"       }],
        "caption-sm": ["13px", { lineHeight: "1.23", letterSpacing: "0"       }],
        "badge":      ["11px", { lineHeight: "1.18", letterSpacing: "0"       }],
        "micro-label":["12px", { lineHeight: "1.33", letterSpacing: "0"       }],
        "btn-md":     ["16px", { lineHeight: "1.25", letterSpacing: "0"       }],
        "btn-sm":     ["14px", { lineHeight: "1.29", letterSpacing: "0"       }],
        "rating":     ["64px", { lineHeight: "1.1",  letterSpacing: "-1px"    }],
      },

      // ── BORDER RADIUS ────────────────────────────────────────────────────
      // DESIGN-airbnb.md §rounded
      // No hard corners anywhere except the body grid
      borderRadius: {
        "none":  "0px",
        "xs":    "4px",
        "sm":    "8px",    // buttons, inputs
        "card":  "14px",   // property/event cards
        "lg":    "20px",
        "xl":    "32px",   // category strip pills
        "full":  "9999px", // search bar, orb, avatar
      },

      // ── SPACING ──────────────────────────────────────────────────────────
      // DESIGN-airbnb.md §spacing (4px base unit)
      spacing: {
        "xxs":     "2px",
        "xs":      "4px",
        "sm":      "8px",
        "md":      "12px",
        "base":    "16px",
        "lg":      "24px",
        "xl":      "32px",
        "xxl":     "48px",
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
        "nav":    "80px",  // top nav height
        "search": "64px",  // search bar height
        "orb":    "48px",  // search orb
        "btn":    "48px",  // primary button
        "input":  "56px",  // text input
      },

      // ── MAX WIDTH ────────────────────────────────────────────────────────
      maxWidth: {
        "content": "1280px",  // editorial pages
        "listing": "1080px",  // listing detail pages
        "wide":    "1440px",  // maximum cap
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
