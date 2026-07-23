import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#287a63",
          dark: "#30343b",
          ink: "#30343b",
          line: "#d9dde3",
          soft: "#fafaf8"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(48, 52, 59, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
