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

    const premSection = text.match(/##\s*ARGUMENT\s*RECONSTRUCTION[\s\S]*?\*\*Premises identified:\*\*([\s\S]*?)(?=\*\*Conclusion|\*\*Implicit)/i);
    if (premSection) {
      const lines = premSection[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
      lines.forEach((l) => {
        const cleaned = l.replace(/^[\s\-•\d.]*\s*/, '').trim();
        if (cleaned) premises.push(cleaned);
      });
    }

    let conclusion = '';
    const concMatch = text.match(/\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*Implicit|\n\*|$)/i);
    if (concMatch) conclusion = concMatch[1].trim();

    const assumSection = text.match(/\*\*Implicit assumptions:\*\*([\s\S]*?)(?=##\s*LOGICAL)/i);
    if (assumSection) {
      const lines = assumSection[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
      lines.forEach((l) => {
        const cleaned = l.replace(/^[\s\-•\d.]*\s*/, '').trim();
        if (cleaned) assumptions.push(cleaned);
      });
    }

    let strengths = '';
    const strMatch = text.match(/###\s*Strengths\s*\n([\s\S]*?)(?=###\s*Weaknesses)/i);
    if (strMatch) strengths = strMatch[1].trim();

    let weaknesses = '';
    const weakMatch = text.match(/###\s*Weaknesses\s*\n([\s\S]*?)(?=###\s*Fallacies)/i);
    if (weakMatch) weaknesses = weakMatch[1].trim();

    let fallacies = '';
    const fallMatch = text.match(/###\s*Fallacies\s*Detected\s*\n([\s\S]*?)(?=###\s*Structural)/i);
    if (fallMatch) fallacies = fallMatch[1].trim();

    let structural = '';
    const structMatch = text.match(/###\s*Structural\s*Assessment\s*\n([\s\S]*?)(?=##\s*EPISTEMIC)/i);
    if (structMatch) structural = structMatch[1].trim();

    let confidence = '';
    let improvement = '';
    const confMatch = text.match(/\*\*Confidence level:\*\*\s*(.*?)(?=\n|$)/i);
    if (confMatch) confidence = confMatch[1].trim();
    const imprMatch = text.match(/\*\*Key improvement:\*\*\s*([\s\S]*?)(?=##\s*RECOMMENDED|$)/i);
    if (imprMatch) improvement = imprMatch[1].trim();

    let reading = '';
    const readMatch = text.match(/##\s*RECOMMENDED\s*READING\s*\n([\s\S]*?)$/i);
    if (readMatch) reading = readMatch[1].trim();

    if (!premises.length && !conclusion && !assumptions.length && !strengths && !weaknesses && !fallacies && !structural && !confidence && !improvement && !reading) {
      return null;
    }

    return {
      reconstruction: { premises, conclusion, assumptions },
      strengths, weaknesses, fallacies, structural,
      verdict: { confidence, improvement },
      reading,
    };
  } catch {
    return null;
  }
}

export default function ProfessorNote({ rawText }: Props) {
  const analysis = parseProfessorAnalysis(rawText);

  if (!analysis) {
    return (
      <section className="space-y-2">
        <h3 className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
          Logic review
        </h3>
        <div className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(var(--text))' }}>
          {rawText}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
        Logic review
      </h3>

      {/* Reconstruction */}
      <div className="space-y-3">
        {analysis.reconstruction.premises.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
              Premises
            </div>
            <ul className="space-y-1.5">
              {analysis.reconstruction.premises.map((p, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                  <span className="font-mono text-[12px] shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>P{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.reconstruction.conclusion && (
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
              Conclusion
            </div>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text))' }}>{analysis.reconstruction.conclusion}</p>
          </div>
        )}

        {analysis.reconstruction.assumptions.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
              Implicit assumptions
            </div>
            <ul className="space-y-1.5">
              {analysis.reconstruction.assumptions.map((a, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                  <span className="font-mono text-[12px] shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>A{i + 1}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Strengths / Weaknesses */}
      {(analysis.strengths || analysis.weaknesses) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.strengths && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Strengths
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.strengths}</p>
            </div>
          )}
          {analysis.weaknesses && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Weaknesses
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.weaknesses}</p>
            </div>
          )}
        </div>
      )}

      {/* Fallacies / Structural */}
      {(analysis.fallacies || analysis.structural) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.fallacies && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Fallacies
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.fallacies}</p>
            </div>
          )}
          {analysis.structural && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Structural
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.structural}</p>
            </div>
          )}
        </div>
      )}

      {/* Verdict */}
      {(analysis.verdict.confidence || analysis.verdict.improvement) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.verdict.confidence && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Confidence
              </div>
              <p className="text-[14px]" style={{ color: 'rgb(var(--text))' }}>{analysis.verdict.confidence}</p>
            </div>
          )}
          {analysis.verdict.improvement && (
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                Key improvement
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.verdict.improvement}</p>
            </div>
          )}
        </div>
      )}

      {/* Reading */}
      {analysis.reading && (
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
            Recommended reading
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{analysis.reading}</p>
        </div>
      )}
    </section>
  );
}
