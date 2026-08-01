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
  {
    id: 'webllm',
    name: 'Browser',
    note: 'Runs in your browser via WebGPU. No install. No key.',
    needsKey: false,
    models: ['Llama-3.2-3B-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC', 'Gemma-2-2B-it-q4f16_1-MLC'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    note: 'Local. Requires Ollama installed and the backend running.',
    needsKey: false,
    models: ['llama3.1', 'llama3.2', 'mistral', 'gemma2'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    note: 'Cloud API. Requires an API key.',
    needsKey: true,
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    note: 'Cloud API. Requires an API key.',
    needsKey: true,
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  },
];

export default function SettingsModal({ open, onClose, onSaved, staticMode }: Props) {
  const [config, setConfig] = useState<ConfigState>({ provider: PROVIDERS[0].id, model: PROVIDERS[0].models[0], hasKey: false });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
        const saved = localStorage.getItem('debalect_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConfig({
              provider: parsed.provider || 'webllm',
              model: parsed.model || PROVIDERS[0].models[0],
              hasKey: false,
            });
          } catch {
            setConfig({ provider: 'webllm', model: PROVIDERS[0].models[0], hasKey: false });
          }
        } else {
          setConfig({ provider: 'webllm', model: PROVIDERS[0].models[0], hasKey: false });
        }
        setLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const currentProvider = PROVIDERS.find((p) => p.id === config.provider) || PROVIDERS[0];
  const needsApiKey = currentProvider.needsKey;
  const isBrowser = currentProvider.id === 'webllm';

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');

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
      }, 400);
    } catch (err) {
      if (config.provider === 'webllm') {
        setStatus('saved');
        onSaved();
        setTimeout(() => { onClose(); setStatus('idle'); }, 400);
        return;
      }
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not reach the server.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-surface-raised border border-surface-border rounded-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings"
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-surface-border">
          <h2 className="text-[14px] font-medium" style={{ color: 'rgb(var(--text))' }}>Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[12px] hover:underline"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            esc
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'rgb(var(--text-muted))' }} aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Provider
              </div>
              <div className="border border-surface-border rounded-md divide-y divide-surface-border">
                {PROVIDERS.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-overlay"
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p.id}
                      checked={config.provider === p.id}
                      onChange={() => setConfig({ provider: p.id, model: p.models[0], hasKey: config.hasKey })}
                      className="mt-1"
                      style={{ accentColor: 'rgb(var(--accent))' }}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[13px]" style={{ color: 'rgb(var(--text))' }}>{p.name}</div>
                      <div className="text-[12px]" style={{ color: 'rgb(var(--text-muted))' }}>{p.note}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Model
              </div>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-[13px] focus:border-accent"
                style={{ color: 'rgb(var(--text))' }}
              >
                {currentProvider.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {isBrowser && (
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                First run downloads the model (~2 GB). Subsequent runs use the cache.
              </p>
            )}

            {staticMode && config.provider !== 'webllm' && (
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                The backend is not reachable. Run <code className="font-mono text-[11px]" style={{ color: 'rgb(var(--text))' }}>npm run dev</code> from the project root.
              </p>
            )}

            {needsApiKey && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                    API key
                  </div>
                  {config.hasKey && !apiKey && (
                    <span className="text-[11px] font-mono" style={{ color: 'rgb(var(--text-muted))' }}>saved</span>
                  )}
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config.hasKey ? 'Enter new key to replace saved one' : `Paste your ${currentProvider.name} key`}
                  className="w-full bg-surface-raised border border-surface-border rounded-md px-3 py-2 text-[13px] focus:border-accent"
                  style={{ color: 'rgb(var(--text))' }}
                />
                <p className="text-[11px]" style={{ color: 'rgb(var(--text-muted))' }}>
                  Stored in server memory only. Resets when the server restarts.
                </p>
              </div>
            )}

            {status === 'error' && (
              <p className="text-[12px]" style={{ color: 'rgb(var(--text))' }}>{errorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="text-[13px] px-3 py-2 hover:underline"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={status === 'saving' || (needsApiKey && !apiKey && !config.hasKey)}
                className={
                  status === 'saved'
                    ? 'text-[13px] px-3 py-2 rounded-md transition-opacity'
                    : 'text-[13px] px-3 py-2 rounded-md btn-invert transition-opacity'
                }
                style={{
                  backgroundColor: status === 'saved' ? 'transparent' : 'rgb(var(--text))',
                  color: status === 'saved' ? 'rgb(var(--accent))' : undefined,
                  opacity: (status === 'saving' || (needsApiKey && !apiKey && !config.hasKey)) ? 0.5 : 1,
                }}
              >
                {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved.' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
