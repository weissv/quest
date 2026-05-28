import React from 'react';
import { getResults, getQuestions } from '@/lib/db';
import { Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default async function AdminDashboard() {
  const results = await getResults();
  const questions = await getQuestions();

  const totalResults = results.length;
  const approvedResults = results.filter((r: any) => r.status && r.status.toLowerCase().includes('прямое зачисление')).length;
  const rejectedResults = results.filter((r: any) => r.status && r.status.toLowerCase().includes('не совместимо')).length;
  const reviewResults = totalResults - approvedResults - rejectedResults;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <h1 className="text-4xl font-black tracking-tight sp-title"><span>Дашборд</span></h1>
        <p className="text-foreground-secondary mt-3 text-lg">Общая статистика по воронке</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-elevated p-6 flex items-start gap-5 hover:border-plum/50 transition-all duration-300 hover:shadow-glow animate-slide-up group" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="p-4 bg-teal/10 text-teal-light rounded-2xl group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground-tertiary uppercase tracking-wider">Всего анкет</p>
            <p className="text-3xl font-black mt-1">{totalResults}</p>
          </div>
        </div>

        <div className="glass-card-elevated p-6 flex items-start gap-5 hover:border-plum/50 transition-all duration-300 hover:shadow-glow animate-slide-up group" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <div className="p-4 bg-success/10 text-success rounded-2xl group-hover:scale-110 transition-transform">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground-tertiary uppercase tracking-wider">Одобрено</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black">{approvedResults}</p>
              <p className="text-sm text-success font-medium mb-1">
                {totalResults ? Math.round((approvedResults / totalResults) * 100) : 0}%
              </p>
            </div>
            <div className="w-full h-1.5 bg-surface-raised rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-success transition-all duration-1000 ease-out" style={{ width: `${totalResults ? (approvedResults / totalResults) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-card-elevated p-6 flex items-start gap-5 hover:border-plum/50 transition-all duration-300 hover:shadow-glow animate-slide-up group" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="p-4 bg-warning/10 text-warning rounded-2xl group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground-tertiary uppercase tracking-wider">На ревью</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black">{reviewResults}</p>
              <p className="text-sm text-warning font-medium mb-1">
                {totalResults ? Math.round((reviewResults / totalResults) * 100) : 0}%
              </p>
            </div>
            <div className="w-full h-1.5 bg-surface-raised rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-warning transition-all duration-1000 ease-out" style={{ width: `${totalResults ? (reviewResults / totalResults) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-card-elevated p-6 flex items-start gap-5 hover:border-plum/50 transition-all duration-300 hover:shadow-glow animate-slide-up group" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <div className="p-4 bg-violet/10 text-violet-light rounded-2xl group-hover:scale-110 transition-transform">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground-tertiary uppercase tracking-wider">Вопросов</p>
            <p className="text-3xl font-black mt-1">{questions.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
