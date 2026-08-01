import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, DebateResult, HistoryEntry } from './types';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import DebateView from './components/DebateView';
import SettingsModal from './components/SettingsModal';
import HowTo from './components/HowTo';
import ErrorBoundary from './components/ErrorBoundary';
import { queryBrowserAI, isWebGPUSupported, interruptBrowserAI } from './services/webllm';
import { readFileContent } from './services/fileReader';
import { loadHistory, saveHistory, clearHistory } from './services/historyStore';
import { splitIntoChunks, buildSynthesisInput, CHUNK_ANALYSIS_NOTE, SYNTHESIS_PROMPT, MAX_SUPPORTED_CHARS } from './services/chunking';
import { DEBATER_PROMPT, PROFESSOR_PROMPT } from './services/prompts';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CachedConfig { provider: string; model: string; }

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [draft, setDraft] = useState<{ text: string; file: File | null }>({ text: '', file: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'debate' | 'guide'>('debate');
  const [statusLine, setStatusLine] = useState<string>('');
  const [cachedConfig, setCachedConfig] = useState<CachedConfig>(() => {
    const saved = localStorage.getItem('debalect_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.provider && parsed.model) return { provider: parsed.provider, model: parsed.model };
      } catch { /* ignore corrupt localStorage */ }
    }
    return { provider: 'webllm', model: 'Llama-3.2-3B-Instruct-q4f16_1-MLC' };
  });
  const [staticMode, setStaticMode] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Server returned non-OK');
      const cfg = await res.json();
      const newConfig = { provider: cfg.provider, model: cfg.model };
      setCachedConfig(newConfig);
      localStorage.setItem('debalect_config', JSON.stringify(newConfig));
      setStaticMode(false);
    } catch {
      setStaticMode(true);
    }
  }, []);

  useEffect(() => {
    if (!staticMode || !import.meta.env.DEV) return;
    const id = setInterval(() => {
      fetch('/api/health').then((r) => r.json()).then((h) => { if (h.ok) refreshConfig(); }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [staticMode, refreshConfig]);

  useEffect(() => { refreshConfig(); }, [refreshConfig]);

  useEffect(() => {
    let active = true;
    loadHistory().then((entries) => {
      if (!active) return;
      setHistory((current) => {
        const merged = new Map<string, HistoryEntry>();
        [...entries, ...current].forEach((entry) => merged.set(entry.id, entry));
        return [...merged.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
      });
      setHistoryReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (historyReady) void saveHistory(history);
  }, [history, historyReady]);

  const exportMarkdown = (entry: DebateResult, fileName: string) => {
    const md = [
      '# Argument analysis',
      '',
      `**Source:** ${fileName}`,
      `**Date:** ${new Date().toLocaleString()}`,
      '',
      '---',
      '',
      '## Counterargument',
      '',
      entry.debater,
      '',
      '---',
      '',
      '## Logic review',
      '',
      entry.professor,
      '',
      '---',
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${fileName.replace(/\.[^.]+$/, '')}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (_text: string, file: File | null) => {
    if (isCancelling) return;
    abortRef.current?.abort();
    try {
      await interruptBrowserAI();
    } catch {
      // No active browser generation.
    }
    const requestId = ++requestIdRef.current;
    setDraft({ text: _text, file });
    setState('loading');
    setError(null);
    setStatusLine('Reading…');
    const controller = new AbortController();
    abortRef.current = controller;
    const fileName = file?.name || 'text-input';
    try {
      if (cachedConfig.provider === 'webllm') {
        if (!isWebGPUSupported()) {
          throw new Error('WebGPU is not available. Use Chrome 113+ or Edge 113+, or switch providers in Settings.');
        }

        let text = _text;
        if (file) {
          text = await readFileContent(file);
        }
        if (!text || text.length < 50) {
          throw new Error('Text is too short. Provide at least 50 characters.');
        }
        if (text.length > MAX_SUPPORTED_CHARS) {
          throw new Error(`Document too long. Limit is ${MAX_SUPPORTED_CHARS.toLocaleString()} characters.`);
        }

        const chunks = splitIntoChunks(text);
        setStatusLine('Loading model…');
        const debaterParts: string[] = [];
        const professorParts: string[] = [];

        for (let i = 0; i < chunks.length; i += 1) {
          if (requestId !== requestIdRef.current) return;
          const section = chunks.length > 1 ? `${chunks[i]}\n\n${CHUNK_ANALYSIS_NOTE}` : chunks[i];
          setStatusLine(chunks.length > 1 ? `Analyzing section ${i + 1} of ${chunks.length}…` : 'Generating…');
          const debaterResponse = await queryBrowserAI(cachedConfig.model, DEBATER_PROMPT, section, (msg, pct) => {
            if (requestId !== requestIdRef.current) return;
            if (chunks.length === 1 && msg) setStatusLine(`${msg} (${pct}%)`);
          });
          if (requestId !== requestIdRef.current) return;
          const professorResponse = await queryBrowserAI(cachedConfig.model, PROFESSOR_PROMPT, section, () => {});
          if (requestId !== requestIdRef.current) return;
          debaterParts.push(debaterResponse);
          professorParts.push(professorResponse);
        }

        let debaterResponse = debaterParts[0];
        let professorResponse = professorParts[0];
        if (chunks.length > 1) {
          setStatusLine('Synthesizing…');
          debaterResponse = await queryBrowserAI(
            cachedConfig.model,
            `${DEBATER_PROMPT}\n\n${SYNTHESIS_PROMPT}`,
            buildSynthesisInput('Debater', debaterParts),
            () => {},
          );
          if (requestId !== requestIdRef.current) return;
          professorResponse = await queryBrowserAI(
            cachedConfig.model,
            `${PROFESSOR_PROMPT}\n\n${SYNTHESIS_PROMPT}`,
            buildSynthesisInput('Professor', professorParts),
            () => {},
          );
        }
        if (requestId !== requestIdRef.current) return;
        setStatusLine('Done.');
        const data: DebateResult = { originalLength: text.length, debater: debaterResponse, professor: professorResponse };
        setResult(data);
        setCurrentFile(fileName);
        setState('results');
        setHistory((prev) => [{ id: Date.now().toString(), timestamp: Date.now(), fileName, result: data }, ...prev].slice(0, 20));
        return;
      }

      // Server inference path — Ollama, OpenAI, Anthropic
      setStatusLine('Generating…');
      const formData = new FormData();
      if (file) formData.append('file', file);
      else if (_text) formData.append('text', _text);
      else throw new Error('Provide text or a file.');

      const res = await fetch('/api/debate', { method: 'POST', body: formData, signal: controller.signal });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: `Server returned ${res.status}` }));
        throw new Error(d.error || 'Failed to reach the server');
      }
      const data: DebateResult = await res.json();
      if (requestId !== requestIdRef.current) return;
      setStatusLine('Done.');
      setResult(data);
      setCurrentFile(fileName);
      setState('results');
      setHistory((prev) => [{ id: Date.now().toString(), timestamp: Date.now(), fileName, result: data }, ...prev].slice(0, 20));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState('idle');
        setError(null);
        setStatusLine('');
        return;
      }
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      setState('error');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleRetry = () => {
    if (draft.text.trim() || draft.file) {
      void handleSubmit(draft.text, draft.file);
    }
  };

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    requestIdRef.current += 1;
    abortRef.current?.abort();
    try {
      await interruptBrowserAI();
    } catch {
      // The engine may already have completed.
    } finally {
      setIsCancelling(false);
      setState('idle');
      setError(null);
      setStatusLine('');
    }
  };

  useEffect(() => {
    if (state === 'results') {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  }, [state]);

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setError(null);
    setCurrentFile('');
    setDraft({ text: '', file: null });
    setStatusLine('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleRevisit = (entry: HistoryEntry) => {
    setResult(entry.result);
    setCurrentFile(entry.fileName);
    setState('results');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };
  const handleSettingsSaved = () => { refreshConfig(); };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onViewChange={setActiveView}
          activeView={activeView}
        />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={handleSettingsSaved} staticMode={staticMode} />

        <ErrorBoundary onReset={handleReset}>
          <main className="flex-1 px-4 sm:px-6 pb-16">
            <div className="max-w-2xl mx-auto pt-6 sm:pt-10">
              {activeView === 'guide' ? (
                <HowTo />
              ) : (
                <>
                  {(state === 'idle' || state === 'error') && (
                    <div className="space-y-6">
                      <InputPanel
                        onSubmit={handleSubmit}
                        isLoading={false}
                        error={state === 'error' ? error : null}
                        initialText={draft.text}
                        initialFile={draft.file}
                        onRetry={state === 'error' ? handleRetry : undefined}
                      />

                      {history.length > 0 && (
                        <section className="border-t border-surface-border pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                              Recent
                            </div>
                            <button
                              onClick={() => { setHistory([]); void clearHistory(); }}
                              className="text-[11px] hover:underline"
                              style={{ color: 'rgb(var(--text-muted))' }}
                            >
                              clear
                            </button>
                          </div>
                          <ul className="divide-y divide-surface-border">
                            {history.slice(0, 8).map((entry) => (
                              <li key={entry.id}>
                                <button
                                  onClick={() => handleRevisit(entry)}
                                  className="w-full flex items-center justify-between gap-3 py-2 text-left hover:bg-surface-overlay transition-colors px-2 -mx-2 rounded"
                                >
                                  <span className="text-[13px] truncate" style={{ color: 'rgb(var(--text))' }}>{entry.fileName}</span>
                                  <span className="text-[11px] font-mono shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>
                                    {formatDate(entry.timestamp)}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>
                  )}

                  {state === 'loading' && (
                    <div className="py-12 space-y-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'rgb(var(--text-muted))' }} aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span className="text-[14px]" style={{ color: 'rgb(var(--text))' }}>
                          {statusLine || 'Loading…'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="text-[12px] hover:underline"
                        style={{ color: 'rgb(var(--text-muted))' }}
                      >
                        {isCancelling ? 'Stopping…' : 'cancel'}
                      </button>
                    </div>
                  )}

                  {state === 'results' && result && (
                    <div ref={resultsRef} className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-surface-border">
                        <div className="space-y-1">
                          <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                            Analysis
                          </div>
                          {currentFile && (
                            <div className="text-[14px]" style={{ color: 'rgb(var(--text))' }}>{currentFile}</div>
                          )}
                          <div className="text-[11px] font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
                            {result.originalLength.toLocaleString()} chars
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[13px]">
                          <button
                            onClick={() => result && exportMarkdown(result, currentFile || 'analysis')}
                            className="hover:underline"
                            style={{ color: 'rgb(var(--text-secondary))' }}
                          >
                            export
                          </button>
                          <button
                            onClick={handleReset}
                            className="hover:underline"
                            style={{ color: 'rgb(var(--text-secondary))' }}
                          >
                            new
                          </button>
                        </div>
                      </div>
                      <DebateView debater={result.debater} professor={result.professor} />
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <footer className="text-center py-6 text-[11px] font-mono border-t border-surface-border" style={{ color: 'rgb(var(--text-muted))' }}>
            debalect · {cachedConfig.provider === 'webllm' ? 'browser' : cachedConfig.provider}
          </footer>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
