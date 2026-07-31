import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  staticMode?: boolean;
}

interface ConfigState {
  provider: string;
  model: string;
  hasKey: boolean;
}

const PROVIDERS = [
  { id: 'webllm', label: 'Browser', desc: 'Runs in your browser via WebGPU. No install, no key, fully private.', needsKey: false, models: ['Llama-3.2-3B-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC', 'Gemma-2-2B-it-q4f16_1-MLC'] },
  { id: 'ollama', label: 'Ollama', desc: 'Free, runs locally. Requires Ollama installed.', needsKey: false, models: ['llama3.1', 'llama3.2', 'mistral', 'gemma2'] },
  { id: 'openai', label: 'OpenAI', desc: 'Cloud API. Needs an API key. No install required.', needsKey: true, models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] },
  { id: 'anthropic', label: 'Anthropic', desc: 'Cloud API. Needs an API key. No install required.', needsKey: true, models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-opus-latest'] },
];

export default function SettingsModal({ open, onClose, onSaved, staticMode }: Props) {
  const [config, setConfig] = useState<ConfigState>({ provider: PROVIDERS[0].id, model: PROVIDERS[0].models[0], hasKey: false });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const providers = PROVIDERS;

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Try server config first, fall back to localStorage, then default
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: ConfigState) => {
        setConfig(c);
        setLoading(false);
      })
      .catch(() => {
        // Fall back to localStorage
        const saved = localStorage.getItem('debalect_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConfig({ provider: parsed.provider || 'webllm', model: parsed.model || PROVIDERS[0].models[0], hasKey: false });
          } catch {
            setConfig({ provider: 'webllm', model: PROVIDERS[0].models[0], hasKey: false });
          }
        } else {
          setConfig({ provider: 'webllm', model: PROVIDERS[0].models[0], hasKey: false });
        }
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const currentProvider = providers.find((p) => p.id === config.provider) || providers[0];
  const needsApiKey = currentProvider.needsKey;
  const isBrowser = currentProvider.id === 'webllm';

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');

    // Always persist to localStorage so settings survive page reloads
    localStorage.setItem('debalect_config', JSON.stringify({ provider: config.provider, model: config.model }));

    try {
      const body: Record<string, string> = { provider: config.provider, model: config.model };
      if (apiKey) body.apiKey = apiKey;

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save config on server');

      const updated = await res.json();
      setConfig(updated);
      setStatus('saved');
      onSaved();

      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 600);
    } catch (err) {
      // If we're using webllm (browser-only), local persistence is sufficient
      if (config.provider === 'webllm') {
        setStatus('saved');
        onSaved();
        setTimeout(() => { onClose(); setStatus('idle'); }, 600);
        return;
      }
      // For server-dependent providers, show the error
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not reach the server to save settings. Make sure the backend is running.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md glass rounded-2xl shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--text))' }}>Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-6 h-6 animate-spin" style={{ color: 'rgb(var(--accent))' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Provider selector */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                AI Provider
              </label>
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setConfig({ provider: p.id, model: p.models[0], hasKey: config.hasKey })}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-all duration-200
                    ${config.provider === p.id
                      ? 'border-accent bg-accent/5'
                      : 'border-surface-border hover:border-zinc-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'rgb(var(--text))' }}>{p.label}</span>
                    {config.provider === p.id && (
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{p.desc}</p>
                </button>
              ))}
            </div>

            {/* Warning for server-dependent providers when server is unreachable */}
            {staticMode && config.provider !== 'webllm' && (
              <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span><strong>Server not detected.</strong> Ollama and cloud APIs require the backend to be running locally (<code className="text-[11px] bg-amber-500/10 px-1 rounded">npm run dev</code> in the server folder). Settings will be saved locally but won't take effect until the server starts.</span>
                </div>
              </div>
            )}

            {/* Model selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'rgb(var(--text-muted))' }}>
                Model
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full glass rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                style={{ color: 'rgb(var(--text))', borderColor: 'rgb(var(--border))' }}
              >
                {currentProvider.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Test connection — only when server is available */}
            {!staticMode && (
            <div className="mb-5">
              <button
                onClick={async () => {
                  setTesting(true);
                  setTestResult(null);
                  try {
                    const res = await fetch('/api/health');
                    const health = await res.json();
                    setTestResult({ ok: health.ok, msg: health.message || (health.ok ? 'Connected' : 'Failed') });
                  } catch {
                    setTestResult({ ok: false, msg: 'Could not reach server' });
                  }
                  setTesting(false);
                }}
                disabled={testing}
                className="w-full py-2 rounded-xl text-xs font-medium transition-all duration-200 border border-surface-border hover:border-zinc-600 disabled:opacity-50"
                style={{ color: 'rgb(var(--text-secondary))' }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${testResult.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {testResult.msg}
                </p>
              )}
            </div>
            )}

        {/* Browser info */}
        {isBrowser && (
          <div className="mb-5 glass rounded-xl p-4">
            <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              Models run directly in your browser via WebGPU. The first debate downloads the model (~2 GB, cached afterwards). Requires Chrome 113+ or Edge 113+.
            </p>
          </div>
        )}

        {/* API Key */}
        {needsApiKey && (
              <div className="mb-5">
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'rgb(var(--text-muted))' }}>
                  API Key
                  {config.hasKey && !apiKey && (
                    <span className="text-[10px] text-emerald-400">Key saved</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config.hasKey ? 'Enter new key to replace saved one' : `Paste your ${currentProvider.label} API key`}
                  className="w-full glass rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  style={{ color: 'rgb(var(--text))', borderColor: 'rgb(var(--border))' }}
                />
                <p className="text-[10px] mt-1.5" style={{ color: 'rgb(var(--text-muted))' }}>
                  Your key is stored in server memory only. It resets when the server restarts.
                </p>
              </div>
            )}

            {status === 'error' && (
              <p className="text-xs text-red-400 mb-4">{errorMsg || 'Failed to save'}</p>
            )}

            <button
              onClick={handleSave}
              disabled={status === 'saving' || (needsApiKey && !apiKey && !config.hasKey)}
              className={`
                w-full py-3 rounded-xl font-medium text-sm transition-all duration-300
                ${status === 'saving' || (needsApiKey && !apiKey && !config.hasKey)
                  ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                  : status === 'saved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98]'
                }
              `}
            >
              {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save Settings'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
