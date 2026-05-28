'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, CheckCircle, XCircle, AlertTriangle, Cpu, ListTodo, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ResultRowProps {
  result: any;
}

export default function ResultRow({ result }: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getStatusIcon = (status: string) => {
    if (status.includes('✅')) return <CheckCircle className="w-6 h-6 text-success" />;
    if (status.includes('❌')) return <XCircle className="w-6 h-6 text-danger" />;
    return <AlertTriangle className="w-6 h-6 text-warning" />;
  };

  const getStatusBorder = (status: string) => {
    if (status.includes('✅')) return 'border-success/30';
    if (status.includes('❌')) return 'border-danger/30';
    return 'border-warning/30';
  };

  const handleAction = async (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    if (confirm(`Изменить статус на "${newStatus}"?`)) {
      setUpdating(true);
      try {
        const res = await fetch('/api/results');
        const allResults = await res.json();
        const updated = allResults.map((r: any) => r.id === result.id ? { ...r, status: newStatus } : r);
        
        await fetch('/api/results', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        window.location.reload();
      } catch (e) {
        alert('Ошибка при обновлении');
        setUpdating(false);
      }
    }
  };

  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 border-l-4 ${getStatusBorder(result.status)} ${updating ? 'opacity-50' : ''}`}>
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-raised transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-surface-raised p-2 rounded-xl">
            {getStatusIcon(result.status)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{result.status}</span>
              <span className="badge badge-accent shadow-glow">SJT: {result.sjtScore}</span>
            </div>
            <p className="text-xs text-foreground-tertiary mt-1.5 font-mono">
              ID: {result.id} <span className="mx-2">•</span> {result.createdAt ? format(new Date(result.createdAt), 'dd.MM.yyyy HH:mm') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!result.status.includes('✅') && (
            <button 
              onClick={(e) => handleAction(e, '✅ Прямое зачисление')} 
              className="p-2 hover:bg-success/10 text-foreground-tertiary hover:text-success rounded-lg transition-colors border border-transparent hover:border-success/20" 
              title="Одобрить"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
          )}
          {!result.status.includes('❌') && (
            <button 
              onClick={(e) => handleAction(e, '❌ Отказ')} 
              className="p-2 hover:bg-danger/10 text-foreground-tertiary hover:text-danger rounded-lg transition-colors border border-transparent hover:border-danger/20" 
              title="Отказать"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          )}
          <div className="w-px h-6 bg-foreground-tertiary/20 mx-2"></div>
          <ChevronDown className={`w-5 h-5 text-foreground-tertiary transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`grid grid-cols-1 lg:grid-cols-2 gap-px bg-foreground-tertiary/10 transition-all duration-500 origin-top ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {/* Raw Answers */}
        <div className="bg-surface/95 p-6 h-full border-t border-foreground-tertiary/10">
          <div className="flex items-center gap-2 mb-6 text-plum">
            <ListTodo className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase tracking-widest">Ответы родителей</h3>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(result.answers).map(([key, val]) => (
              <div key={key} className="bg-surface-raised p-4 rounded-xl border border-foreground-tertiary/5">
                <p className="text-xs font-bold text-foreground-tertiary mb-1.5 uppercase tracking-wider">Вопрос {key}</p>
                <p className="text-sm text-foreground leading-relaxed">{String(val)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-surface/95 p-6 h-full border-t border-foreground-tertiary/10 lg:border-l">
          <div className="flex items-center gap-2 mb-6 text-teal-light">
            <Cpu className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase tracking-widest">Анализ AI (Блок B)</h3>
          </div>
          
          {result.aiAnalysis ? (
            <div className="space-y-4">
              {result.aiAnalysis.recommendation && (
                <div className="glass-card-elevated p-5 border border-success/20">
                  <p className="text-xs font-bold text-success mb-2 uppercase tracking-wider">Рекомендация</p>
                  <p className="text-base font-bold text-foreground">{result.aiAnalysis.recommendation}</p>
                </div>
              )}
              
              {result.aiAnalysis.comment && (
                <div className="bg-surface-raised p-5 rounded-xl border border-foreground-tertiary/10">
                  <p className="text-xs font-bold text-foreground-tertiary mb-2 uppercase tracking-wider">Комментарий</p>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{result.aiAnalysis.comment}</p>
                </div>
              )}
              
              {result.aiAnalysis.riskFlags && (
                <div className="flex items-center gap-2 bg-danger/10 text-danger-light px-4 py-3 rounded-xl border border-danger/20 text-sm font-bold shadow-glow">
                  <AlertTriangle className="w-5 h-5" />
                  Обнаружены флаги риска! Требуется внимание психолога.
                </div>
              )}
              
              {result.aiAnalysis.scores && (
                 <div className="bg-surface-raised p-5 rounded-xl border border-foreground-tertiary/10">
                   <p className="text-xs font-bold text-foreground-tertiary mb-3 uppercase tracking-wider">Оценки по параметрам (0-2)</p>
                   <div className="flex flex-wrap gap-2">
                      {Object.entries(result.aiAnalysis.scores).map(([k, v]) => (
                        <span key={k} className="px-3 py-1.5 bg-background-main rounded-lg text-xs font-mono border border-foreground-tertiary/20 text-foreground-secondary flex items-center gap-2">
                          <span>{k}</span>
                          <span className="font-bold text-plum-light">{String(v)}</span>
                        </span>
                      ))}
                   </div>
                 </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-foreground-tertiary border-2 border-dashed border-foreground-tertiary/20 rounded-2xl">
              <Cpu className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Анализ AI не проводился</p>
              <p className="text-xs opacity-70">(SJT вне диапазона)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
