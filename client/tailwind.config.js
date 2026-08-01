/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Menlo"', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          raised: 'rgb(var(--bg-raised) / <alpha-value>)',
          overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
          border: 'rgb(var(--border) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-secondary) / <alpha-value>)',
          subtle: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
