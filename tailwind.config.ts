import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Noir Luxe palette
        bg: {
          base: "#0E0E13",
          surface: "#1C1C24",
          elevated: "#252530",
        },
        gold: {
          DEFAULT: "#C8A96E",
          light: "#DFC492",
          muted: "#8C7248",
          dark: "#6B5535",
        },
        cream: "#FAF8F2",
        "off-white": "#E8E4DC",
        muted: "#9A9AA8",
        border: "#2E2E3A",
        success: "#5CB87A",
        warning: "#D4A853",
        error: "#D4545A",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "scan-line": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
        "slide-up": "slide-up 0.5s ease forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #C8A96E 0%, #DFC492 50%, #C8A96E 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0E0E13 0%, #1a1a22 100%)",
        "card-gradient":
          "linear-gradient(135deg, #1C1C24 0%, #252530 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        gold: "0 0 20px rgba(200, 169, 110, 0.15)",
        "gold-lg": "0 0 40px rgba(200, 169, 110, 0.2)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
