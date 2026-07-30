import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface ConfigState {
  provider: string;
  model: string;
  hasKey: boolean;
}

const PROVIDERS = [
  { id: 'webllm', label: 'Browser', desc: 'Runs in your browser via WebGPU. No install, no key, fully private.', models: ['Llama-3.2-3B-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC', 'Gemma-2-2B-it-q4f16_1-MLC'] },
  { id: 'ollama', label: 'Ollama', desc: 'Free, runs locally. Requires Ollama installed.', models: ['llama3.1', 'llama3.2', 'mistral', 'gemma2'] },
  { id: 'openai', label: 'OpenAI', desc: 'Cloud API. Needs an API key. No install required.', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] },
  { id: 'anthropic', label: 'Anthropic', desc: 'Cloud API. Needs an API key. No install required.', models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-opus-latest'] },
];

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [config, setConfig] = useState<ConfigState>({ provider: PROVIDERS[0].id, model: PROVIDERS[0].models[0], hasKey: false });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: ConfigState) => {
        setConfig(c);
        setLoading(false);
      })
      .catch(() => {
        setConfig({ provider: PROVIDERS[0].id, model: PROVIDERS[0].models[0], hasKey: false });
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const currentProvider = PROVIDERS.find((p) => p.id === config.provider) || PROVIDERS[0];
  const needsApiKey = currentProvider.id === 'openai' || currentProvider.id === 'anthropic';
  const isBrowser = currentProvider.id === 'webllm';

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');

    try {
      const body: Record<string, string> = { provider: config.provider, model: config.model };
      if (apiKey) body.apiKey = apiKey;

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save config');

      const updated = await res.json();
      setConfig(updated);
      setStatus('saved');
      onSaved();

      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 600);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
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
              {PROVIDERS.map((p) => (
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

            {/* Test connection */}
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
