import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#080808",
          900: "#0D0D0D",
          850: "#121212",
          800: "#151515",
          700: "#1C1C1C",
          600: "#252525",
          500: "#333333",
        },
        charcoal: {
          surface: "#151515",
          card: "#121212",
          border: "rgba(255, 255, 255, 0.08)",
        },
        fire: {
          orange: "#FF6A00",
          red: "#FF2D16",
          amber: "#F59E0B",
          glow: "rgba(255, 106, 0, 0.4)",
        },
        // Backwards-compatible mappings so existing color references resolve
        cosmic: {
          bg: "#080808",
          surface: "#0D0D0D",
          card: "#151515",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#FF6A00",
          cyan: "#F59E0B",
          pink: "#FF2D16",
        },
      },
      boxShadow: {
        "glow-orange": "0 0 30px rgba(255, 106, 0, 0.3)",
        "glow-red": "0 0 30px rgba(255, 45, 22, 0.3)",
        "card-dark": "0 20px 40px -15px rgba(0, 0, 0, 0.9)",
      },
      animation: {
        "float-slow": "float 5s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "glow": "glow 4s ease-in-out infinite alternate",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        glow: {
          "0%": { filter: "drop-shadow(0 0 15px rgba(255, 106, 0, 0.3))" },
          "100%": { filter: "drop-shadow(0 0 30px rgba(255, 45, 22, 0.5))" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
