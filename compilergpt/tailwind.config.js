/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Earthy, sophisticated palette tokens
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",

        // Semantic Accents
        sage: "#7c9d8b",          // Success / valid compiler state
        terracotta: "#c86d51",    // Errors / alerts
        ochre: "#c99a4e",         // Optimizations / highlights
        "muted-teal": "#5e8c8a",  // IR / Dataflow
        "dusty-rose": "#b57882",  // Warnings / research
        olive: "#7b8a56",         // Backend / Codegen
        charcoal: "#232326",      // Code / Primary Dark
        taupe: "#8f867b",
        cream: "#f7f4ed",
        ivory: "#fbf9f5",

        // Legacy aliases
        bg: "var(--background)",
        panel: "var(--surface)",
        panel2: "var(--surface-elevated)",
        accent: "#7c9d8b",
        accent2: "#5e8c8a",
        warn: "#c99a4e",
        err: "#c86d51",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
