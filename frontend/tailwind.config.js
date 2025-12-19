/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shrine: {
          red: '#B8282C',
          gold: '#C9A54D',
          white: '#F5F5F5',
          dark: '#1A1A2E',
        },
      },
    },
  },
  plugins: [],
}
