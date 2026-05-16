'use client';

import React from 'react';
import { useFormStore } from '@/store/useFormStore';
import { getFilteredQuestions } from '@/data/questions';
import ProgressBar from './ProgressBar';
import BlockHeader from './BlockHeader';
import QuestionCard from './QuestionCard';
import ResultScreen from './ResultScreen';

export default function Wizard() {
  const {
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
  } = useFormStore();

  const filteredQuestions = getFilteredQuestions(answers);
  const currentQuestion = filteredQuestions[currentStepIndex];
  const isLastQuestion = currentStepIndex === filteredQuestions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const canProceed = currentAnswer.trim().length > 0;
  const progress = Math.round(
    ((currentStepIndex + 1) / filteredQuestions.length) * 100
  );

  // Detect block transitions for header animation
  const prevQuestion =
    currentStepIndex > 0 ? filteredQuestions[currentStepIndex - 1] : null;
  const isNewBlock = prevQuestion
    ? prevQuestion.block !== currentQuestion?.block
    : true;

  // ── Result screen ──
  if (submissionResult) {
    return (
      <ResultScreen
        result={submissionResult}
        sjtScore={sjtScore}
        onReset={reset}
      />
    );
  }

  // ── Guard ──
  if (!currentQuestion) return null;

  return (
    <div className="glass-card-elevated p-6 md:p-10">
      {/* Progress */}
      <ProgressBar
        currentBlock={currentQuestion.block}
        progress={progress}
        currentStep={currentStepIndex + 1}
        totalSteps={filteredQuestions.length}
      />

      {/* Block header (shown on block transitions) */}
      {isNewBlock && (
        <BlockHeader block={currentQuestion.block} showTransition />
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-foreground-tertiary/20 to-transparent mb-8" />

      {/* Question */}
      <div className="min-h-[260px]" key={currentQuestion.id}>
        <QuestionCard
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswer={setAnswer}
        />
      </div>

      {/* SJT live score (visible during Block A) */}
      {currentQuestion.block === 'A' && sjtScore > 0 && (
        <div className="mt-6 flex items-center gap-2 animate-fade-in">
          <span className="text-xs text-foreground-tertiary">
            SJT-балл:
          </span>
          <span className="text-sm font-mono font-semibold text-accent">
            {sjtScore}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-danger/10 border border-danger/20 animate-fade-in">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-foreground-tertiary/10">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0 || isSubmitting}
          className="btn-ghost"
        >
          ← Назад
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitAnswers}
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
            onClick={nextStep}
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
