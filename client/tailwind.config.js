/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ananael: {
          bg: '#0c0c0f',
          surface: '#18181b',
          panel: '#1f1f24',
          border: '#3f3f46',
          muted: '#a1a1aa',
          violet: '#7c3aed',
          'violet-deep': '#5b21b6',
          gold: '#c9a227',
          bronze: '#b87333',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(124, 58, 237, 0.25)',
        gold: '0 0 16px rgba(201, 162, 39, 0.2)',
      },
    },
  },
  plugins: [],
};
