'use client';

import React from 'react';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';

interface QuestionCardProps {
  question: any;
  onEdit: (q: any) => void;
  onDelete: (id: string) => void;
}

export default function QuestionCard({ question: q, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="glass-card-elevated p-6 flex flex-col gap-4 animate-slide-up group transition-all duration-300 hover:border-plum/40 hover:shadow-glow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`badge ${q.block === 'A' ? 'badge-success' : q.block === 'B' ? 'badge-warning' : q.block === '0' ? 'badge-teal' : 'badge-violet'}`}>
              Блок {q.block}
            </span>
            <span className="text-xs text-foreground-tertiary uppercase font-bold tracking-widest">{q.type}</span>
            <span className="text-xs font-mono text-foreground-tertiary bg-surface-raised px-2 py-1 rounded-md">{q.id}</span>
          </div>
          <p className="text-lg font-medium text-foreground">{q.text}</p>
          
          {q.options && q.options.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-surface-raised p-3 rounded-xl border border-foreground-tertiary/10">
                  <span className="text-sm text-foreground-secondary line-clamp-2">{opt.label}</span>
                  {opt.weight !== undefined && (
                    <span className="text-xs px-2 py-1 bg-plum/10 rounded-lg text-plum-light border border-plum/20 font-mono whitespace-nowrap">
                      Вес: {opt.weight}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {q.dependsOn && (
            <div className="mt-4 flex items-center gap-2 text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg border border-warning/20 w-max">
              <AlertTriangle className="w-4 h-4" />
              <span>Зависит от: <span className="font-mono bg-surface-raised px-1 rounded">{q.dependsOn.questionId}</span> = {JSON.stringify(q.dependsOn.value)}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(q)} 
            className="p-2.5 bg-surface-raised hover:bg-plum/20 rounded-xl text-foreground-tertiary hover:text-plum border border-transparent hover:border-plum/30 transition-all shadow-sm"
            title="Редактировать"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(q.id)} 
            className="p-2.5 bg-surface-raised hover:bg-danger/20 rounded-xl text-foreground-tertiary hover:text-danger border border-transparent hover:border-danger/30 transition-all shadow-sm"
            title="Удалить"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
