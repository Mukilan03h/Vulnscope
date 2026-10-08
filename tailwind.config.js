/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f17",
        surface: "#121825",
        surface2: "#1a2233",
        border: "#263049",
        ink: "#e8edf6",
        muted: "#8da2c0",
        brand: "#4f8cff",
        // Colorblind-aware severity ramp (distinct hue + lightness, not red/green only)
        crit: "#ff4d6d",
        high: "#ff8a3d",
        med: "#ffd23f",
        low: "#4fd1c5",
        info: "#7aa2ff",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
