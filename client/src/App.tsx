import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, DebateResult, DebateScore, HistoryEntry } from './types';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import DebateView from './components/DebateView';
import SettingsModal from './components/SettingsModal';
import HowTo from './components/HowTo';
import ErrorBoundary from './components/ErrorBoundary';
import { queryBrowserAI, isWebGPUSupported } from './services/webllm';
import { readFileContent } from './services/fileReader';
import { DEBATER_PROMPT, PROFESSOR_PROMPT } from './services/prompts';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function computeScore(result: DebateResult): DebateScore {
  const debater = result.debater;
  const professor = result.professor;
  const counterMatches = debater.match(/###\s*Counterargument\s*\d+/gi);
  const counterCount = counterMatches ? counterMatches.length : 0;
  const confMatch = professor.match(/\*\*Confidence level:\*\*\s*(.*)/i);
  const confidence = confMatch ? confMatch[1].trim() : 'Unknown';
  const fallMatch = professor.match(/###\s*Fallacies\s*Detected\s*\n([\s\S]*?)(?=###|$)/i);
  const fallText = fallMatch ? fallMatch[1].trim().toLowerCase() : '';
  const hasFallacies = fallText.length > 0 && !fallText.includes('none') && !fallText.includes('no fallacies');
  let total = 40;
  total += Math.min(counterCount * 8, 32);
  const cl = confidence.toLowerCase();
  if (cl.includes('high')) total += 28; else if (cl.includes('moderate')) total += 14;
  if (!hasFallacies) total += 10;
  else total -= Math.min(10, (fallText.match(/\n-|\n\*|\n\d+\./g) || []).length * 5);
  return { total: Math.max(0, Math.min(100, total)), counterCount, confidence, hasFallacies };
}

function ScoreBadge({ score }: { score: DebateScore }) {
  const color = score.total >= 70 ? 'text-emerald-400 bg-emerald-400/10' : score.total >= 40 ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${score.total >= 70 ? 'bg-emerald-400' : score.total >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} />
      {score.total}/100
    </span>
  );
}

interface CachedConfig { provider: string; model: string; }

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'debate' | 'guide'>('debate');
  const [loadProgress, setLoadProgress] = useState<string>('');
  const [loadStep, setLoadStep] = useState<number>(0); // 0=reading, 1=loading model, 2=debater, 3=professor
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
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [staticMode, setStaticMode] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      // Server unreachable — keep local config, stay in static mode
      setStaticMode(true);
    }
  }, []);

  // Periodically retry server connection if in static mode (dev only)
  useEffect(() => {
    if (!staticMode || !import.meta.env.DEV) return;
    const id = setInterval(() => {
      fetch('/api/health').then((r) => r.json()).then((h) => { if (h.ok) refreshConfig(); }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [staticMode, refreshConfig]);

  useEffect(() => { refreshConfig(); }, [refreshConfig]);

  const exportMarkdown = (entry: DebateResult, fileName: string) => {
    const md = ['# Debalect — Debate Analysis', `**File:** ${fileName}`, `**Date:** ${new Date().toLocaleString()}`, '', '---', '', '## Oxford Union Debater', '', entry.debater, '', '---', '', '## Logic Professor', '', entry.professor, '', '---', '', '*Generated by Debalect*'].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `debalect-${fileName.replace(/\.[^.]+$/, '')}-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else if (next.size < 2) next.add(id); else { next.delete([...next][0]); next.add(id); } return next; });
  };

  const comparedEntries = history.filter((e) => compareIds.has(e.id));

  const startRename = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditName(entry.customName || entry.fileName);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      setHistory((prev) => prev.map((e) => e.id === id ? { ...e, customName: editName.trim() } : e));
    }
    setEditingId(null);
    setEditName('');
  };

  const displayName = (entry: HistoryEntry) => entry.customName || entry.fileName;

  const handleSubmit = async (_text: string, file: File | null) => {
    setState('loading'); setError(null); setLoadProgress(''); setLoadStep(0); setCompareMode(false); setCompareIds(new Set()); setEditingId(null);
    const fileName = file?.name || 'text-input';
    try {
      if (cachedConfig.provider === 'webllm') {
        // Browser inference path — runs entirely client-side
        if (!isWebGPUSupported()) throw new Error('WebGPU is not available in your browser. Please use Chrome 113+, Edge 113+, or switch to a different AI provider in Settings.');

        let text = _text;
        if (file) {
          text = await readFileContent(file);
        }
        if (!text || text.length < 50) throw new Error('This text is a bit short for a proper debate. Try at least 50 characters — a paragraph or two works best.');

        const truncated = text.length > 15000 ? text.slice(0, 15000) : text;
        setLoadStep(1); setLoadProgress('Waking up the AI...');
        const debaterResponse = await queryBrowserAI(cachedConfig.model, DEBATER_PROMPT, truncated, (msg, pct) => {
          if (msg.includes('already loaded')) { setLoadStep(2); setLoadProgress(''); }
          else { setLoadStep(1); setLoadProgress(`${msg} (${pct}%)`); }
        });
        setLoadStep(3); setLoadProgress('');
        const professorResponse = await queryBrowserAI(cachedConfig.model, PROFESSOR_PROMPT, truncated, () => {});
        setLoadStep(4);
        const data: DebateResult = { originalLength: truncated.length, debater: debaterResponse, professor: professorResponse };
        setResult(data); setCurrentFile(fileName); setState('results');
        setHistory((prev) => [{ id: Date.now().toString(), timestamp: Date.now(), fileName, result: data, score: computeScore(data) }, ...prev].slice(0, 20));
        return;
      }

      // Server inference path — Ollama, OpenAI, or Anthropic
      const formData = new FormData();
      if (file) formData.append('file', file);
      else if (_text) formData.append('text', _text);
      else throw new Error('Please provide text or a file to debate.');

      const res = await fetch('/api/debate', { method: 'POST', body: formData });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: `Server returned ${res.status}` }));
        throw new Error(d.error || 'Failed to reach the server');
      }
      const data: DebateResult = await res.json();
      setResult(data); setCurrentFile(fileName); setState('results');
      setHistory((prev) => [{ id: Date.now().toString(), timestamp: Date.now(), fileName, result: data, score: computeScore(data) }, ...prev].slice(0, 20));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg); setState('error');
    }
  };

  useEffect(() => { if (state === 'results') { requestAnimationFrame(() => requestAnimationFrame(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); })); } }, [state]);

  const handleReset = () => { setState('idle'); setResult(null); setError(null); setCurrentFile(''); setLoadProgress(''); setCompareMode(false); setCompareIds(new Set()); setEditingId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleRevisit = (entry: HistoryEntry) => { setResult(entry.result); setCurrentFile(displayName(entry)); setState('results'); setError(null); setCompareMode(false); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); };
  const handleSettingsSaved = () => { refreshConfig(); };
  const currentScore = result ? computeScore(result) : null;

  // Score trend data (last 10, reversed to show chronological)
  const trendData = [...history].reverse().slice(-10);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onViewChange={setActiveView}
          activeView={activeView}
          provider={cachedConfig.provider}
          staticMode={staticMode}
        />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={handleSettingsSaved} staticMode={staticMode} />

        <ErrorBoundary onReset={handleReset}>

        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-24">
          {activeView === 'guide' ? (
            <div className="w-full max-w-5xl mt-10 sm:mt-16">
              <HowTo />
            </div>
          ) : (
          <div className="w-full max-w-4xl mt-10 sm:mt-16">
            {state === 'idle' && (
              <div className="text-center mb-10 sm:mb-14 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider mb-6" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'color-mix(in srgb, rgb(var(--accent)) 20%, transparent)', color: 'rgb(var(--accent))' }}>
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'rgb(var(--accent))' }}></span><span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'rgb(var(--accent))' }}></span></span>
                  No install. No key. No account.
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic font-semibold tracking-tight mb-5 leading-[1.05]" style={{ color: 'rgb(var(--text))' }}>Make your argument<br /><span className="text-accent">impossible to ignore.</span></h1>
                <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>Upload an essay and get two rigorous perspectives: an Oxford-style counterargument and a structured logic review.</p>
              </div>
            )}

            {(state === 'idle' || state === 'error') && (
              <div>
                <div className="rounded-3xl p-1">
                  <InputPanel onSubmit={handleSubmit} isLoading={false} error={error} />
                </div>
                {history.length > 0 && (
                  <div className="mt-10 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="eyebrow mb-1.5">Your workspace</p>
                        <h3 className="text-base font-semibold" style={{ color: 'rgb(var(--text))' }}>Recent analyses</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {history.length >= 2 && (
                          <button onClick={() => { setCompareMode(!compareMode); setCompareIds(new Set()); }} className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${compareMode ? 'border-accent bg-accent/5' : 'border-surface-border hover:border-zinc-600'}`} style={{ color: compareMode ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))' }}>{compareMode ? 'Cancel' : 'Compare'}</button>
                        )}
                        <button onClick={() => setHistory([])} className="text-[11px] font-medium px-2 py-1 rounded-lg border border-surface-border hover:border-red-500/30 hover:text-red-400 transition-colors" style={{ color: 'rgb(var(--text-muted))' }}>Clear</button>
                      </div>
                    </div>

                    {/* Score trend chart */}
                    {trendData.length >= 2 && (
                      <div className="glass rounded-2xl p-4 mb-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--text-muted))' }}>Score trend</p>
                        <div className="flex items-end gap-1.5 h-16">
                          {trendData.map((entry, i) => (
                            <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80" style={{
                                height: `${Math.max(4, entry.score.total)}%`,
                                backgroundColor: entry.score.total >= 70 ? 'rgb(52,211,153)' : entry.score.total >= 40 ? 'rgb(251,191,36)' : 'rgb(248,113,113)',
                              }} />
                              <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 font-mono" style={{ color: 'rgb(var(--text))' }}>{entry.score.total}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[9px]" style={{ color: 'rgb(var(--text-muted))' }}>Oldest</span>
                          <span className="text-[9px]" style={{ color: 'rgb(var(--text-muted))' }}>Newest</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {history.slice(0, 5).map((entry) => (
                        <button key={entry.id} onClick={() => compareMode ? toggleCompare(entry.id) : handleRevisit(entry)} className={`w-full glass rounded-xl p-3.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between group text-left focus-visible:ring-2 focus-visible:ring-accent focus:outline-none ${compareIds.has(entry.id) ? 'ring-1 ring-accent/50' : ''}`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {compareMode && (
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${compareIds.has(entry.id) ? 'border-accent bg-accent/10' : 'border-surface-border'}`}>
                                {compareIds.has(entry.id) && <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                              </div>
                            )}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.score.total >= 70 ? 'bg-emerald-400/10' : entry.score.total >= 40 ? 'bg-amber-400/10' : 'bg-red-400/10'}`}>
                              <span className={`text-xs font-bold ${entry.score.total >= 70 ? 'text-emerald-400' : entry.score.total >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{entry.score.total}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              {editingId === entry.id ? (
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onBlur={() => saveRename(entry.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveRename(entry.id); if (e.key === 'Escape') setEditingId(null); }}
                                  className="text-sm font-medium bg-transparent border-b border-accent outline-none w-full"
                                  style={{ color: 'rgb(var(--text))' }}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text))' }}>{displayName(entry)}</p>
                              )}
                              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{formatDate(entry.timestamp)} &middot; {entry.result.originalLength.toLocaleString()} chars &middot; {entry.score.counterCount} counters</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {!compareMode && editingId !== entry.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); startRename(entry); }}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
                                style={{ color: 'rgb(var(--text-muted))' }}
                                title="Rename"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                              </button>
                            )}
                            {!compareMode && (
                              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'rgb(var(--text-muted))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {compareMode && comparedEntries.length === 2 && (
                      <div className="mt-6 glass rounded-2xl p-5 animate-fade-in">
                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgb(var(--text-muted))' }}>Comparing Debates</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {comparedEntries.map((entry) => (
                            <div key={entry.id}>
                              <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text))' }}>{displayName(entry)}</p><ScoreBadge score={entry.score} /></div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="glass rounded-lg p-2 text-center"><p style={{ color: 'rgb(var(--text-muted))' }}>Counters</p><p className="font-bold" style={{ color: 'rgb(var(--text))' }}>{entry.score.counterCount}</p></div>
                                <div className="glass rounded-lg p-2 text-center"><p style={{ color: 'rgb(var(--text-muted))' }}>Confidence</p><p className="font-bold" style={{ color: 'rgb(var(--text))' }}>{entry.score.confidence}</p></div>
                                <div className="glass rounded-lg p-2 text-center col-span-2"><p style={{ color: 'rgb(var(--text-muted))' }}>Fallacies</p><p className="font-bold" style={{ color: entry.score.hasFallacies ? 'rgb(239,68,68)' : 'rgb(var(--text))' }}>{entry.score.hasFallacies ? 'Detected' : 'None'}</p></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {state === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                {/* Step progress indicator */}
                <div className="flex items-center gap-3 mb-10">
                  {['Reading', 'Model', 'Debater', 'Professor'].map((label, i) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`flex flex-col items-center gap-1.5`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          loadStep > i ? 'bg-emerald-500/20 text-emerald-400' :
                          loadStep === i ? 'bg-accent/20 text-accent animate-pulse-glow' :
                          'bg-white/5 text-zinc-600'
                        }`}>
                          {loadStep > i ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : (
                            <span className="text-[10px] font-bold font-mono">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium transition-colors duration-500 ${loadStep >= i ? '' : ''}`} style={{ color: loadStep >= i ? 'rgb(var(--text-secondary))' : 'rgb(var(--text-muted))' }}>{label}</span>
                      </div>
                      {i < 3 && <div className={`w-6 h-px transition-colors duration-500 ${loadStep > i ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                    </div>
                  ))}
                </div>

                {/* Central loading animation */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center animate-pulse-glow" style={{ backgroundColor: 'rgb(var(--bg-overlay))', borderColor: 'rgb(var(--border))', border: '1px solid rgb(var(--border))' }}>
                    {loadStep < 2 ? (
                      <svg className="w-10 h-10 animate-spin" style={{ color: 'rgb(var(--accent))' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: 'rgb(var(--oxford))', animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: 'rgb(var(--oxford))', animationDelay: '200ms' }} />
                        <span className="w-2 h-2 rounded-full animate-typing" style={{ backgroundColor: 'rgb(var(--professor))', animationDelay: '400ms' }} />
                      </div>
                    )}
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-3xl animate-ping-slow opacity-20" style={{ border: '2px solid rgb(var(--accent))' }} />
                </div>

                {/* Status text */}
                <h2 className="text-xl font-serif italic font-semibold mb-1.5" style={{ color: 'rgb(var(--text))' }}>
                  {loadStep === 0 && 'Reading your text…'}
                  {loadStep === 1 && (loadProgress || 'Loading the AI model…')}
                  {loadStep === 2 && 'Oxford Union debater is thinking…'}
                  {loadStep === 3 && 'Logic professor is analyzing…'}
                  {loadStep === 4 && 'Compiling your analysis…'}
                </h2>
                <p className="text-sm max-w-md text-center leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                  {loadStep === 0 && 'Extracting the text from your file to prepare it for analysis.'}
                  {loadStep === 1 && 'First-time downloads can take a minute. The model stays cached for next time.'}
                  {loadStep === 2 && 'Crafting structured counterarguments with claims, evidence, and impact.'}
                  {loadStep === 3 && 'Reconstructing your argument, checking for fallacies, and evaluating strength.'}
                  {loadStep === 4 && 'Almost done — putting everything together.'}
                </p>
              </div>
            )}

            {state === 'results' && result && (
              <div ref={resultsRef}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                  <div>
                    <div className="flex items-center gap-3"><p className="eyebrow">Analysis complete</p>{currentScore && <ScoreBadge score={currentScore} />}</div>
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2" style={{ color: 'rgb(var(--text))' }}>Your argument, examined.</h2>
                    {currentFile && <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>{currentFile} &middot; {currentScore?.counterCount || 0} counterarguments &middot; {result.originalLength.toLocaleString()} chars</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => result && exportMarkdown(result, currentFile || 'debate')} className="text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-surface-border" style={{ color: 'rgb(var(--text-secondary))' }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export</button>
                    <button onClick={handleReset} className="text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-surface-border" style={{ color: 'rgb(var(--text-muted))' }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>New</button>
                  </div>
                </div>
                <DebateView debater={result.debater} professor={result.professor} />
              </div>
            )}
          </div>
          )}
        </main>

        <footer className="text-center py-10 text-xs border-t border-surface-border/60" style={{ color: 'rgb(var(--text-muted))' }}>Debalect &mdash; {staticMode || cachedConfig.provider === 'webllm' ? 'Cognitive training that runs in your browser. No install, no account, no API key needed.' : `Powered by ${cachedConfig.provider === 'ollama' ? 'Ollama (local)' : cachedConfig.provider === 'openai' ? 'OpenAI' : 'Anthropic'}.`}</footer>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
