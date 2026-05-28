'use client';

import React from 'react';
import { EvaluationResult } from '@/types';

interface ResultScreenProps {
  result: EvaluationResult;
  sjtScore: number;
  onReset: () => void;
}

export default function ResultScreen({
  result,
  sjtScore,
  onReset,
}: ResultScreenProps) {
  const maxScore = 12; // 6 questions × 2 max
  const scorePercent = Math.round((sjtScore / maxScore) * 100);

  // Determine visual theme
  const isPositive = sjtScore >= 9;
  const isNeutral = sjtScore >= 5 && sjtScore < 9;

  const statusBadgeClass = isPositive
    ? 'badge-success'
    : isNeutral
      ? 'badge-warning'
      : 'badge-danger';

  const scoreBarColor = isPositive
    ? '#57A7B3'
    : isNeutral
      ? '#FCD5A6'
      : '#A04A84';

  return (
    <div className="glass-card-elevated p-8 md:p-10 animate-scale-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-raised mb-4">
          <span className="text-3xl">
            {isPositive ? '✅' : isNeutral ? '🟡' : '❌'}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Спасибо за прохождение!
        </h1>
        <p className="text-foreground-secondary text-sm max-w-md mx-auto mb-4">
          Ваши ответы были отправлены на анализ. Результат будет рассмотрен
          куратором школы.
        </p>
        <div className={`badge ${statusBadgeClass} text-sm`}>
          {result.status}
        </div>
      </div>

      {/* SJT Score visualization — ADMIN-ONLY info, visible only on result screen */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground-secondary">
            Балл SJT (служебная информация)
          </span>
          <span className="text-2xl font-bold text-foreground font-mono">
            {sjtScore}
            <span className="text-sm text-foreground-tertiary font-normal">
              {' '}
              / {maxScore}
            </span>
          </span>
        </div>

        {/* Score bar */}
        <div className="relative h-3 bg-surface rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${scorePercent}%`,
              backgroundColor: scoreBarColor,
            }}
          />
        </div>

        {/* Score interpretation */}
        <div className="flex justify-between mt-3 text-xs text-foreground-tertiary">
          <span>0–4 Не совместимо</span>
          <span>5–8 Верификация</span>
          <span>9–12 Зачисление</span>
        </div>
      </div>

      {/* AI Analysis (if present) */}
      {result.aiAnalysis && !result.aiAnalysis.error && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
            🤖 AI-анализ открытых ответов
          </h3>

          {/* Per-question scores */}
          {result.aiAnalysis.scores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(result.aiAnalysis.scores).map(([key, score]) => (
                <div
                  key={key}
                  className="flex flex-col items-center p-3 rounded-xl bg-surface-raised"
                >
                  <span className="text-xs text-foreground-tertiary font-mono mb-1">
                    {key}
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      score === 2
                        ? 'text-teal-light'
                        : score === 1
                          ? 'text-peach'
                          : 'text-plum-light'
                    }`}
                  >
                    {score}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Risk flags */}
          {result.aiAnalysis.riskFlags && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-plum-muted border border-plum/20 mb-4">
              <span>⚠️</span>
              <span className="text-sm text-plum-light font-medium">
                Обнаружены флаги риска
              </span>
            </div>
          )}

          {/* Recommendation */}
          {result.aiAnalysis.recommendation && (
            <div className="p-4 rounded-xl bg-surface-raised">
              <span className="text-xs text-foreground-tertiary uppercase tracking-wider block mb-1">
                Рекомендация
              </span>
              <span className="text-foreground font-semibold">
                {result.aiAnalysis.recommendation}
              </span>
            </div>
          )}

          {/* Comment */}
          {result.aiAnalysis.comment && (
            <p className="mt-4 text-sm text-foreground-secondary leading-relaxed">
              {result.aiAnalysis.comment}
            </p>
          )}
        </div>
      )}

      {/* AI error */}
      {result.aiAnalysis?.error && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 text-peach">
            <span>⚠️</span>
            <span className="text-sm font-medium">
              {result.aiAnalysis.error}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <button onClick={onReset} className="btn-ghost">
          Пройти заново
        </button>
      </div>
    </div>
  );
}
