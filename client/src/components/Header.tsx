export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-lg">🧠</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Debalect
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <span className="text-xs text-zinc-600 px-3 py-1.5">
            Open Source
          </span>
        </nav>
      </div>
    </header>
  );
}
