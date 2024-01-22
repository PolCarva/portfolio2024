/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        title: ["clamp(3rem, 7.5vw, 9rem)"],
        heading: {
          1: ["clamp(2.5rem, 6.5vw, 10rem)"],
          2: ["clamp(2.4rem, 8vw, 10rem)"],
          3: ["clamp(2rem, 5vw, 2.75rem)"],
        },
        "works-title": ["clamp(1.25rem, 2vw, 1.5rem)"],
        body: {
          1: ["clamp(1.1rem, 2vw, 1.3rem)"],
          2: ["clamp(1rem, 1.5vw, 1.5rem)"],
          3: "1.1rem",
          4: ["clamp(0.75rem, 3vw, 1rem)"],
        },
      },
      fontFamily: {
        general: ["Satoshi-Variable", "sans-serif"],
        grotesk: ["CabinetGrotesk-Variable", "sans-serif"],
      },
      colors: {
        transparent: "transparent",
        primary: {
          DEFAULT: "#F7F6F3",
          300: "#E6E6E6",
          400: "#D2D0D0",
        },
        secondary: {
          DEFAULT: "#AC9E7B",
          200: "#E7E2D4",
          300: "#D2CBBB",
          400: "#A89E85",
          500: "#968D6B",
          600: "#817D5B",
        },
        accent: {
          DEFAULT: "#4D4A46",
          200: "#D9D9D9",
          300: "#67635E",
          400: "#262421",
        },
      },
    },
  },
  plugins: [],
};
