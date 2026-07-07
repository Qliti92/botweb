import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#e11d2e",
          dark: "#111111",
          ink: "#222222",
          line: "#ececec",
          soft: "#f7f7f8"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 17, 17, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
