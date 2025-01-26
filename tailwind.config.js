/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'lexend': ['Lexend Giga', 'sans-serif'],
      },
    },
  },
  plugins: [],
};