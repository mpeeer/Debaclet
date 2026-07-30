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
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          raised: 'rgb(var(--bg-raised) / <alpha-value>)',
          overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
          border: 'rgb(var(--border) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        },
        debate: {
          oxford: 'rgb(var(--oxford) / <alpha-value>)',
          professor: 'rgb(var(--professor) / <alpha-value>)',
        },
      },
      boxShadow: {
        glow: '0 0 40px var(--accent-soft)',
        'glow-lg': '0 0 80px var(--accent-soft)',
        oxford: '0 0 30px var(--oxford-soft)',
        professor: '0 0 30px var(--professor-soft)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
