/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Visual-design spec: warm off-white ground; ink ramp darkened so every
        // tier clears WCAG AA (4.5:1) on it. ink-faint was #8898a8 (~2.9:1 — fail).
        ground: "#faf9f7",
        ink: {
          DEFAULT: "#1c2530",
          soft: "#51616f",
          faint: "#64748b",
        },
        brand: {
          50: "#eef6f6",
          100: "#d5eaea",
          200: "#a9d5d6",
          300: "#74b8bb",
          400: "#469699",
          500: "#2f7d80",
          600: "#256467",
          700: "#204f52",
          800: "#1c4144",
          900: "#19373a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        // The "letter" face — briefing hook ONLY (day one reads like a letter
        // from your manager). System serif stack: zero font downloads.
        letter: ["ui-serif", "Georgia", "Iowan Old Style", "Palatino", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
