'use client';

import React, { useEffect, useRef } from 'react';
import { useFormStore } from '@/store/useFormStore';
import { Question } from '@/types';
import ProgressBar from './ProgressBar';
import BlockHeader from './BlockHeader';
import QuestionCard from './QuestionCard';
import ResultScreen from './ResultScreen';

export default function Wizard() {
  const {
    questions,
    isLoadingQuestions,
    fetchQuestions,
    answers,
    currentStepIndex,
    sjtScore,
    isSubmitting,
    submissionResult,
    error,
    setAnswer,
    nextStep,
    prevStep,
    reset,
    submitAnswers,
  } = useFormStore() as any; // Cast to any to avoid type errors since we extended it in JS

  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  // ── Dynamic question filtering logic ──
  const getFilteredQuestions = (answers: Record<string, string>, allQuestions: Question[]): Question[] => {
    const blockAQuestions = allQuestions.filter((q) => q.block === 'A');
    const isBlockAComplete = blockAQuestions.every((q) => answers[q.id]);

    let skipBlockB = false;
    if (isBlockAComplete) {
      if (sjtScore >= 9 || sjtScore < 5) {
        skipBlockB = true;
      }
    }

    return allQuestions.filter((q) => {
      if (q.block === 'B' && skipBlockB) return false;

      if (q.dependsOn) {
        const parentValue = answers[q.dependsOn.questionId];
        if (Array.isArray(q.dependsOn.value)) {
          return q.dependsOn.value.includes(parentValue);
        }
        return parentValue === q.dependsOn.value;
      }

      return true;
    });
  };

  const filteredQuestions = getFilteredQuestions(answers, questions);
  const currentQuestion = filteredQuestions[currentStepIndex];
  const isLastQuestion = currentStepIndex === filteredQuestions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const canProceed = currentAnswer.trim().length > 0;
  const progress = filteredQuestions.length > 0 ? Math.round(
    ((currentStepIndex + 1) / filteredQuestions.length) * 100
  ) : 0;

  const prevQuestion =
    currentStepIndex > 0 ? filteredQuestions[currentStepIndex - 1] : null;
  const isNewBlock = prevQuestion
    ? prevQuestion.block !== currentQuestion?.block
    : true;

  const handleAnswer = (questionId: string, val: string) => {
    setAnswer(questionId, val);

    // Auto-advance for radio buttons
    if (currentQuestion.type === 'radio' && !isLastQuestion) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        nextStep();
      }, 500); // 500ms delay for visual feedback
    }
  };

  if (isLoadingQuestions) {
    return (
      <div className="glass-card-elevated p-6 md:p-10 flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-plum border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-foreground-secondary">Загрузка вопросов...</p>
        </div>
      </div>
    );
  }

  if (submissionResult) {
    return (
      <ResultScreen
        result={submissionResult}
        sjtScore={sjtScore}
        onReset={reset}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="glass-card-elevated p-6 md:p-10">
      <ProgressBar
        currentBlock={currentQuestion.block}
        progress={progress}
        currentStep={currentStepIndex + 1}
        totalSteps={filteredQuestions.length}
      />

      {isNewBlock && (
        <BlockHeader block={currentQuestion.block} showTransition />
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-foreground-tertiary/20 to-transparent mb-8" />

      <div className="min-h-[260px]" key={currentQuestion.id}>
        <QuestionCard
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
        />
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-plum-muted border border-plum/20 animate-fade-in">
          <p className="text-sm text-plum-light">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-foreground-tertiary/10">
        <button
          onClick={() => {
            if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
            prevStep();
          }}
          disabled={currentStepIndex === 0 || isSubmitting}
          className="btn-ghost"
        >
          ← Назад
        </button>

        {isLastQuestion ? (
          <button
            onClick={() => {
               if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
               submitAnswers();
            }}
            disabled={!canProceed || isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Анализ...
              </span>
            ) : (
              'Завершить →'
            )}
          </button>
        ) : (
          <button
            onClick={() => {
               if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
               nextStep();
            }}
            disabled={!canProceed}
            className="btn-primary"
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
