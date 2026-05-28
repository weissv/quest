import { create } from 'zustand';
import { FormState, EvaluationResult, ParentRole, Question } from '@/types';

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

  setAnswer: (questionId, answer) => {
    const newAnswers = { ...get().answers, [questionId]: answer };
    const questions = get().questions;

    // Recalculate SJT score on every Block A answer change
    let sjtScore = 0;
    questions.forEach((q) => {
      if (q.block === 'A' && q.options) {
        const selected = q.options.find((opt) => opt.label === newAnswers[q.id]);
        if (selected && typeof selected.weight === 'number') {
          sjtScore += selected.weight;
        }
      }
    });

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
