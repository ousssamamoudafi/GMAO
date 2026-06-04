/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Dark mode colors (current theme)
        bg: 'var(--color-bg)',
        panel: 'var(--color-panel)',
        panel2: 'var(--color-panel2)',
        line: 'var(--color-line)',
        ink: 'var(--color-ink)',
        inksoft: 'var(--color-inksoft)',
        inkfaint: 'var(--color-inkfaint)',
        teal: '#2dd4bf',
        tealdeep: '#0d9488',
      },
    },
  },
  plugins: [],
}
