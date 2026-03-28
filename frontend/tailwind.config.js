/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#ffffff",
        accent: "#333333",
        "accent-dark": "#1a1a1a",
        "gradient-start": "#000000",
        "gradient-end": "#333333",
      },
    },
  },
  plugins: [],
};
