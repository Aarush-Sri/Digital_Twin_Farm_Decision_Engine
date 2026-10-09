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
        canvas: '#09090b',
        card: '#18181b',
        'card-hover': '#27272a',
        border: '#27272a',
        'text-main': '#f4f4f5',
        'text-muted': '#a1a1aa',
        // Intuitive farm colors
        farm: {
          grass: {
            bg: '#064e3b',
            border: '#059669',
            accent: '#10b981',
            glow: 'rgba(16, 185, 129, 0.25)',
          },
          tree: {
            bg: '#14532d',
            border: '#15803d',
            accent: '#22c55e',
            glow: 'rgba(34, 197, 94, 0.25)',
          },
          fence: {
            bg: '#451a03',
            border: '#92400e',
            accent: '#d97706',
            glow: 'rgba(217, 119, 6, 0.25)',
          },
          water: {
            bg: '#0c4a6e',
            border: '#0284c7',
            accent: '#38bdf8',
            glow: 'rgba(56, 189, 248, 0.25)',
          },
          wheat: {
            bg: '#713f12',
            border: '#ca8a04',
            accent: '#eab308',
            glow: 'rgba(234, 179, 8, 0.25)',
          },
          carrot: {
            bg: '#7c2d12',
            border: '#ea580c',
            accent: '#f97316',
            glow: 'rgba(249, 115, 22, 0.25)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
