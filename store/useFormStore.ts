import { create } from 'zustand';
import { FormState, EvaluationResult, ParentRole } from '@/types';
import { calculateCurrentSJT } from '@/data/questions';

export const useFormStore = create<FormState>((set, get) => ({
  answers: {},
  currentStepIndex: 0,
  sjtScore: 0,
  parentRole: null,
  isSubmitting: false,
  submissionResult: null,
  error: null,

  setAnswer: (questionId, answer) => {
    const newAnswers = { ...get().answers, [questionId]: answer };

    // Recalculate SJT score on every Block A answer change
    const sjtScore = calculateCurrentSJT(newAnswers);

    // Track parent role for conditional routing
    const parentRole =
      questionId === '0.4' ? (answer as ParentRole) : get().parentRole;

    set({
      answers: newAnswers,
      sjtScore,
      parentRole,
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
      isSubmitting: false,
      submissionResult: null,
      error: null,
    }),

  submitAnswers: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: get().answers }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: EvaluationResult = await res.json();
      set({ submissionResult: data, isSubmitting: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка при отправке';
      set({ error: message, isSubmitting: false });
    }
  },
}));
