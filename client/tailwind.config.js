/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', 'monospace'],
        serif: ['"Cormorant Garamond"', '"Georgia"', 'serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0a0a0b',
          raised: '#111113',
          overlay: '#18181b',
          border: '#27272a',
        },
        accent: {
          DEFAULT: '#3b82f6',
          soft: 'rgba(59, 130, 246, 0.15)',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        debate: {
          oxford: '#0891b2',
          professor: '#7c3aed',
          oxfordSoft: 'rgba(8, 145, 178, 0.12)',
          professorSoft: 'rgba(124, 58, 237, 0.12)',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(59, 130, 246, 0.15)',
        'glow-lg': '0 0 80px rgba(59, 130, 246, 0.2)',
        oxford: '0 0 30px rgba(8, 145, 178, 0.2)',
        professor: '0 0 30px rgba(124, 58, 237, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
