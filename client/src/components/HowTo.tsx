import type { ReactNode } from 'react';

const LinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.75l1.125-1.125a3.182 3.182 0 114.5 4.5L15.75 13.5m-5.25 3.75l-1.125 1.125a3.182 3.182 0 11-4.5-4.5L8.25 10.5m1.5 4.5l4.5-4.5" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline underline-offset-4">
      {children}
      <LinkIcon />
    </a>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold border" style={{ color: 'rgb(var(--accent))', backgroundColor: 'var(--accent-soft)', borderColor: 'color-mix(in srgb, rgb(var(--accent)) 25%, transparent)' }}>
        {number}
      </div>
      <div className="min-w-0 pt-0.5">
        <h4 className="text-sm font-semibold" style={{ color: 'rgb(var(--text))' }}>{title}</h4>
        <div className="text-sm leading-relaxed mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>{children}</div>
      </div>
    </div>
  );
}

export default function HowTo() {
  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'rgb(var(--accent))' }}>Setup guide</p>
        <h1 className="text-4xl sm:text-5xl font-serif italic font-semibold tracking-tight mb-4" style={{ color: 'rgb(var(--text))' }}>How to use AI with Debalect</h1>
        <p className="text-base leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          Choose where inference runs. Browser mode needs no account or server. Ollama keeps models on your computer. Hosted providers send your text to a third-party service and may have usage limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-400/10 text-emerald-400 text-sm font-semibold">01</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Recommended</span>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--text))' }}>Browser model</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgb(var(--text-secondary))' }}>Runs through WebGPU on your device. No installation, API key, or backend is required.</p>
          <ul className="space-y-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            <li className="flex gap-2"><CheckIcon />Free to use</li>
            <li className="flex gap-2"><CheckIcon />Data stays in the browser</li>
            <li className="flex gap-2"><CheckIcon />First run downloads the model</li>
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-400/10 text-cyan-400 text-sm font-semibold">02</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Local</span>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--text))' }}>Ollama</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgb(var(--text-secondary))' }}>Runs an open model locally. Debalect connects to Ollama through the optional local backend.</p>
          <ul className="space-y-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            <li className="flex gap-2"><CheckIcon />No provider API key</li>
            <li className="flex gap-2"><CheckIcon />Local data processing</li>
            <li className="flex gap-2"><CheckIcon />Uses your computer’s resources</li>
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-400/10 text-violet-400 text-sm font-semibold">03</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Hosted</span>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--text))' }}>Free-tier API</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgb(var(--text-secondary))' }}>Use a hosted provider’s free tier when available. This is an optional developer extension, not a provider you can select in Debalect yet.</p>
          <ul className="space-y-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            <li className="flex gap-2"><CheckIcon />No local model download</li>
            <li className="flex gap-2"><CheckIcon />Subject to provider limits</li>
            <li className="flex gap-2"><CheckIcon />Review data-use terms first</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Option 1</p>
              <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--text))' }}>Use the built-in browser model</h2>
            </div>
            <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400">No setup</span>
          </div>
          <div className="space-y-4">
            <Step number="1" title="Use a supported browser">Open Debalect in Chrome 113+ or Edge 113+ with WebGPU enabled.</Step>
            <Step number="2" title="Keep Browser selected">Open <strong style={{ color: 'rgb(var(--text))' }}>Settings</strong>, choose <strong style={{ color: 'rgb(var(--text))' }}>Browser</strong>, select a model, and save.</Step>
            <Step number="3" title="Run your first analysis">The first run downloads model files to your browser cache. The download can be large; later runs use the cached files.</Step>
          </div>
          <div className="mt-5 p-3.5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            If WebGPU is unavailable, use Ollama or connect the optional backend instead. Browser inference is limited by the memory and performance of your device.
          </div>
        </section>

        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">Option 2</p>
              <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--text))' }}>Install and use Ollama</h2>
            </div>
            <ExternalLink href="https://ollama.com/download">Ollama download</ExternalLink>
          </div>
          <div className="space-y-4">
            <Step number="1" title="Install Ollama">Download the installer for <ExternalLink href="https://ollama.com/download">Windows, macOS, or Linux</ExternalLink>. Debalect does not install Ollama for you.</Step>
            <Step number="2" title="Download a model">Open a terminal and run one of the supported models:</Step>
            <pre className="ml-10 rounded-xl px-4 py-3 overflow-x-auto text-xs font-mono border" style={{ color: 'rgb(var(--text-secondary))', backgroundColor: 'rgb(var(--bg))', borderColor: 'rgb(var(--border))' }}><code>ollama pull llama3.1{`\n`}# or: ollama pull llama3.2{`\n`}# or: ollama pull mistral</code></pre>
            <Step number="3" title="Start Ollama">The Ollama desktop app normally runs the service automatically. If it is not responding, run <code className="text-xs px-1.5 py-0.5 rounded bg-white/5">ollama serve</code>.</Step>
            <Step number="4" title="Start Debalect’s backend">From the project root, run <code className="text-xs px-1.5 py-0.5 rounded bg-white/5">npm run dev</code>, then open Settings and select <strong style={{ color: 'rgb(var(--text))' }}>Ollama</strong>.</Step>
          </div>
          <div className="mt-5 p-3.5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            Default Ollama address: <code className="font-mono">http://localhost:11434</code>. The model name in Settings must match a model installed with <code className="font-mono">ollama pull</code>.
          </div>
        </section>

        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Option 3</p>
              <h2 className="text-xl font-semibold" style={{ color: 'rgb(var(--text))' }}>Use a free hosted model</h2>
            </div>
            <ExternalLink href="https://aistudio.google.com/">Google AI Studio</ExternalLink>
          </div>
          <div className="p-3.5 rounded-xl border border-violet-400/20 bg-violet-400/5 text-sm leading-relaxed mb-5" style={{ color: 'rgb(var(--text-secondary))' }}>
            Google AI Studio may provide free API access depending on your region and current plan. It is not a built-in Debalect provider. Limits, model availability, and data-use terms can change; check the <ExternalLink href="https://ai.google.dev/gemini-api/docs/rate-limits">current rate limits</ExternalLink> before sending sensitive text.
          </div>
          <div className="space-y-4">
            <Step number="1" title="Create a provider account">Open <ExternalLink href="https://aistudio.google.com/">Google AI Studio</ExternalLink> and review the current free-tier terms.</Step>
            <Step number="2" title="Create an API key">Generate a key in the provider dashboard. Do not place it in client-side code or commit it to Git.</Step>
            <Step number="3" title="Add a server adapter">Debalect currently has built-in server adapters for Ollama, OpenAI, and Anthropic. Google AI Studio is not selectable in Settings yet; connecting it requires adding a provider adapter and keeping the key on the server.</Step>
            <Step number="4" title="Set limits before use">Add rate limits, usage monitoring, and a clear data-retention policy before using a hosted provider with other people’s documents.</Step>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'color-mix(in srgb, rgb(var(--bg-raised)) 60%, transparent)' }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'rgb(var(--text))' }}>Before sending a document</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          Remove confidential, personal, or regulated information unless you understand how the selected provider processes and retains data. Browser and Ollama modes keep inference on your device; hosted modes do not.
        </p>
      </section>
    </div>
  );
}
