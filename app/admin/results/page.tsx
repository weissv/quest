
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SortDesc, SortAsc } from 'lucide-react';
import ResultRow from '../components/ResultRow';

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetch('/api/results')
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      });
  }, []);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter((r) => {
      if (statusFilter !== 'all') {
        const lowerStatus = r.status?.toLowerCase() || '';
        if (statusFilter === 'approved' && !lowerStatus.includes('прямое зачисление')) return false;
        if (statusFilter === 'rejected' && !lowerStatus.includes('не совместимо')) return false;
        if (statusFilter === 'review' && (lowerStatus.includes('прямое зачисление') || lowerStatus.includes('не совместимо'))) return false;
      }
      
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        const answersMatch = JSON.stringify(r.answers).toLowerCase().includes(searchLower);
        const idMatch = String(r.id).toLowerCase().includes(searchLower);
        const aiMatch = JSON.stringify(r.aiAnalysis || {}).toLowerCase().includes(searchLower);
        return answersMatch || idMatch || aiMatch;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [results, search, statusFilter, sortOrder]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredAndSortedResults.forEach((r) => {
      const familyCode = r.answers?.['0.1'] || 'Без кода';
      if (!groups[familyCode]) {
        groups[familyCode] = [];
      }
      groups[familyCode].push(r);
    });
    return Object.entries(groups).map(([code, results]) => ({ code, results }));
  }, [filteredAndSortedResults]);

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-12 h-12 rounded-full border-4 border-plum/20 border-t-plum animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div>
          <h1 className="text-4xl font-black tracking-tight sp-title"><span>Результаты анкет</span></h1>
          <p className="text-foreground-secondary mt-3 text-lg">Сгруппированы по семьям</p>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="glass-card-elevated p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-foreground-tertiary" />
              <input
                type="text"
                placeholder="Поиск по ID, ответам или AI рекомендациям..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-raised border border-foreground-tertiary/20 rounded-xl text-base focus:outline-none focus:border-plum transition-colors shadow-inner text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-4 text-foreground-tertiary" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-3 bg-surface-raised border border-foreground-tertiary/20 rounded-xl appearance-none focus:outline-none focus:border-plum transition-colors text-sm"
                >
                  <option value="all">Все статусы</option>
                  <option value="approved">Одобрено</option>
                  <option value="review">На ревью</option>
                  <option value="rejected">Отказ</option>
                </select>
              </div>
              <button 
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-4 py-3 bg-surface-raised border border-foreground-tertiary/20 rounded-xl hover:border-plum transition-colors flex items-center justify-center text-foreground-tertiary hover:text-plum"
                title="Сортировка по дате"
              >
                {sortOrder === 'desc' ? <SortDesc className="w-5 h-5" /> : <SortAsc className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groupedResults.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-foreground-tertiary/20 rounded-2xl">
                <Search className="w-10 h-10 mx-auto text-foreground-tertiary/50 mb-3" />
                <p className="text-foreground-secondary font-medium">Ничего не найдено</p>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {groupedResults.map(({ code, results }) => (
                  <div key={code} className="space-y-4">
                    <div className="flex items-center gap-3 mb-2 px-2">
                      <div className="h-px bg-foreground-tertiary/20 flex-1"></div>
                      <span className="text-sm font-bold uppercase tracking-widest text-plum-light bg-plum/10 px-3 py-1 rounded-full border border-plum/20">
                        Семья: {code} <span className="text-foreground-secondary ml-1">({results.length})</span>
                      </span>
                      <div className="h-px bg-foreground-tertiary/20 flex-1"></div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {results.map((result) => (
                        <ResultRow key={result.id} result={result} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
