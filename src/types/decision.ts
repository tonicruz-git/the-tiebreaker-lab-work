export interface ProConItem {
  id: string;
  type: 'pro' | 'con';
  title: string;
  description: string;
  score: number; // 1 to 5 (positive for pro, negative for con magnitude)
  category: string; // e.g., 'Financial', 'Time', 'Risk', 'Wellbeing', 'Strategic'
  isDealbreaker?: boolean;
  isUnderrated?: boolean;
  author?: string; // for collaborative user additions
  upvotes?: number;
}

export interface OptionAnalysis {
  id: string;
  title: string;
  summary: string;
  pros: ProConItem[];
  cons: ProConItem[];
  netScore: number;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface CriteriaScore {
  criteriaName: string;
  description: string;
  weight: number; // 1 to 5
  scores: Record<string, number>; // optionId -> score (1 to 10)
}

export interface TiebreakerVerdict {
  winnerOptionId: string;
  winnerTitle: string;
  confidenceScore: number; // 0 - 100
  oneLineVerdict: string;
  executiveSummary: string;
  decisionRule: {
    chooseWinnerIf: string;
    chooseAlternativeIf: string;
  };
  blindSpots: string[];
  cognitiveBiasesToWatch: string[];
  immediateNextStep: string;
}

export interface DecisionData {
  id: string;
  dilemma: string;
  context?: string;
  createdAt: number;
  options: {
    id: string;
    title: string;
    description?: string;
  }[];
  analyses: OptionAnalysis[];
  criteriaMatrix: CriteriaScore[];
  tiebreakerVerdict: TiebreakerVerdict;
  devilsAdvocateCritique?: string;
}

export interface ParticipantVote {
  participantId: string;
  participantName: string;
  votedAt: number;
  mode: 'ranked' | 'points' | 'approval';
  // for ranked: array of optionIds in order of preference
  ranking?: string[];
  // for points: optionId -> points allocated (e.g. 0-100 sum)
  points?: Record<string, number>;
  // for approval: optionId -> 'approve' | 'neutral' | 'reject'
  approval?: Record<string, 'approve' | 'neutral' | 'reject'>;
  comment?: string;
}

export interface CollaborativeRoom {
  id: string;
  code: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  hostName: string;
  decisionData: DecisionData;
  votes: ParticipantVote[];
  status: 'active' | 'closed';
  customArguments: ProConItem[];
  tiebreakerResult?: {
    resolvedAt: number;
    verdict: string;
    rationale: string;
    compromiseSolution?: string;
  };
}
