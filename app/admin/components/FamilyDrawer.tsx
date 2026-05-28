'use client';

import React, { useEffect, useState } from 'react';
import { FamilyProfile, EvaluationResult } from '@/types';
import { X, Cpu, Target, User, BarChart } from 'lucide-react';
import { format } from 'date-fns';

interface FamilyDrawerProps {
  family: FamilyProfile | null;
  onClose: () => void;
}

export default function FamilyDrawer({ family, onClose }: FamilyDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!family) return null;

  const resultA = family.results[0];
  const resultB = family.results[1]; // might be undefined

  // Collect all unique keys from both answers to map them side by side
  const answerKeys = new Set<string>();
  Object.keys(resultA?.answers || {}).forEach(k => answerKeys.add(k));
  if (resultB) {
    Object.keys(resultB.answers || {}).forEach(k => answerKeys.add(k));
  }
  const sortedKeys = Array.from(answerKeys).sort();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-[#1a1313] border-l border-white/[0.08] shadow-2xl z-50 overflow-y-auto custom-scrollbar transition-transform duration-300 transform ${mounted ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1313]/90 backdrop-blur-md border-b border-white/[0.08] px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Семья <span className="text-violet-400 bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/20">{family.code}</span>
            </h2>
            <p className="text-sm text-white/50 mt-1">
              {family.results.length} анкет(а) · Обновлено {format(family.updatedAt, 'dd.MM HH:mm')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
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

          {/* AI Reasoning (Aggregated or side-by-side) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> Вердикты ИИ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AIResultPanel result={resultA} label="Анкета 1 (Основатель)" />
              {resultB && <AIResultPanel result={resultB} label="Анкета 2 (Партнер)" />}
            </div>
          </div>

          {/* Block C Visualizer (Responsibility Matrix) */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Распределение ответственности (Блок C)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ResponsibilityChart result={resultA} label="Анкета 1" />
               {resultB && <ResponsibilityChart result={resultB} label="Анкета 2" />}
            </div>
          </div>

          {/* Side-by-side answers */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Target className="w-5 h-5" /> Сравнение ответов
            </h3>
            
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
              {sortedKeys.map((key, idx) => {
                const rawA = resultA?.answers[key];
                const rawB = resultB?.answers[key];
                const valA = rawA !== undefined ? (typeof rawA === 'object' ? JSON.stringify(rawA) : rawA) : '—';
                const valB = rawB !== undefined ? (typeof rawB === 'object' ? JSON.stringify(rawB) : rawB) : '—';
                
                return (
                  <div key={key} className={`flex flex-col md:flex-row border-b border-white/[0.05] last:border-b-0 ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                    <div className="md:w-20 p-4 flex-shrink-0 border-r border-white/[0.05] flex items-center justify-center">
                      <span className="text-xs font-bold text-white/30 uppercase">Вопрос {key}</span>
                    </div>
                    <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-white/[0.05]">
                      <p className="text-[10px] font-bold text-violet-400 mb-2 uppercase tracking-wider">Анкета 1</p>
                      <p className="text-sm text-white/80 leading-relaxed">{valA}</p>
                    </div>
                    {resultB && (
                      <div className="flex-1 p-4">
                        <p className="text-[10px] font-bold text-teal-400 mb-2 uppercase tracking-wider">Анкета 2</p>
                        <p className="text-sm text-white/80 leading-relaxed">{valB}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Helpers ─── */

function AIResultPanel({ result, label }: { result: EvaluationResult; label: string }) {
  const ai = result.aiAnalysis;
  if (!ai || !ai.reasoning) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-white/30 h-full min-h-[150px]">
        <Cpu className="w-8 h-8 opacity-20 mb-2" />
        <p className="text-xs uppercase tracking-wider font-bold">Нет данных ИИ</p>
      </div>
    );
  }

  const isApproved = ai.status === 'approved';

  return (
    <div className={`rounded-2xl border p-5 ${isApproved ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">{label} • {isApproved ? 'Одобрено ИИ' : 'Отказ ИИ'}</p>
      <p className="text-sm text-white/70 leading-relaxed">{ai.reasoning}</p>
      
      {ai.scores && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.05]">
          {Object.entries(ai.scores).map(([k, v]) => (
            <span key={k} className="px-2 py-1 bg-white/[0.05] rounded text-xs font-mono text-white/50">{k}: <strong className="text-white/80">{String(v)}</strong></span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponsibilityChart({ result, label }: { result: EvaluationResult; label: string }) {
  const c1 = Array.isArray(result.answers['C1']) ? result.answers['C1'] : [0, 0, 0];
  const school = parseInt(c1[0] || '0', 10);
  const family = parseInt(c1[1] || '0', 10);
  const child = parseInt(c1[2] || '0', 10);

  const total = family + school + child;
  if (total === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center text-white/30 text-xs py-10">
        Нет данных
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
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/60"><div className="w-2 h-2 rounded-full bg-violet-500"/> Семья {Math.round((family/total)*100)}%</div>
        <div className="flex items-center gap-1.5 text-white/60"><div className="w-2 h-2 rounded-full bg-teal-500"/> Школа {Math.round((school/total)*100)}%</div>
        <div className="flex items-center gap-1.5 text-white/60"><div className="w-2 h-2 rounded-full bg-amber-500"/> Ребенок {Math.round((child/total)*100)}%</div>
      </div>
    </div>
  );
}
