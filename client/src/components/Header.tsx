import ThemeSwitcher from './ThemeSwitcher';

type AppView = 'debate' | 'guide';

interface Props {
  onOpenSettings: () => void;
  onViewChange: (view: AppView) => void;
  activeView: AppView;
  provider?: string;
  staticMode?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  webllm: 'Browser',
  ollama: 'Ollama',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export default function Header({ onOpenSettings, onViewChange, activeView, provider, staticMode }: Props) {
  const label = provider ? (PROVIDER_LABELS[provider] || provider) : '';

  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.25rem] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/25 to-debate-professor/20 border border-accent/30 flex items-center justify-center shadow-glow shrink-0">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="block text-[15px] font-semibold tracking-tight" style={{ color: 'rgb(var(--text))' }}>
              Debalect
            </span>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.16em]" style={{ color: 'rgb(var(--text-muted))' }}>
              Argument intelligence
            </span>
          </div>

          {label && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
              style={{
                backgroundColor: 'color-mix(in srgb, rgb(var(--accent)) 10%, transparent)',
                borderColor: 'color-mix(in srgb, rgb(var(--accent)) 25%, transparent)',
                color: 'rgb(var(--accent))',
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgb(var(--accent))' }} />
              {label}{staticMode ? ' · Static' : ''}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1 p-1 rounded-xl bg-surface-overlay/80 border border-surface-border shrink-0" aria-label="Primary navigation">
          <button
            onClick={() => onViewChange('debate')}
            aria-current={activeView === 'debate' ? 'page' : undefined}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeView === 'debate' ? 'bg-accent/10' : 'hover:bg-white/5'}`}
            style={{ color: activeView === 'debate' ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
          >
            <span className="hidden sm:inline">Debate</span><span className="sm:hidden">Deb.</span>
          </button>
          <button
            onClick={() => onViewChange('guide')}
            aria-current={activeView === 'guide' ? 'page' : undefined}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeView === 'guide' ? 'bg-accent/10' : 'hover:bg-white/5'}`}
            style={{ color: activeView === 'guide' ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))' }}
          >
            <span className="hidden sm:inline">How-to</span><span className="sm:hidden">Guide</span>
          </button>
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-surface-border"
            style={{ color: 'rgb(var(--text-muted))' }}
            aria-label="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="max-[400px]:hidden">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
