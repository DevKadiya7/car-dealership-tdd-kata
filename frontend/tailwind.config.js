/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10140F",
        surface: "#171D16",
        raised: "#1E2620",
        hairline: "#2B342A",
        ink: "#EDE8DC",
        muted: "#9BA394",
        amber: "#E3A23C",
        available: "#6FA97C",
        soldout: "#C1543F",
      },
      fontFamily: {
        display: ["'Big Shoulders Display'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
