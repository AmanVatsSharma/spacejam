/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF7847',
          light: '#FFF7ED',
          dark: '#FF6A3D',
        },
        background: '#FBF6F4',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("compact", "@media (max-width: 1023.98px)");
    }),
  ],
};
