'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  ListTodo,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ResultRowProps {
  result: any;
  onUpdate: () => void;
}

/* ─── Status helpers ────────────────────────────── */

function normalizeStatus(raw: string | null | undefined): 'approved' | 'rejected' | 'pending' {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s === 'approved' || s.includes('зачисление') || s.includes('✅')) return 'approved';
  if (s === 'rejected' || s.includes('отказ') || s.includes('не совместимо') || s.includes('❌')) return 'rejected';
  return 'pending';
}

const STATUS_CONFIG = {
  approved: {
    label: 'Одобрено',
    icon: CheckCircle,
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-l-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  rejected: {
    label: 'Отказ',
    icon: XCircle,
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-l-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  },
  pending: {
    label: 'На ревью',
    icon: Clock,
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-l-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
} as const;

/* ─── Score color ────────────────────────────────── */

function scoreColor(v: number): string {
  if (v === 2) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25';
  if (v === 1) return 'text-amber-400 bg-amber-500/15 border-amber-500/25';
  return 'text-rose-400 bg-rose-500/15 border-rose-500/25';
}

/* ─── Component ─────────────────────────────────── */

export default function ResultRow({ result, onUpdate }: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // 'status' | 'ai' | 'delete'

  const status = normalizeStatus(result.status);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  /* ── Actions ── */

  const patchStatus = async (e: React.MouseEvent, newStatus: 'approved' | 'rejected') => {
    e.stopPropagation();
    if (!confirm(`Изменить статус на «${STATUS_CONFIG[newStatus].label}»?`)) return;
    setBusy('status');
    try {
      const res = await fetch(`/api/results/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
    } catch {
      alert('Ошибка при обновлении статуса');
    } finally {
      setBusy(null);
    }
  };

  const reEvaluate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Запустить повторный анализ AI? Текущий вердикт будет перезаписан.')) return;
    setBusy('ai');
    try {
      const res = await fetch('/api/re-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId: result.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка сети');
      }
      onUpdate();
    } catch (err: any) {
      alert('Ошибка AI: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setBusy(null);
    }
  };

  const deleteResult = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить эту анкету навсегда?')) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/results/${result.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      onUpdate();
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setBusy(null);
    }
  };

  /* ── AI data ── */

  const ai = result.aiAnalysis;
  const hasAI = ai && typeof ai === 'object' && Object.keys(ai).length > 0 && !ai.error;
  const aiStatus = normalizeStatus(ai?.status);
  const totalScore = (result.sjtScore || 0) + (ai?.total_score || 0);

  /* ── Render ── */

  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-[#241a1a]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 border-l-4 ${cfg.borderClass} ${busy ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* ── Header Row ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left */}
        <div className="flex items-center gap-4 min-w-0">
          <div className={`p-2.5 rounded-xl ${cfg.bgClass}`}>
            <StatusIcon className={`w-5 h-5 ${cfg.textClass}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${cfg.badgeClass}`}>
                {cfg.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border bg-violet-500/15 text-violet-300 border-violet-500/25">
                SJT: {result.sjtScore ?? '—'}/{12}
              </span>
              {hasAI && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border bg-cyan-500/15 text-cyan-300 border-cyan-500/25">
                  AI: {ai.total_score ?? '—'}/{6}
                </span>
              )}
              {hasAI && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border bg-white/5 text-white/70 border-white/10">
                  Σ {totalScore}/{18}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mt-1.5 font-mono truncate">
              {result.createdAt ? format(new Date(result.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
              <span className="mx-1.5 opacity-40">·</span>
              {result.id.slice(0, 8)}…
            </p>
          </div>
        </div>

        {/* Right — action buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-4">
          {status !== 'approved' && (
            <button
              onClick={(e) => patchStatus(e, 'approved')}
              className="p-2 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Одобрить"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
          )}
          {status !== 'rejected' && (
            <button
              onClick={(e) => patchStatus(e, 'rejected')}
              className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Отказать"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={reEvaluate}
            className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            title="Пересчитать AI"
          >
            {busy === 'ai' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={deleteResult}
            className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />
          <ChevronDown
            className={`w-4 h-4 text-white/25 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* ── Expanded Details ── */}
      <div
        className={`transition-all duration-500 origin-top ${
          expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-white/[0.06]">
          {/* ── Answers panel ── */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
            <div className="flex items-center gap-2 mb-5">
              <ListTodo className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Ответы родителей
              </h3>
            </div>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2">
              {Object.entries(result.answers || {}).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">
                    {key}
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {String(val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── AI Analysis panel ── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Анализ AI
              </h3>
            </div>

            {hasAI ? (
              <div className="space-y-4">
                {/* AI Verdict badge */}
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    aiStatus === 'approved'
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}
                >
                  {aiStatus === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Вердикт ИИ
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        aiStatus === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {ai.status === 'approved' ? 'Одобрено' : 'Отказ'}
                    </p>
                  </div>
                </div>

                {/* Per-question scores */}
                {ai.scores && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ai.scores).map(([k, v]) => (
                      <span
                        key={k}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${scoreColor(v as number)}`}
                      >
                        {k}
                        <span className="opacity-40">→</span>
                        {String(v)}
                      </span>
                    ))}
                    {ai.total_score !== undefined && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ml-auto bg-white/5 text-white/70 border-white/10">
                        Σ AI: {ai.total_score}
                      </span>
                    )}
                  </div>
                )}

                {/* Reasoning */}
                {ai.reasoning && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">
                      Психологический анализ
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {ai.reasoning}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] border-2 border-dashed border-white/[0.06] rounded-2xl text-white/20">
                <Cpu className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">Анализ не проводился</p>
                <button
                  onClick={reEvaluate}
                  className="mt-3 px-4 py-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors"
                >
                  {busy === 'ai' ? 'Считаем…' : 'Запустить анализ'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
