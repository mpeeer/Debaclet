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

  // Extract thesis
  const thesisMatch = text.match(/##\s*THESIS\s*\n([\s\S]*?)(?=###\s*Counterargument|\n##)/i);
  if (thesisMatch) {
    thesis = thesisMatch[1].trim();
  }

  // Extract counterarguments
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

  // Extract closing
  const closingMatch = text.match(/##\s*CLOSING\s*STATEMENT\s*\n([\s\S]*?)$/i);
  if (closingMatch) {
    closing = closingMatch[1].trim();
  }

  return { thesis, counters, closing };
}

export default function CounterArgument({ rawText }: Props) {
  const { thesis, counters, closing } = parseCounterArguments(rawText);
  const [expandedId, setExpandedId] = useState<string | null>(counters[0]?.id || null);

  // Fallback: raw text display if parsing failed
  if (counters.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="prose-debate whitespace-pre-wrap">{rawText}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thesis card */}
      {thesis && (
        <div className="glass rounded-2xl p-5 border-l-2 border-debate-oxford/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-debate-oxford/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-debate-oxford" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="text-xs font-medium text-debate-oxford uppercase tracking-wide">Thesis Identified</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{thesis}</p>
        </div>
      )}

      {/* Counterargument cards */}
      {counters.map((counter, i) => (
        <div
          key={counter.id}
          className="glass rounded-2xl overflow-hidden transition-all duration-300 animate-slide-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <button
            onClick={() => setExpandedId(expandedId === counter.id ? null : counter.id)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-debate-oxford/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-debate-oxford">{i + 1}</span>
              </div>
              <h3 className="text-[15px] font-semibold text-white">{counter.title}</h3>
            </div>
            <svg
              className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${expandedId === counter.id ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedId === counter.id && (
            <div className="px-5 pb-5 space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-debate-oxford/70">Claim</span>
                </div>
                <p className="text-sm text-white leading-relaxed">{counter.claim}</p>
              </div>

              <div className="border-t border-surface-border pt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">Evidence</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{counter.evidence}</p>
              </div>

              <div className="border-t border-surface-border pt-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70">Impact</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{counter.impact}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Closing statement */}
      {closing && (
        <div className="glass rounded-2xl p-5 bg-debate-oxford/5 border border-debate-oxford/20 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-debate-oxford" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-debate-oxford/70">Closing Statement</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed italic">{closing}</p>
        </div>
      )}
    </div>
  );
}
