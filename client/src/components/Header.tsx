import ThemeSwitcher from './ThemeSwitcher';

type AppView = 'debate' | 'guide';

interface Props {
  onOpenSettings: () => void;
  onViewChange: (view: AppView) => void;
  activeView: AppView;
}

export default function Header({ onOpenSettings, onViewChange, activeView }: Props) {
  return (
    <header className="border-b border-surface-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'rgb(var(--text))' }}>
            Debalect
          </span>
          <nav className="flex items-center gap-3 text-[13px]" aria-label="Primary navigation">
            <button
              onClick={() => onViewChange('debate')}
              aria-current={activeView === 'debate' ? 'page' : undefined}
              className="hover:opacity-100 transition-opacity"
              style={{ color: activeView === 'debate' ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
            >
              Analyze
            </button>
            <span style={{ color: 'rgb(var(--text-muted))' }}>·</span>
            <button
              onClick={() => onViewChange('guide')}
              aria-current={activeView === 'guide' ? 'page' : undefined}
              className="hover:opacity-100 transition-opacity"
              style={{ color: activeView === 'guide' ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
            >
              Setup
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-overlay transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
