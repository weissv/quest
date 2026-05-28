'use client';

import React from 'react';
import { FamilyProfile } from '@/types';
import { Users, AlertTriangle } from 'lucide-react';

interface FamilyCardProps {
  family: FamilyProfile;
  onClick: (family: FamilyProfile) => void;
}

export default function FamilyCard({ family, onClick }: FamilyCardProps) {
  const { code, results, sjtAverage, aiAverage, totalScore } = family;

  // Determine if there are critical issues
  const hasRejectedResult = results.some((r) => {
    const s = (r.status || '').toLowerCase();
    return s === 'rejected' || s.includes('отказ');
  });

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', code);
    e.dataTransfer.effectAllowed = 'move';
    
    // Optional: make the dragged element slightly transparent
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(family)}
      className="group cursor-grab active:cursor-grabbing bg-[#2a2020]/80 backdrop-blur-md border border-white/[0.08] hover:border-violet-500/30 rounded-xl p-4 transition-all duration-200 hover:shadow-[0_8px_24px_-8px_rgba(139,92,246,0.2)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-wider">
            Семья {code}
          </span>
        </div>
        {hasRejectedResult && (
          <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase">
            Риск
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Анкет заполнено:</span>
          <span className="font-mono text-white/80 font-bold">{results.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">SJT ср. балл:</span>
          <span className="font-mono text-white/80">{sjtAverage.toFixed(1)} / 12</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">AI ср. балл:</span>
          <span className="font-mono text-white/80">{aiAverage.toFixed(1)} / 6</span>
        </div>
        
        <div className="h-px bg-white/[0.06] my-1" />
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/50">Общий рейтинг</span>
          <span className={`text-sm font-black ${totalScore >= 11 ? 'text-emerald-400' : totalScore >= 7 ? 'text-amber-400' : 'text-rose-400'}`}>
            {totalScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
