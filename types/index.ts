/* ──────────────────────────────────────────────
 *  Type definitions for the Survey Funnel V2.0
 * ────────────────────────────────────────────── */

// ── Question types ──────────────────────────────

export type QuestionType = 'text' | 'radio' | 'sliders';
export type BlockType = '0' | 'A' | 'B' | 'C' | 'D';

export interface Option {
  label: string;
  /** SJT weight for Block A options (0 | 1 | 2) */
  weight?: number;
}

export interface Question {
  id: string;
  block: BlockType;
  type: QuestionType;
  text: string;
  options?: Option[];
  /** Role-based dependency — show this question only when parent question matches */
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
  /** Alternative text for the mirror version (Block C — opposite parent) */
  mirrorText?: string;
  /** Position for the visual Blueprint editor */
  position?: { x: number; y: number };
}

// ── Block metadata ──────────────────────────────

export interface BlockMeta {
  id: BlockType;
  title: string;
  subtitle: string;
  icon: string;
}

// ── API types ───────────────────────────────────

export interface AIVerdict {
  scores?: Record<string, number>;
  total_score?: number;
  reasoning?: string;
  status?: string;
  error?: string;
}

export interface EvaluationResult {
  status: string;
  sjtScore: number;
  aiAnalysis: AIVerdict | null;
}

// ── Store types ─────────────────────────────────

export type ParentRole = 'Куратор рутины' | 'Держатель рамки' | 'Равный участник' | null;

export interface FormState {
  answers: Record<string, string>;
  currentStepIndex: number;
  sjtScore: number;
  parentRole: ParentRole;
  isSubmitting: boolean;
  submissionResult: EvaluationResult | null;
  error: string | null;

  // Actions
  setAnswer: (questionId: string, answer: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  submitAnswers: () => Promise<void>;
}
