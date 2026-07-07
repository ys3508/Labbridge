/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1c2530",
          soft: "#5b6b7c",
          faint: "#8898a8",
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
      },
    },
  },
  plugins: [],
};
