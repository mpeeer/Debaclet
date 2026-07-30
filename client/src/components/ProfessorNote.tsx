interface Props {
  rawText: string;
}

interface ParsedAnalysis {
  reconstruction: {
    premises: string[];
    conclusion: string;
    assumptions: string[];
  };
  strengths: string;
  weaknesses: string;
  fallacies: string;
  structural: string;
  verdict: {
    confidence: string;
    improvement: string;
  };
  reading: string;
}

function parseProfessorAnalysis(text: string): ParsedAnalysis | null {
  try {
    const premises: string[] = [];
    const assumptions: string[] = [];

    // Extract premises
    const premSection = text.match(/##\s*ARGUMENT\s*RECONSTRUCTION[\s\S]*?\*\*Premises identified:\*\*([\s\S]*?)(?=\*\*Conclusion|\*\*Implicit)/i);
    if (premSection) {
      const lines = premSection[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
      lines.forEach((l) => {
        const cleaned = l.replace(/^[\s\-•\d.]*\s*/, '').trim();
        if (cleaned) premises.push(cleaned);
      });
    }

    // Extract conclusion
    let conclusion = '';
    const concMatch = text.match(/\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*Implicit|\n\*|$)/i);
    if (concMatch) conclusion = concMatch[1].trim();

    // Extract assumptions
    const assumSection = text.match(/\*\*Implicit assumptions:\*\*([\s\S]*?)(?=##\s*LOGICAL)/i);
    if (assumSection) {
      const lines = assumSection[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
      lines.forEach((l) => {
        const cleaned = l.replace(/^[\s\-•\d.]*\s*/, '').trim();
        if (cleaned) assumptions.push(cleaned);
      });
    }

    // Extract strengths
    let strengths = '';
    const strMatch = text.match(/###\s*Strengths\s*\n([\s\S]*?)(?=###\s*Weaknesses)/i);
    if (strMatch) strengths = strMatch[1].trim();

    // Extract weaknesses
    let weaknesses = '';
    const weakMatch = text.match(/###\s*Weaknesses\s*\n([\s\S]*?)(?=###\s*Fallacies)/i);
    if (weakMatch) weaknesses = weakMatch[1].trim();

    // Extract fallacies
    let fallacies = '';
    const fallMatch = text.match(/###\s*Fallacies\s*Detected\s*\n([\s\S]*?)(?=###\s*Structural)/i);
    if (fallMatch) fallacies = fallMatch[1].trim();

    // Extract structural
    let structural = '';
    const structMatch = text.match(/###\s*Structural\s*Assessment\s*\n([\s\S]*?)(?=##\s*EPISTEMIC)/i);
    if (structMatch) structural = structMatch[1].trim();

    // Extract epistemic verdict
    let confidence = '';
    let improvement = '';
    const confMatch = text.match(/\*\*Confidence level:\*\*\s*(.*?)(?=\n|$)/i);
    if (confMatch) confidence = confMatch[1].trim();
    const imprMatch = text.match(/\*\*Key improvement:\*\*\s*([\s\S]*?)(?=##\s*RECOMMENDED|$)/i);
    if (imprMatch) improvement = imprMatch[1].trim();

    // Extract reading
    let reading = '';
    const readMatch = text.match(/##\s*RECOMMENDED\s*READING\s*\n([\s\S]*?)$/i);
    if (readMatch) reading = readMatch[1].trim();

    return {
      reconstruction: { premises, conclusion, assumptions },
      strengths,
      weaknesses,
      fallacies,
      structural,
      verdict: { confidence, improvement },
      reading,
    };
  } catch {
    return null;
  }
}

function getConfidenceColor(level: string): string {
  const l = level.toLowerCase();
  if (l.includes('high')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (l.includes('moderate')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-red-400 bg-red-400/10 border-red-400/20';
}

export default function ProfessorNote({ rawText }: Props) {
  const analysis = parseProfessorAnalysis(rawText);

  // Fallback: raw text display
  if (!analysis) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="prose-debate whitespace-pre-wrap">{rawText}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Reconstruction */}
      <div className="glass rounded-2xl p-5 border-l-2 border-debate-professor/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-debate-professor/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-debate-professor" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          <span className="text-xs font-medium text-debate-professor uppercase tracking-wide">Argument Reconstruction</span>
        </div>

        {analysis.reconstruction.premises.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Premises</p>
            <ul className="space-y-1.5">
              {analysis.reconstruction.premises.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="text-debate-professor/60 font-mono text-xs mt-1">P{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.reconstruction.conclusion && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Conclusion</p>
            <p className="text-sm text-white font-medium">{analysis.reconstruction.conclusion}</p>
          </div>
        )}

        {analysis.reconstruction.assumptions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Implicit Assumptions</p>
            <ul className="space-y-1">
              {analysis.reconstruction.assumptions.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <span className="text-amber-400/60 font-mono text-xs mt-1">A{i + 1}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        {analysis.strengths && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Strengths</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{analysis.strengths}</p>
          </div>
        )}

        {analysis.weaknesses && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Weaknesses</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{analysis.weaknesses}</p>
          </div>
        )}
      </div>

      {/* Fallacies */}
      {analysis.fallacies && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Fallacies Detected</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{analysis.fallacies}</p>
        </div>
      )}

      {/* Structural Assessment & Verdict */}
      <div className="grid sm:grid-cols-2 gap-4">
        {analysis.structural && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-debate-professor" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-debate-professor">Structural Assessment</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{analysis.structural}</p>
          </div>
        )}

        <div className="glass rounded-2xl p-5 space-y-4">
          {/* Confidence verdict */}
          {analysis.verdict.confidence && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Epistemic Verdict</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(analysis.verdict.confidence)}`}>
                Confidence: {analysis.verdict.confidence}
              </span>
            </div>
          )}

          {analysis.verdict.improvement && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Key Improvement</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{analysis.verdict.improvement}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Reading */}
      {analysis.reading && (
        <div className="glass rounded-2xl p-5 bg-debate-professor/5 border border-debate-professor/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-debate-professor" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-debate-professor/70">Recommended Reading</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{analysis.reading}</p>
        </div>
      )}
    </div>
  );
}
