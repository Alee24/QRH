/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf7ee',
          100: '#f5edd7',
          200: '#edd8aa',
          300: '#e3be75',
          400: '#d9a444',
          500: '#ca8a26',
          600: '#b06f1d',
          700: '#8d511b',
          800: '#73411c',
          900: '#61361c',
        },
      },
    },
  },
  plugins: [],
}
