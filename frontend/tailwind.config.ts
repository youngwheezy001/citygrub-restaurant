import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#f97316", // Zesty Orange for buttons
          charcoal: "#1c1917", // Main dark background
          surface: "#292524", // Slightly lighter dark for cards
          text: "#f5f5f4", // Off-white for text
          muted: "#a8a29e", // Gray for secondary text
        }
      },
    },
  },
  plugins: [],
};
export default config;