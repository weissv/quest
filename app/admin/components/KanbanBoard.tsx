'use client';

import React, { useState } from 'react';
import { FamilyProfile, PipelineStatus } from '@/types';
import FamilyCard from './FamilyCard';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  families: FamilyProfile[];
  onStatusChange: (familyCode: string, newStatus: PipelineStatus) => Promise<void>;
  onFamilyClick: (family: FamilyProfile) => void;
}

const COLUMNS: { id: PipelineStatus; label: string; color: string; border: string }[] = [
  { id: 'pending', label: 'Новые (Pending)', color: 'text-violet-400', border: 'border-violet-500/20' },
  { id: 'review', label: 'На ревью (Review)', color: 'text-amber-400', border: 'border-amber-500/20' },
  { id: 'approved', label: 'Одобрены', color: 'text-emerald-400', border: 'border-emerald-500/20' },
  { id: 'rejected', label: 'Отказ', color: 'text-rose-400', border: 'border-rose-500/20' },
];

export default function KanbanBoard({ families, onStatusChange, onFamilyClick }: KanbanBoardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: PipelineStatus) => {
    e.preventDefault();
    const code = e.dataTransfer.getData('text/plain');
    if (!code) return;
    
    // Find the family
    const family = families.find(f => f.code === code);
    if (!family || family.status === status) return;

    setUpdatingCode(code);
    try {
      await onStatusChange(code, status);
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar h-full items-stretch">
      {COLUMNS.map((col) => {
        const columnFamilies = families.filter((f) => f.status === col.id);
        
        return (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex-shrink-0 w-[300px] flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-2xl max-h-full overflow-hidden transition-colors ${activeDragId ? 'border-dashed border-white/20' : ''}`}
          >
            {/* Column Header */}
            <div className={`p-4 border-b ${col.border} bg-white/[0.01]`}>
              <div className="flex items-center justify-between">
                <h2 className={`font-bold uppercase tracking-wider text-sm ${col.color}`}>
                  {col.label}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/50 text-xs font-mono font-bold">
                  {columnFamilies.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
              {columnFamilies.map((family) => (
                <div key={family.code} className="relative">
                  <FamilyCard 
                    family={family} 
                    onClick={onFamilyClick}
                  />
                  {updatingCode === family.code && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ))}
              
              {columnFamilies.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/[0.03] rounded-xl text-white/20 text-xs font-medium uppercase tracking-wider h-[100px] mt-2">
                  Пусто
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
