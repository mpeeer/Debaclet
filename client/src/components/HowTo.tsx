import type { ReactNode } from 'react';

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-80" style={{ color: 'rgb(var(--accent))' }}>
      {children}
    </a>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-4">
      <span className="text-[12px] font-mono mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
        {number}
      </span>
      <div className="space-y-1">
        <div className="text-[14px]" style={{ color: 'rgb(var(--text))' }}>{title}</div>
        <div className="text-[13px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          {body}
        </div>
      </div>
    </li>
  );
}

export default function HowTo() {
  return (
    <div className="space-y-8 py-6">
      <header className="space-y-2">
        <h1 className="text-[22px] tracking-tight" style={{ color: 'rgb(var(--text))' }}>
          Setup
        </h1>
        <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: 'rgb(var(--text-secondary))' }}>
          Where the model runs. Browser mode needs no server. Ollama, OpenAI, and Anthropic run through the optional backend.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[13px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Browser
        </h2>
        <ol className="space-y-3">
          <Step number="1" title="Use a WebGPU browser" body={<>Chrome 113+, Edge 113+, or any Chromium browser with hardware acceleration enabled.</>} />
          <Step number="2" title="Open Settings, pick a model" body={<>In Settings, keep <span style={{ color: 'rgb(var(--text))' }}>Browser</span> as the provider and choose a model. Click save.</>} />
          <Step number="3" title="Run your first analysis" body={<>The first run downloads the model files (~2&nbsp;GB). Subsequent runs use the browser cache.</>} />
        </ol>
      </section>

      <hr />

      <section className="space-y-3">
        <h2 className="text-[13px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Ollama
        </h2>
        <ol className="space-y-3">
          <Step number="1" title="Install Ollama" body={<><Ext href="https://ollama.com/download">Download</Ext> for Windows, macOS, or Linux.</>} />
          <Step number="2" title="Pull a model" body={
            <pre className="font-mono text-[12px] leading-relaxed mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
              <code>ollama pull llama3.1{'\n'}ollama pull llama3.2{'\n'}ollama pull mistral</code>
            </pre>
          } />
          <Step number="3" title="Start Debalect backend" body={<>From the project root: <code className="font-mono text-[12px]" style={{ color: 'rgb(var(--text))' }}>npm run dev</code>. Then pick <span style={{ color: 'rgb(var(--text))' }}>Ollama</span> in Settings. Default address: <code className="font-mono text-[12px]" style={{ color: 'rgb(var(--text))' }}>http://localhost:11434</code>.</>} />
        </ol>
      </section>

      <hr />

      <section className="space-y-3">
        <h2 className="text-[13px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Hosted APIs
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          Built-in adapters exist for OpenAI and Anthropic. Your text leaves the browser when you use them. Paste a key in Settings before saving.
        </p>
      </section>

      <hr />

      <footer className="text-[12px] leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
        Before sending a document: remove confidential, personal, or regulated content unless you understand how the selected provider handles data.
      </footer>
    </div>
  );
}
