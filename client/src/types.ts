export interface DebateResult {
  originalLength: number;
  debater: string;
  professor: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  result: DebateResult;
}

export interface CounterArgument {
  id: string;
  title: string;
  claim: string;
  evidence: string;
  impact: string;
}

export interface ProfessorAnalysis {
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

export type AppState = 'idle' | 'loading' | 'results' | 'error';
