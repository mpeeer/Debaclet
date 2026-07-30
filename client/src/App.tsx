import { useState, useRef, useEffect } from 'react';
import { AppState, DebateResult } from './types';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import DebateView from './components/DebateView';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (text: string, file: File | null) => {
    setState('loading');
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      const res = await fetch('/api/debate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process debate request');
      }

      const data: DebateResult = await res.json();
      setResult(data);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  // Scroll to results when they arrive
  useEffect(() => {
    if (state === 'results') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }, [state]);

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-24">
        <div className="w-full max-w-3xl mt-12 sm:mt-20">
          {/* Hero section */}
          {state === 'idle' && (
            <div className="text-center mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Powered by local AI
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic font-semibold tracking-tight text-white mb-4">
                Sharpen Your Mind
              </h1>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Submit your argument. Face a world-class Oxford Union debate opponent and receive rigorous logical analysis from a university professor — all running locally on your machine.
              </p>
            </div>
          )}

          {/* Input panel */}
          {(state === 'idle' || state === 'error') && (
            <InputPanel
              onSubmit={handleSubmit}
              isLoading={false}
              error={error}
            />
          )}

          {/* Loading state */}
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-surface-overlay border border-surface-border flex items-center justify-center shadow-glow animate-pulse-glow">
                  <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Analyzing your argument</h2>
              <p className="text-zinc-500 text-sm max-w-md text-center">
                The Oxford Union debater is crafting counterarguments while the logic professor examines your reasoning structure.
              </p>
              <div className="mt-8 flex gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-debate-oxford animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-debate-oxford animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-debate-professor animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {/* Results */}
          {state === 'results' && result && (
            <div ref={resultsRef}>
              <div className="flex items-center justify-between mb-6 animate-fade-in">
                <h2 className="text-lg font-medium text-zinc-300">Analysis complete</h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  New debate
                </button>
              </div>
              <DebateView debater={result.debater} professor={result.professor} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-zinc-600">
        Debalect — Open-source cognitive training platform. Runs entirely on your machine.
      </footer>
    </div>
  );
}
