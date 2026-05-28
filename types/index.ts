/* ──────────────────────────────────────────────
 *  Type definitions for the Survey Funnel V3.0
 * ────────────────────────────────────────────── */

export type CohortType = 'GRADE_1_4' | 'GRADE_5_8';
export type ParentRole = 'MAMA' | 'PAPA' | 'OTHER';
export type EvaluationStatus = 'APPROVED' | 'REJECTED' | 'GREY_ZONE' | 'PENDING' | 'REVIEW' | 'INTERVIEW';
export type PipelineStatus = 'pending' | 'review' | 'interview' | 'approved' | 'rejected';

export type QuestionType = 'TEXT' | 'SELECT' | 'SJT' | 'OPEN' | 'MATRIX';
export type BlockType = '0' | 'A' | 'B' | 'C' | 'D';

export interface BlockMeta {
  id: BlockType;
  title: string;
  subtitle: string;
  icon: string;
}

export interface Option {
  label: string;
  weight?: number;
  value?: string;
}

export interface Question {
  id: string;
  code?: string;
  cohort?: CohortType | null;
  block: string;
  type: QuestionType | string;
  text: string;
  options?: Option[] | string[];
  dependsOn?: any;
  mirrorText?: string;
  position?: any;
}

// ── API types ───────────────────────────────────

export interface AIVerdict {
  scores?: Record<string, number>;
  total_score?: number;
  reasoning?: string;
  status?: PipelineStatus | string;
  error?: string;
  matrix_anomaly?: boolean;
}

export interface EvaluationResult {
  id: string;
  answers: Record<string, any>;
  sjtScore: number;
  status: PipelineStatus | string;
  aiAnalysis: AIVerdict | null;
  createdAt?: string | Date;
  dyadMetrics?: any;
  behavioralFlags?: string[];
}

export interface FamilyProfile {
  code: string;
  status: PipelineStatus;
  results: EvaluationResult[];
  sjtAverage: number;
  aiAverage: number;
  totalScore: number;
  behavioralFlags: string[];
  updatedAt: number;
}

// ── Store types ─────────────────────────────────

export interface FormState {
  answers: Record<string, any>;
  currentStepIndex: number;
  sjtScore: number;
  parentRole: ParentRole | null;
  cohort: CohortType | null;
  isSubmitting: boolean;
  submissionResult: EvaluationResult | null;
  error: string | null;

  // Actions
  setCohort: (cohort: CohortType) => void;
  setAnswer: (questionId: string, answer: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  submitAnswers: () => Promise<void>;
}
