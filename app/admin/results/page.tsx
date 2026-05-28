'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  SortDesc,
  SortAsc,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
} from 'lucide-react';
import ResultRow from '../components/ResultRow';

/* ─── Status normalizer (same as ResultRow) ────── */

function normalizeStatus(raw: string | null | undefined): 'approved' | 'rejected' | 'pending' {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s === 'approved' || s.includes('зачисление') || s.includes('✅')) return 'approved';
  if (s === 'rejected' || s.includes('отказ') || s.includes('не совместимо') || s.includes('❌')) return 'rejected';
  return 'pending';
}

/* ─── Main page ─────────────────────────────────── */

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  /* ── Fetch ── */

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/results');
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  /* ── Stats ── */

  const stats = useMemo(() => {
    const total = results.length;
    const approved = results.filter((r) => normalizeStatus(r.status) === 'approved').length;
    const rejected = results.filter((r) => normalizeStatus(r.status) === 'rejected').length;
    const pending = total - approved - rejected;
    return { total, approved, rejected, pending };
  }, [results]);

  /* ── Filtered & sorted ── */

  const filtered = useMemo(() => {
    let list = results.filter((r) => {
      if (statusFilter !== 'all' && normalizeStatus(r.status) !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const inAnswers = JSON.stringify(r.answers || {}).toLowerCase().includes(q);
        const inId = r.id?.toLowerCase().includes(q);
        const inAI = JSON.stringify(r.aiAnalysis || {}).toLowerCase().includes(q);
        const inCode = (r.answers?.['0.1'] || '').toLowerCase().includes(q);
        return inAnswers || inId || inAI || inCode;
      }
      return true;
    });

    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });

    return list;
  }, [results, search, statusFilter, sortOrder]);

  /* ── Grouped by family code ── */

  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    filtered.forEach((r) => {
      const code = r.answers?.['0.1'] || '—';
      (map[code] ??= []).push(r);
    });
    return Object.entries(map).map(([code, items]) => ({ code, items }));
  }, [filtered]);

  /* ── Loading ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  /* ── Render ── */

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <h1 className="text-4xl font-black tracking-tight sp-title">
          <span>Результаты</span>
        </h1>
        <p className="text-foreground-secondary mt-2 text-base">
          {stats.total} {stats.total === 1 ? 'анкета' : 'анкет'} · сгруппированы по семьям
        </p>
      </div>

      {/* ── Stats cards ── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <StatCard icon={Users} label="Всего" value={stats.total} color="violet" />
        <StatCard icon={CheckCircle} label="Одобрено" value={stats.approved} color="emerald" />
        <StatCard icon={Clock} label="На ревью" value={stats.pending} color="amber" />
        <StatCard icon={XCircle} label="Отказ" value={stats.rejected} color="rose" />
      </div>

      {/* ── Filters ── */}
      <div
        className="animate-slide-up"
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-white/25" />
            <input
              type="text"
              placeholder="Поиск по коду семьи, ответам, AI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:border-violet-500/40 transition-colors text-white/80 placeholder:text-white/20"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5">
            {(['all', 'approved', 'pending', 'rejected'] as const).map((s) => {
              const active = statusFilter === s;
              const labels = {
                all: 'Все',
                approved: 'Одобрено',
                pending: 'Ревью',
                rejected: 'Отказ',
              };
              const colors = {
                all: 'violet',
                approved: 'emerald',
                pending: 'amber',
                rejected: 'rose',
              };
              const c = colors[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? `bg-${c}-500/15 text-${c}-400 border-${c}-500/30`
                      : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/10'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: `var(--${c}, rgba(139,92,246,0.15))`,
                          color: `var(--${c}-text, rgba(167,139,250,1))`,
                          borderColor: `var(--${c}-border, rgba(139,92,246,0.3))`,
                        }
                      : undefined
                  }
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3.5 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/30 hover:text-white/60 hover:border-white/15 transition-colors"
            title="Сортировка по дате"
          >
            {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Results list ── */}
      <div className="animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
        {groups.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/[0.06] rounded-2xl">
            <Search className="w-8 h-8 mx-auto text-white/10 mb-3" />
            <p className="text-white/30 text-sm font-medium">Ничего не найдено</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(({ code, items }) => (
              <div key={code}>
                {/* Family separator */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px bg-white/[0.06] flex-1" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400/70 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/15">
                    Семья: {code}
                    <span className="text-white/25 ml-1.5">({items.length})</span>
                  </span>
                  <div className="h-px bg-white/[0.06] flex-1" />
                </div>

                {/* Result cards */}
                <div className="space-y-3">
                  {items.map((r) => (
                    <ResultRow key={r.id} result={r} onUpdate={fetchResults} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat card sub-component ───────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    violet: { bg: 'rgba(139,92,246,0.08)', text: 'rgba(167,139,250,1)', border: 'rgba(139,92,246,0.15)' },
    emerald: { bg: 'rgba(16,185,129,0.08)', text: 'rgba(52,211,153,1)', border: 'rgba(16,185,129,0.15)' },
    amber: { bg: 'rgba(245,158,11,0.08)', text: 'rgba(251,191,36,1)', border: 'rgba(245,158,11,0.15)' },
    rose: { bg: 'rgba(244,63,94,0.08)', text: 'rgba(251,113,133,1)', border: 'rgba(244,63,94,0.15)' },
  };
  const c = colorMap[color] || colorMap.violet;

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:brightness-110"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
      }}
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: c.text }} />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.text, opacity: 0.7 }}>
          {label}
        </p>
        <p className="text-xl font-black text-white/90">{value}</p>
      </div>
    </div>
  );
}
