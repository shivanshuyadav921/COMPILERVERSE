/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#12121a",
        panel2: "#191922",
        border: "#242430",
        accent: "#7c5cff",
        accent2: "#38e1c6",
        warn: "#ffb454",
        err: "#ff5c7c",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
