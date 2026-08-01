import { useState } from 'react';
import CounterArgument from './CounterArgument';
import ProfessorNote from './ProfessorNote';

type ViewMode = 'debater' | 'both' | 'professor';

interface Props {
  debater: string;
  professor: string;
}

const MODES: { id: ViewMode; label: string }[] = [
  { id: 'debater', label: 'Counterargument' },
  { id: 'both', label: 'Both' },
  { id: 'professor', label: 'Logic review' },
];

export default function DebateView({ debater, professor }: Props) {
  const [mode, setMode] = useState<ViewMode>('both');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-[13px]">
        {MODES.map((m, i) => (
          <span key={m.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode(m.id)}
              aria-current={mode === m.id ? 'true' : undefined}
              className="hover:opacity-100 transition-opacity"
              style={{ color: mode === m.id ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
            >
              {mode === m.id ? '▸' : ' '} {m.label}
            </button>
            {i < MODES.length - 1 && <span style={{ color: 'rgb(var(--text-muted))' }}>·</span>}
          </span>
        ))}
      </div>

      {mode === 'debater' && <CounterArgument rawText={debater} />}
      {mode === 'professor' && <ProfessorNote rawText={professor} />}
      {mode === 'both' && (
        <div className="space-y-10">
          <CounterArgument rawText={debater} />
          <hr />
          <ProfessorNote rawText={professor} />
        </div>
      )}
    </div>
  );
}
