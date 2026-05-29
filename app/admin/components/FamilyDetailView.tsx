'use client';

import React, { useState } from 'react';
import { FamilyProfile, EvaluationResult, Question } from '@/types';
import { X, Cpu, Target, BarChart, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface FamilyDetailViewProps {
  family: FamilyProfile;
  questions: Question[];
  onBack: () => void;
  onRefreshResults: () => void;
}

export default function FamilyDetailView({ family, questions, onBack, onRefreshResults }: FamilyDetailViewProps) {
  if (!family) return null;

  // We can handle up to N results, but let's focus on mapping them dynamically.
  // Sort them by createdAt or just use the array order.
  const results = family.results;

  // Collect all unique keys from all answers to map them side by side
  const answerKeys = new Set<string>();
  results.forEach(result => {
    Object.keys(result.answers || {}).forEach(k => answerKeys.add(k));
  });
  const sortedKeys = Array.from(answerKeys).sort();

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
          
          {/* Summary Stats */}
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

          {/* Behavioral Flags */}
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

          {/* AI Reasoning */}
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

          {/* Block C Visualizer (Responsibility Matrix) */}
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

          {/* Side-by-side answers */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Target className="w-5 h-5" /> Сравнение ответов
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
                        let val = '—';
                        if (raw !== undefined) {
                          if (typeof raw === 'object') {
                            val = JSON.stringify(raw);
                          } else if (question?.options && typeof raw === 'number') {
                            // Map SJT option index to text
                            const opt = (question.options as any)[raw];
                            val = opt?.label || String(raw);
                          } else {
                            val = String(raw);
                          }
                        }

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

/* ─── Helpers ─── */

function getRoleLabel(result: EvaluationResult): string {
  const role = (result as any).parentRole || result.answers['0.3'];
  if (role === 'MAMA') return 'Мама';
  if (role === 'PAPA') return 'Папа';
  if (role === 'GUARDIAN') return 'Опекун';
  return role ? String(role) : 'Родитель';
}

function AIResultPanel({ result, label, onRefresh }: { result: EvaluationResult; label: string; onRefresh: () => void }) {
  const [isReevaluating, setIsReevaluating] = useState(false);

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const res = await fetch('/api/re-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId: result.id }),
      });
      if (!res.ok) throw new Error('Failed to re-evaluate');
      onRefresh(); // Refresh parent data
    } catch (error) {
      alert('Ошибка при повторном анализе');
    } finally {
      setIsReevaluating(false);
    }
  };

  const ai = result.aiAnalysis;
  const hasAI = ai && ai.reasoning;

  return (
    <div className={`relative flex flex-col rounded-2xl border p-5 ${
      hasAI 
        ? (ai.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10')
        : 'bg-white/[0.02] border-white/[0.05]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
          {label} {hasAI ? `• ${ai.status === 'approved' ? 'Одобрено ИИ' : 'Отказ ИИ'}` : '• Нет данных'}
        </p>
        <button 
          onClick={handleReevaluate}
          disabled={isReevaluating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold text-white/70 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
          Повторить Анализ
        </button>
      </div>

      {!hasAI ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 min-h-[100px]">
          <Cpu className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs uppercase tracking-wider font-bold">Ожидает анализа</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-white/70 leading-relaxed flex-1">{ai.reasoning}</p>
          {ai.scores && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.05]">
              {Object.entries(ai.scores).map(([k, v]) => (
                <span key={k} className="px-2 py-1 bg-white/[0.05] rounded text-xs font-mono text-white/50">
                  {k}: <strong className="text-white/80">{String(v)}</strong>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResponsibilityChart({ result, label }: { result: EvaluationResult; label: string }) {
  let c1Raw = result.answers['C1'];
  
  // Attempt to parse if it is a string representation of an array
  if (typeof c1Raw === 'string') {
    try {
      c1Raw = JSON.parse(c1Raw);
    } catch(e) {
      // Ignore parse error
    }
  }
  
  const c1 = Array.isArray(c1Raw) ? c1Raw : [0, 0, 0];
  const school = parseInt(String(c1[0]) || '0', 10);
  const family = parseInt(String(c1[1]) || '0', 10);
  const child = parseInt(String(c1[2]) || '0', 10);

  const total = family + school + child;
  if (total === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center text-white/30 text-xs py-10">
        Нет данных для Блока C
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-4">{label}</p>
      
      {/* Bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex mb-3">
        <div style={{ width: `${(family/total)*100}%` }} className="bg-violet-500" title={`Семья: ${family}%`} />
        <div style={{ width: `${(school/total)*100}%` }} className="bg-teal-500" title={`Школа: ${school}%`} />
        <div style={{ width: `${(child/total)*100}%` }} className="bg-amber-500" title={`Ребенок: ${child}%`} />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs mt-2">
        <div className="flex items-center gap-1.5 text-white/60 font-medium">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500"/> Семья {Math.round((family/total)*100)}%
        </div>
        <div className="flex items-center gap-1.5 text-white/60 font-medium">
          <div className="w-2.5 h-2.5 rounded-sm bg-teal-500"/> Школа {Math.round((school/total)*100)}%
        </div>
        <div className="flex items-center gap-1.5 text-white/60 font-medium">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"/> Ребенок {Math.round((child/total)*100)}%
        </div>
      </div>
    </div>
  );
}
