/** @type {import('tailwindcss').Config} */
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
  plugins: [],
}
