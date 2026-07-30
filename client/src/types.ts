export interface DebateResult {
  originalLength: number;
  debater: string;
  professor: string;
}

export interface DebateScore {
  total: number;
  counterCount: number;
  confidence: string;
  hasFallacies: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  customName?: string;
  result: DebateResult;
  score: DebateScore;
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
