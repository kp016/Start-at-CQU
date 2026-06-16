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
        // warm beige palette
        cream: {
          50: "#fefcf8",
          100: "#fdf8f0",
          200: "#f9f1e4",
          300: "#f3e7d3",
          400: "#ebd9bd",
        },
        sand: {
          100: "#f5efe3",
          200: "#e9ddc8",
          300: "#d8c6a6",
          400: "#c4ab82",
        },
        ink: {
          700: "#5c5347",
          800: "#403a31",
          900: "#2b2620",
        },
      },
      boxShadow: {
        warm: "0 4px 20px -4px rgba(146, 119, 71, 0.15)",
        "warm-lg": "0 10px 40px -8px rgba(146, 119, 71, 0.22)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        fadeIn: "fadeIn 0.3s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
        pop: "pop 0.3s ease-out",
        floaty: "floaty 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
