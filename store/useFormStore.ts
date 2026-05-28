import { create } from 'zustand';
import { FormState, EvaluationResult, ParentRole, CohortType, Question } from '@/types';

// Extend FormState to include questions
interface ExtendedFormState extends FormState {
  questions: Question[];
  isLoadingQuestions: boolean;
  fetchQuestions: () => Promise<void>;
}

export const useFormStore = create<ExtendedFormState>((set, get) => ({
  questions: [],
  isLoadingQuestions: true,
  answers: {},
  currentStepIndex: 0,
  sjtScore: 0,
  parentRole: null,
  cohort: null,
  isSubmitting: false,
  submissionResult: null,
  error: null,

  fetchQuestions: async () => {
    try {
      const res = await fetch('/api/questions');
      const questions = await res.json();
      set({ questions, isLoadingQuestions: false });
    } catch (error) {
      console.error('Failed to fetch questions', error);
      set({ isLoadingQuestions: false });
    }
  },

  setCohort: (cohort: CohortType) => set((state) => ({
    cohort,
    answers: Object.keys(state.answers)
      .filter(key => !key.startsWith('A')) // Clear old SJT answers when cohort changes
      .reduce((obj, key) => ({ ...obj, [key]: state.answers[key] }), {})
  })),

  setAnswer: (questionCode, answer) => {
    const newAnswers = { ...get().answers, [questionCode]: answer };
    const questions = get().questions;

    // Recalculate SJT score on every Block A answer change
    let sjtScore = 0;
    questions.forEach((q) => {
      if (q.block === 'A' && q.options) {
        const selectedIndex = newAnswers[q.code || ''];
        if (typeof selectedIndex === 'number' && Array.isArray(q.options)) {
          const opt = q.options[selectedIndex] as any;
          if (opt && typeof opt.weight === 'number') {
            sjtScore += opt.weight;
          }
        }
      }
    });

    let parentRole = get().parentRole;
    let cohort = get().cohort;

    if (questionCode === '0.2') cohort = answer as CohortType;
    if (questionCode === '0.3') parentRole = answer as ParentRole;

    set({
      answers: newAnswers,
      sjtScore,
      parentRole,
      cohort
    });
  },

  nextStep: () =>
    set((state) => ({
      currentStepIndex: state.currentStepIndex + 1,
    })),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    })),

  reset: () =>
    set({
      answers: {},
      currentStepIndex: 0,
      sjtScore: 0,
      parentRole: null,
      cohort: null,
      isSubmitting: false,
      submissionResult: null,
      error: null,
    }),

  submitAnswers: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const state = get();
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          familyCode: state.answers['0.1'],
          parentRole: state.parentRole,
          cohort: state.cohort,
          answers: state.answers 
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      set({ submissionResult: data.result as EvaluationResult, isSubmitting: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка при отправке';
      set({ error: message, isSubmitting: false });
    }
  },
}));
