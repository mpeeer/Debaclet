import { useState } from 'react';

interface Props {
  rawText: string;
}

interface ParsedCounter {
  id: string;
  title: string;
  claim: string;
  evidence: string;
  impact: string;
}

function parseCounterArguments(text: string): {
  thesis: string;
  counters: ParsedCounter[];
  closing: string;
} {
  let thesis = '';
  const counters: ParsedCounter[] = [];
  let closing = '';

  const thesisMatch = text.match(/##\s*THESIS\s*\n([\s\S]*?)(?=###\s*Counterargument|\n##)/i);
  if (thesisMatch) {
    thesis = thesisMatch[1].trim();
  }

  const counterRegex = /###\s*Counterargument\s*(\d+):\s*(.*?)\n\*\*Claim:\*\*\s*([\s\S]*?)\n\*\*Evidence:\*\*\s*([\s\S]*?)\n\*\*Impact:\*\*\s*([\s\S]*?)(?=###\s*Counterargument|\n##\s*CLOSING\s*STATEMENT|\n##\s*CLOSING|$)/gi;

  let match;
  while ((match = counterRegex.exec(text)) !== null) {
    counters.push({
      id: `counter-${match[1]}`,
      title: match[2].trim(),
      claim: match[3].trim(),
      evidence: match[4].trim(),
      impact: match[5].trim(),
    });
  }

  const closingMatch = text.match(/##\s*CLOSING\s*STATEMENT\s*\n([\s\S]*?)$/i);
  if (closingMatch) {
    closing = closingMatch[1].trim();
  }

  return { thesis, counters, closing };
}

export default function CounterArgument({ rawText }: Props) {
  const { thesis, counters, closing } = parseCounterArguments(rawText);
  const [expandedId, setExpandedId] = useState<string | null>(counters[0]?.id || null);

  if (counters.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Counterargument
        </h3>
        <div className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(var(--text))' }}>
          {rawText}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Counterargument
        </h3>
        <span className="text-[11px] font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
          {counters.length} {counters.length === 1 ? 'argument' : 'arguments'}
        </span>
      </div>

      {thesis && (
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
            Thesis
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{thesis}</p>
        </div>
      )}

      <ol className="space-y-2 list-none">
        {counters.map((counter, i) => {
          const isOpen = expandedId === counter.id;
          return (
            <li key={counter.id} className="border border-surface-border rounded-md">
              <button
                onClick={() => setExpandedId(isOpen ? null : counter.id)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-overlay transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[12px] font-mono w-5 shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] truncate" style={{ color: 'rgb(var(--text))' }}>{counter.title}</span>
                </div>
                <span className="text-[12px] font-mono shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-surface-border px-3 py-3 space-y-3">
                  <Row label="claim" body={counter.claim} />
                  <Row label="evidence" body={counter.evidence} />
                  <Row label="impact" body={counter.impact} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {closing && (
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
            Closing
          </div>
          <p className="text-[14px] leading-relaxed italic" style={{ color: 'rgb(var(--text-secondary))' }}>{closing}</p>
        </div>
      )}
    </section>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
        {label}
      </div>
      <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text))' }}>{body}</p>
    </div>
  );
}
