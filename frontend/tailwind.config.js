/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#0d1117', panel: '#141b24', panel2: '#1a2330', line: '#27313f',
        ink: '#e6edf3', inksoft: '#9aa7b5', inkfaint: '#5d6b7a',
        teal: '#2dd4bf', tealdeep: '#0d9488',
      },
    },
  },
  plugins: [],
}
