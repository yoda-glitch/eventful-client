import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#06141B",
        bg2: "#0e1e27",
        bg3: "#253745",
        card: "#1D1D1D",
        card2: "#2F2F2F",
        pill: "#3B3B3A",
        "text-bright": "#CCD0CF",
        accent: "#9BA8AB",
        muted: "#4A5C6A",
      },
    },
  },
  plugins: [],
};

export default config;
