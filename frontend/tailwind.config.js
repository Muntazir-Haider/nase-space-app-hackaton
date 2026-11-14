/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#070a13',
          900: '#0b1120',
          850: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        nasa: {
          blue: '#0b3d91',
          red: '#fc3d21',
          cyan: '#38bdf8',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}
