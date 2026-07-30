import { useState } from 'react';
import CounterArgument from './CounterArgument';
import ProfessorNote from './ProfessorNote';

interface Props {
  debater: string;
  professor: string;
}

export default function DebateView({ debater, professor }: Props) {
  const [activeTab, setActiveTab] = useState<'debater' | 'professor'>('debater');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Tab switcher */}
      <div className="flex rounded-xl bg-surface-overlay border border-surface-border p-1">
        <button
          onClick={() => setActiveTab('debater')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'debater'
              ? 'bg-debate-oxford/15 text-debate-oxford shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Oxford Union Debater
        </button>
        <button
          onClick={() => setActiveTab('professor')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'professor'
              ? 'bg-debate-professor/15 text-debate-professor shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
          Logic Professor
        </button>
      </div>

      {/* Content */}
      <div className="transition-all duration-300">
        {activeTab === 'debater' ? (
          <CounterArgument rawText={debater} />
        ) : (
          <ProfessorNote rawText={professor} />
        )}
      </div>
    </div>
  );
}
