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
  const [recalculating, setRecalculating] = useState(false);

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

  const handleReCalculateAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Запустить повторный анализ AI для этой анкеты? (Текущий результат будет перезаписан)')) {
      setRecalculating(true);
      try {
        const res = await fetch('/api/re-evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultId: result.id })
        });
        if (!res.ok) throw new Error('Ошибка сети');
        window.location.reload();
      } catch (e) {
        alert('Ошибка при вызове ИИ');
        setRecalculating(false);
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-teal-light">
              <Cpu className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest">Анализ AI</h3>
            </div>
            <button
              onClick={handleReCalculateAI}
              disabled={recalculating}
              className="px-3 py-1.5 text-xs font-bold bg-teal/10 text-teal-light border border-teal/20 rounded-lg hover:bg-teal/20 transition-colors disabled:opacity-50"
            >
              {recalculating ? 'Считаем...' : 'Пересчитать AI'}
            </button>
          </div>
          
          {result.aiAnalysis && Object.keys(result.aiAnalysis).length > 0 ? (
            <div className="space-y-4">
              {result.aiAnalysis.status && (
                <div className={`glass-card-elevated p-5 border ${result.aiAnalysis.status === 'approved' ? 'border-success/20' : 'border-danger/20'}`}>
                  <p className={`text-xs font-bold mb-2 uppercase tracking-wider ${result.aiAnalysis.status === 'approved' ? 'text-success' : 'text-danger'}`}>
                    Вердикт ИИ
                  </p>
                  <p className="text-base font-bold text-foreground">{result.aiAnalysis.status}</p>
                </div>
              )}
              
              {result.aiAnalysis.reasoning && (
                <div className="bg-surface-raised p-5 rounded-xl border border-foreground-tertiary/10">
                  <p className="text-xs font-bold text-foreground-tertiary mb-2 uppercase tracking-wider">Психологический анализ</p>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{result.aiAnalysis.reasoning}</p>
                </div>
              )}
              
              <div className="bg-surface-raised p-5 rounded-xl border border-foreground-tertiary/10">
                 <p className="text-xs font-bold text-foreground-tertiary mb-3 uppercase tracking-wider">Баллы</p>
                 <div className="flex flex-wrap gap-2 items-center">
                    {result.aiAnalysis.scores && Object.entries(result.aiAnalysis.scores).map(([k, v]) => (
                      <span key={k} className="px-3 py-1.5 bg-background-main rounded-lg text-xs font-mono border border-foreground-tertiary/20 text-foreground-secondary flex items-center gap-2">
                        <span>{k}</span>
                        <span className="font-bold text-plum-light">{String(v)}</span>
                      </span>
                    ))}
                    {result.aiAnalysis.total_score !== undefined && (
                      <span className="ml-auto px-4 py-1.5 bg-plum/10 text-plum-light font-bold rounded-lg border border-plum/20">
                        Total AI Score: {result.aiAnalysis.total_score}
                      </span>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-foreground-tertiary border-2 border-dashed border-foreground-tertiary/20 rounded-2xl">
              <Cpu className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Анализ AI не проводился</p>
              <p className="text-xs opacity-70">(или завершился с ошибкой)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
