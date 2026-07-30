import { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeName } from '../context/ThemeContext';

const THEMES: { name: ThemeName; label: string; swatch?: string }[] = [
  { name: 'system', label: 'System' },
  { name: 'dark', label: 'Dark', swatch: '#0a0a0b' },
  { name: 'light', label: 'Light', swatch: '#fafafa' },
  { name: 'slate', label: 'Slate', swatch: '#1e293b' },
  { name: 'amber', label: 'Amber', swatch: '#1c1917' },
];

function getSwatch(theme: ThemeName, resolved: Exclude<ThemeName, 'system'>): string | undefined {
  if (theme === 'system') return resolved === 'dark' ? '#0a0a0b' : '#fafafa';
  return THEMES.find((t) => t.name === theme)?.swatch;
}

export default function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeSwatch = getSwatch(theme, resolvedTheme);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-border hover:border-zinc-600 transition-colors"
        aria-label="Switch theme"
      >
        {activeSwatch ? (
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20"
            style={{ background: activeSwatch }}
          />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex overflow-hidden">
            <span className="w-1/2 h-full" style={{ background: '#0a0a0b' }} />
            <span className="w-1/2 h-full" style={{ background: '#fafafa' }} />
          </span>
        )}
        <svg
          className={`w-3 h-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 glass rounded-xl p-1.5 shadow-xl z-50 animate-fade-in">
          {THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => { setTheme(t.name); setOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${theme === t.name ? 'bg-white/10' : 'hover:bg-white/5'}
              `}
              style={{ color: theme === t.name ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
            >
              {t.swatch ? (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                  style={{ background: t.swatch }}
                />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 flex overflow-hidden">
                  <span className="w-1/2 h-full" style={{ background: '#0a0a0b' }} />
                  <span className="w-1/2 h-full" style={{ background: '#fafafa' }} />
                </span>
              )}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
