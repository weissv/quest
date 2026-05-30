'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FamilyProfile, PipelineStatus, EvaluationResult, Question } from '@/types';
import KanbanBoard from '../components/KanbanBoard';
import FamilyDetailView from '../components/FamilyDetailView';

/* ─── Helpers ───────────────────────────────────── */

function normalizeStatus(raw: string | null | undefined): PipelineStatus {
  if (!raw) return 'pending';
  const s = raw.toLowerCase();
  if (s === 'interview') return 'interview';
  if (s === 'review') return 'review';
  if (s === 'approved' || s.includes('зачисление') || s.includes('✅')) return 'approved';
  if (s === 'rejected' || s.includes('отказ') || s.includes('не совместимо') || s.includes('❌')) return 'rejected';
  return 'pending';
}

function normalizeFamilyCode(code: string): string {
  if (!code || code === 'Без кода') return 'Без кода';
  
  let norm = code.trim().toLowerCase();
  
  const replacements = [
    { endsWith: 'ова', replaceWith: 'ов' },
    { endsWith: 'ева', replaceWith: 'ев' },
    { endsWith: 'ёва', replaceWith: 'ёв' },
    { endsWith: 'ина', replaceWith: 'ин' },
    { endsWith: 'ына', replaceWith: 'ын' },
    { endsWith: 'ая', replaceWith: 'ий' },
    { endsWith: 'ova', replaceWith: 'ov' },
    { endsWith: 'eva', replaceWith: 'ev' },
    { endsWith: 'ina', replaceWith: 'in' },
  ];

  for (const r of replacements) {
    if (norm.endsWith(r.endsWith)) {
      return norm.slice(0, -r.endsWith.length) + r.replaceWith;
    }
  }

  if (norm.endsWith('ы') || norm.endsWith('и')) {
      if (norm.endsWith('овы')) return norm.slice(0, -1);
      if (norm.endsWith('евы')) return norm.slice(0, -1);
      if (norm.endsWith('ины')) return norm.slice(0, -1);
  }
  
  return norm;
}

function aggregateFamily(results: EvaluationResult[], displayCode?: string): FamilyProfile {
  const code = displayCode || (results[0] as any).familyCode || results[0].answers['0.1'] || 'Без кода';
  
  // Average SJT
  const sjtSum = results.reduce((acc, r) => acc + (r.sjtScore || 0), 0);
  const sjtAverage = sjtSum / results.length;

  // Average AI
  let aiSum = 0;
  let aiCount = 0;
  results.forEach(r => {
    if (r.aiAnalysis && r.aiAnalysis.total_score !== undefined) {
      aiSum += r.aiAnalysis.total_score;
      aiCount++;
    }
  });
  const aiAverage = aiCount > 0 ? aiSum / aiCount : 0;

  // Total Score (now tracked in DB, but we recalculate average here if needed)
  const totalScore = sjtAverage + aiAverage;

  // Family Status
  let status: PipelineStatus = 'pending';
  const statuses = results.map(r => normalizeStatus(r.status));
  
  if (statuses.includes('rejected')) status = 'rejected';
  else if (statuses.includes('interview')) status = 'interview';
  else if (statuses.includes('review')) status = 'review';
  else if (statuses.every(s => s === 'approved')) status = 'approved';

  // Latest update time
  const updatedAt = Math.max(...results.map(r => new Date(r.createdAt || 0).getTime()));

  // Behavioral Flags
  const flagsSet = new Set<string>();
  results.forEach(r => {
    if (r.behavioralFlags && Array.isArray(r.behavioralFlags)) {
      r.behavioralFlags.forEach(f => flagsSet.add(f));
    }
  });
  const behavioralFlags = Array.from(flagsSet);

  return {
    code,
    results,
    sjtAverage,
    aiAverage,
    totalScore,
    status,
    behavioralFlags,
    updatedAt
  };
}

/* ─── Main Page ─────────────────────────────────── */

export default function ResultsPage() {
  const [families, setFamilies] = useState<FamilyProfile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<FamilyProfile | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/results');
      const data: EvaluationResult[] = await res.json();
      
      // Group by family code with normalization
      const map: Record<string, { displayCode: string, results: EvaluationResult[] }> = {};
      data.forEach(r => {
        const rawCode = String((r as any).familyCode || r.answers?.['0.1'] || 'Без кода').trim();
        const normCode = normalizeFamilyCode(rawCode);
        
        if (!map[normCode]) {
          map[normCode] = { displayCode: rawCode, results: [] };
        } else {
          // Keep the shorter version as display name (e.g. "Алиев" over "Алиева")
          if (rawCode.length < map[normCode].displayCode.length && rawCode !== 'Без кода') {
            map[normCode].displayCode = rawCode;
          }
        }
        map[normCode].results.push(r);
      });

      // Map to FamilyProfiles
      const profiles = Object.values(map).map(group => aggregateFamily(group.results, group.displayCode));
      setFamilies(profiles);
      
      // If a drawer is open, refresh its data too
      if (selectedFamily) {
        const updated = profiles.find(f => f.code === selectedFamily.code);
        if (updated) setSelectedFamily(updated);
      }

    } finally {
      setLoading(false);
    }
  }, [selectedFamily]);

  useEffect(() => {
    fetchResults();
    fetch('/api/questions').then(r => r.json()).then(setQuestions).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (familyCode: string, newStatus: PipelineStatus) => {
    const family = families.find(f => f.code === familyCode);
    if (!family) return;

    // Optimistic update
    setFamilies(prev => prev.map(f => f.code === familyCode ? { ...f, status: newStatus } : f));

    // Update ALL results in this family to the new status
    try {
      await Promise.all(
        family.results.map(r => 
          fetch(`/api/results/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      // Refresh to get source of truth
      await fetchResults();
    } catch (e) {
      alert('Ошибка при переносе карточки');
      await fetchResults(); // rollback
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden animate-fade-in">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-4xl font-black tracking-tight sp-title">
          <span>Воронка семей</span>
        </h1>
        <p className="text-foreground-secondary mt-2 text-base">
          Агрегированные профили семей. Перетаскивайте карточки для смены статуса.
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedFamily ? (
          <FamilyDetailView 
            family={selectedFamily} 
            questions={questions}
            onBack={() => setSelectedFamily(null)} 
            onRefreshResults={fetchResults}
          />
        ) : (
          <KanbanBoard 
            families={families} 
            onStatusChange={handleStatusChange} 
            onFamilyClick={setSelectedFamily}
          />
        )}
      </div>
    </div>
  );
}
