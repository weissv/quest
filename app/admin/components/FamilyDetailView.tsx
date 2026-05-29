'use client';

import React, { useState } from 'react';
import { FamilyProfile, EvaluationResult, Question } from '@/types';
import {
  Cpu, Target, BarChart, AlertTriangle, ArrowLeft,
  RefreshCw, GitCompare, CheckCircle2, XCircle, Scale, Users, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface FamilyDetailViewProps {
  family: FamilyProfile;
  questions: Question[];
  onBack: () => void;
  onRefreshResults: () => void;
}

/* ─── Helpers ─── */
function getRoleLabel(result: EvaluationResult): string {
  const role = (result as any).parentRole || result.answers['0.3'];
  if (role === 'MAMA') return 'Мама';
  if (role === 'PAPA') return 'Папа';
  if (role === 'GUARDIAN') return 'Опекун';
  return role ? String(role) : 'Родитель';
}

/** Parse C1 answer into { school, family, child } regardless of format */
function parseC1(raw: any): { school: number; family: number; child: number } | null {
  if (!raw) return null;

  // Object format: { school: X, family: Y, child: Z }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const s = Number(raw.school ?? 0);
    const f = Number(raw.family ?? 0);
    const c = Number(raw.child ?? 0);
    if (s + f + c > 0) return { school: s, family: f, child: c };
  }

  // Array format: [school, family, child]
  if (Array.isArray(raw) && raw.length >= 3) {
    const s = parseInt(String(raw[0]), 10) || 0;
    const f = parseInt(String(raw[1]), 10) || 0;
    const c = parseInt(String(raw[2]), 10) || 0;
    if (s + f + c > 0) return { school: s, family: f, child: c };
  }

  // String that might be JSON
  if (typeof raw === 'string') {
    try {
      return parseC1(JSON.parse(raw));
    } catch { /* ignore */ }
  }

  return null;
}

/** Format any answer value into a readable string */
function formatAnswerValue(raw: any, question?: Question): string {
  if (raw === undefined || raw === null || raw === '') return '—';

  // MATRIX / object format  →  human readable
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.school !== undefined) {
      return `Школа: ${raw.school}%  ·  Семья: ${raw.family}%  ·  Ребёнок: ${raw.child}%`;
    }
    return JSON.stringify(raw);
  }

  // SJT index → option label
  if (question?.options && typeof raw === 'number') {
    const opt = (question.options as any)[raw];
    return opt?.label || String(raw);
  }

  // Array → join
  if (Array.isArray(raw)) {
    const opts = question?.options as string[] | undefined;
    if (opts) {
      return raw.map((v: any, i: number) => `${opts[i] || `#${i}`}: ${v}%`).join('  ·  ');
    }
    return raw.join(', ');
  }

  return String(raw);
}

/* ─── SJT Comparison helper ─── */
interface SjtDiffItem {
  code: string;
  text: string;
  answers: { role: string; optionLabel: string; weight: number | null }[];
  hasMismatch: boolean;
}

function buildSjtDiff(results: EvaluationResult[], questions: Question[]): SjtDiffItem[] {
  const sjtQs = questions.filter(q => q.type === 'SJT');
  return sjtQs.map(q => {
    const answers = results.map(r => {
      const raw = r.answers[q.code || ''];
      const opts = q.options as Array<{ label: string; weight?: number }> | undefined;
      const opt = (opts && raw !== undefined) ? opts[Number(raw)] : undefined;
      return {
        role: getRoleLabel(r),
        optionLabel: opt?.label ?? (raw !== undefined ? String(raw) : '—'),
        weight: opt?.weight ?? null,
      };
    });

    const weights = answers.map(a => a.weight).filter(w => w !== null);
    const hasMismatch = weights.length >= 2 && Math.max(...(weights as number[])) - Math.min(...(weights as number[])) > 0;

    return { code: q.code || q.id, text: q.text, answers, hasMismatch };
  });
}

/* ────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────── */
export default function FamilyDetailView({ family, questions, onBack, onRefreshResults }: FamilyDetailViewProps) {
  if (!family) return null;

  const results = family.results;

  // Collect all unique answer keys for the Answers section
  const answerKeys = new Set<string>();
  results.forEach(result => {
    Object.keys(result.answers || {}).forEach(k => answerKeys.add(k));
  });
  const sortedKeys = Array.from(answerKeys).sort();

  // SJT comparison data
  const sjtDiff = buildSjtDiff(results, questions);

  return (
    <div className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col h-full w-full animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1313]/90 backdrop-blur-md border-b border-white/[0.08] px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">К доске</span>
          </button>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Семья <span className="text-violet-400 bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/20">{family.code}</span>
            </h2>
            <p className="text-sm text-white/50 mt-1">
              {family.results.length} анкет(а) · Обновлено {format(family.updatedAt, 'dd.MM HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">

          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Ср. SJT балл</p>
              <p className="text-3xl font-black text-white/90">{family.sjtAverage.toFixed(1)}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Ср. AI балл</p>
              <p className="text-3xl font-black text-white/90">{family.aiAverage.toFixed(1)}</p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-violet-400/60 uppercase tracking-wider mb-1">Итоговый рейтинг</p>
              <p className="text-3xl font-black text-violet-400">{family.totalScore.toFixed(1)}</p>
            </div>
          </div>

          {/* ── Behavioral Flags ── */}
          {family.behavioralFlags && family.behavioralFlags.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Поведенческие Флаги
              </h3>
              <div className="flex flex-wrap gap-2">
                {family.behavioralFlags.map((flag, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Verdicts ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> Вердикты ИИ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, idx) => (
                <AIResultPanel
                  key={result.id}
                  result={result}
                  label={`Анкета ${idx + 1} (${getRoleLabel(result)})`}
                  onRefresh={onRefreshResults}
                />
              ))}
            </div>
          </div>

          {/* ── Block C Responsibility Chart ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Распределение ответственности (Блок C)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, idx) => (
                <ResponsibilityChart
                  key={result.id}
                  result={result}
                  label={`Анкета ${idx + 1} (${getRoleLabel(result)})`}
                />
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              БЛОК «СРАВНЕНИЕ»
          ══════════════════════════════════════════ */}
          <ComparisonBlock
            results={results}
            questions={questions}
            sjtDiff={sjtDiff}
          />

          {/* ══════════════════════════════════════════
              БЛОК «ОТВЕТЫ»  (бывший "Сравнение ответов")
          ══════════════════════════════════════════ */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Target className="w-5 h-5" /> Ответы
            </h3>

            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden shadow-xl">
              {sortedKeys.map((key, idx) => {
                const question = questions.find(q => q.code === key);
                const questionText = question ? question.text : `Неизвестный вопрос (Код: ${key})`;

                return (
                  <div key={key} className={`flex flex-col md:flex-row border-b border-white/[0.05] last:border-b-0 ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                    <div className="md:w-1/3 p-6 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.05]">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/50 uppercase tracking-wider mb-2">
                        Блок {question?.block || '?'} • Код {key}
                      </span>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">{questionText}</p>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
                      {results.map((result, rIdx) => {
                        const raw = result.answers[key];
                        const val = formatAnswerValue(raw, question);

                        return (
                          <div key={result.id} className="flex-1 p-6">
                            <p className="text-[10px] font-bold text-violet-400 mb-2 uppercase tracking-wider">
                              Анкета {rIdx + 1} ({getRoleLabel(result)})
                            </p>
                            <p className="text-sm text-white/70 leading-relaxed">{val}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   COMPARISON BLOCK COMPONENT
════════════════════════════════════════════════ */
function ComparisonBlock({
  results,
  questions,
  sjtDiff,
}: {
  results: EvaluationResult[];
  questions: Question[];
  sjtDiff: SjtDiffItem[];
}) {
  const [dyadAnalysis, setDyadAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dyadError, setDyadError] = useState<string | null>(null);

  const handleDyadCompare = async () => {
    setIsAnalyzing(true);
    setDyadError(null);
    try {
      const res = await fetch('/api/dyad-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultIds: results.map(r => r.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
      setDyadAnalysis(data.analysis);
    } catch (e: any) {
      setDyadError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const matchCount = sjtDiff.filter(d => !d.hasMismatch && d.answers.length > 1).length;
  const mismatchCount = sjtDiff.filter(d => d.hasMismatch).length;

  // Only show SJT comparison if there are 2+ results
  const showSjt = results.length >= 2;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
        <GitCompare className="w-5 h-5" /> Сравнение
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: SJT Matches & Mismatches ── */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">Закрытые тесты (SJT)</span>
            </div>
            {showSjt && (
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {matchCount} совпад.
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {mismatchCount} расх.
                </span>
              </div>
            )}
          </div>

          {!showSjt ? (
            <div className="p-8 text-center text-white/30 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Нужны анкеты обоих родителей для сравнения
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto custom-scrollbar">
              {sjtDiff.map((item) => (
                <div key={item.code} className={`px-5 py-4 ${item.hasMismatch ? 'bg-rose-500/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.hasMismatch
                        ? <XCircle className="w-4 h-4 text-rose-400" />
                        : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase tracking-wider">{item.code}</span>
                        {item.hasMismatch && (
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Расхождение</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed mb-2 line-clamp-2">{item.text}</p>
                      <div className="space-y-1.5">
                        {item.answers.map((ans, i) => {
                          const weightColor =
                            ans.weight === 2 ? 'text-emerald-400' :
                            ans.weight === 0 ? 'text-rose-400' :
                            'text-amber-400';
                          return (
                            <div key={i} className="flex items-start gap-2">
                              <span className={`text-[10px] font-black w-10 flex-shrink-0 uppercase ${weightColor}`}>
                                {ans.role}
                              </span>
                              <span className="text-[10px] text-white/50 leading-relaxed">{ans.optionLabel}</span>
                              {ans.weight !== null && (
                                <span className={`ml-auto text-[10px] font-black flex-shrink-0 ${weightColor}`}>
                                  {ans.weight}б
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: AI Dyad Analysis (Open questions B + C) ── */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">ИИ-анализ открытых ответов (B + C)</span>
            </div>
            <button
              onClick={handleDyadCompare}
              disabled={isAnalyzing || results.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all text-xs font-bold text-violet-300 border border-violet-500/20 hover:border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              {isAnalyzing ? 'Анализирую...' : dyadAnalysis ? 'Обновить' : 'Запустить ИИ'}
            </button>
          </div>

          <div className="flex-1 p-6">
            {dyadError && (
              <div className="mb-4 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                Ошибка: {dyadError}
              </div>
            )}

            {!dyadAnalysis && !dyadError && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-40 text-center text-white/25">
                <Sparkles className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs uppercase tracking-wider font-bold">Нет анализа</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {results.length < 2
                    ? 'Нужны анкеты обоих родителей'
                    : 'Нажмите «Запустить ИИ» для сравнения открытых ответов'}
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-40 text-center text-white/40">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin mb-3" />
                <p className="text-xs">ИИ сравнивает ответы...</p>
              </div>
            )}

            {dyadAnalysis && !isAnalyzing && (
              <div className="space-y-4">
                {/* Dyad Score */}
                <div className="flex items-center justify-between p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Совместимость диады</span>
                  <span className="text-2xl font-black text-violet-400">{dyadAnalysis.dyadScore ?? '—'}<span className="text-sm text-violet-400/60">/10</span></span>
                </div>

                {/* Summary */}
                {dyadAnalysis.summary && (
                  <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Вывод</p>
                    <p className="text-sm text-white/75 leading-relaxed">{dyadAnalysis.summary}</p>
                  </div>
                )}

                {/* Agreements */}
                {dyadAnalysis.agreements?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Согласие ({dyadAnalysis.agreements.length})
                    </p>
                    <ul className="space-y-1.5">
                      {dyadAnalysis.agreements.map((a: string, i: number) => (
                        <li key={i} className="text-xs text-white/60 leading-relaxed flex gap-2">
                          <span className="text-emerald-500/50 flex-shrink-0">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conflicts */}
                {dyadAnalysis.conflicts?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Расхождения ({dyadAnalysis.conflicts.length})
                    </p>
                    <ul className="space-y-1.5">
                      {dyadAnalysis.conflicts.map((c: string, i: number) => (
                        <li key={i} className="text-xs text-white/60 leading-relaxed flex gap-2">
                          <span className="text-amber-500/50 flex-shrink-0">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {dyadAnalysis.redFlags?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Красные флаги ({dyadAnalysis.redFlags.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dyadAnalysis.redFlags.map((f: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   AI RESULT PANEL
════════════════════════════════════════════════ */
function AIResultPanel({ result, label, onRefresh }: { result: EvaluationResult; label: string; onRefresh: () => void }) {
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    setLocalError(null);
    try {
      const res = await fetch('/api/re-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId: result.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
      onRefresh();
    } catch (error: any) {
      setLocalError(error.message || 'Неизвестная ошибка');
    } finally {
      setIsReevaluating(false);
    }
  };

  const ai = result.aiAnalysis;
  const aiReasoning = ai?.reasoning || ai?.comment;
  const hasAI = ai && aiReasoning && !ai.error;
  const hasError = ai && ai.error;

  const scoreColor = (val: number) => {
    if (val === 2) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val === 1) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border p-5 gap-3 ${
      hasError
        ? 'bg-amber-500/5 border-amber-500/15'
        : hasAI
          ? (ai.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10')
          : 'bg-white/[0.02] border-white/[0.05]'
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
          {label}
          {hasAI && <span className={`ml-2 ${ai.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
            • {ai.status === 'approved' ? '✓ Одобрено' : '✗ Отказ'}
          </span>}
          {hasError && <span className="ml-2 text-amber-400">• ⚠ Ошибка ИИ</span>}
          {!hasAI && !hasError && <span className="ml-2 text-white/30">• Ожидает анализа</span>}
        </p>
        <button
          onClick={handleReevaluate}
          disabled={isReevaluating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all text-xs font-bold text-violet-300 border border-violet-500/20 hover:border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
          {isReevaluating ? 'Анализирую...' : 'Повторить Анализ'}
        </button>
      </div>

      {localError && (
        <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
          Ошибка: {localError}
        </div>
      )}

      {!hasAI && !hasError && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 min-h-[100px]">
          <Cpu className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs uppercase tracking-wider font-bold">Нет данных ИИ</p>
          <p className="text-[10px] mt-1 opacity-60">Нажмите &quot;Повторить Анализ&quot;</p>
        </div>
      )}

      {hasError && (
        <div className="flex-1">
          <p className="text-xs text-amber-400/80 italic">{aiReasoning}</p>
          <p className="text-[10px] text-white/30 mt-2">Нажмите &quot;Повторить Анализ&quot; для новой попытки</p>
        </div>
      )}

      {hasAI && (
        <>
          <p className="text-sm text-white/75 leading-relaxed flex-1">{aiReasoning}</p>
          {ai.scores && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.05]">
              {Object.entries(ai.scores).map(([k, v]) => (
                <span key={k} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${scoreColor(Number(v))}`}>
                  {k}: {String(v)}/2
                </span>
              ))}
              {ai.total_score !== undefined && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white/60 ml-auto">
                  Итого: <strong className="text-white/90">{ai.total_score}</strong>
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   RESPONSIBILITY CHART  (Block C)
════════════════════════════════════════════════ */
function ResponsibilityChart({ result, label }: { result: EvaluationResult; label: string }) {
  const parsed = parseC1(result.answers['C1']);

  if (!parsed) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center text-white/30 text-xs py-10">
        Нет данных для Блока C
      </div>
    );
  }

  const { school, family, child } = parsed;
  const total = school + family + child || 1; // prevent div by 0

  const schoolPct = Math.round((school / total) * 100);
  const familyPct = Math.round((family / total) * 100);
  const childPct = Math.round((child / total) * 100);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-4">{label}</p>

      {/* Stacked bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex mb-3">
        <div style={{ width: `${familyPct}%` }} className="bg-violet-500 transition-all" title={`Семья: ${family}%`} />
        <div style={{ width: `${schoolPct}%` }} className="bg-teal-500 transition-all" title={`Школа: ${school}%`} />
        <div style={{ width: `${childPct}%` }} className="bg-amber-500 transition-all" title={`Ребенок: ${child}%`} />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs mt-2">
        <div className="flex items-center gap-1.5 text-white/60 font-medium">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Семья {family}%
        </div>
        <div className="flex items-center gap-1.5 text-white/60 font-medium">
          <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Школа {school}%
        </div>
        <div className={`flex items-center gap-1.5 font-medium ${child < 40 ? 'text-rose-400' : 'text-white/60'}`}>
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          Ребёнок {child}%
          {child < 40 && <span className="text-rose-400 ml-1">⚠</span>}
        </div>
      </div>

      {/* Risk hint */}
      {child < 40 && (
        <p className="text-[10px] text-rose-400/70 mt-2">
          Ребёнку отведено менее 40% — возможный маркер гиперопеки
        </p>
      )}
    </div>
  );
}
