export const dynamic = 'force-dynamic';
'use client';

import React, { useState, useEffect } from 'react';
import { Save, BrainCircuit } from 'lucide-react';

export default function PromptPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setPrompt(data.aiPrompt || '');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPrompt: prompt }),
      });
      if (res.ok) {
        alert('Промт успешно сохранен!');
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (e) {
      alert('Ошибка при сохранении');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-plum/20 border-t-plum animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-end animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-plum flex items-center gap-3">
            <BrainCircuit className="w-10 h-10" />
            <span>Настройки ИИ (Промт)</span>
          </h1>
          <p className="text-foreground-secondary mt-3 text-lg">
            Управление системным промтом Gemini для анализа ответов родителей. 
            <br />
            <span className="text-warning text-sm">Используйте плейсхолдер <code>{`{OPEN_ANSWERS}`}</code> для указания места вставки ответов.</span>
          </p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>

      <div className="animate-slide-up glass-card-elevated p-6 shadow-glow" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-[600px] bg-[#1a1111] text-foreground p-6 rounded-xl border border-foreground-tertiary/20 focus:border-plum/50 focus:ring-1 focus:ring-plum/50 outline-none resize-y font-mono text-sm leading-relaxed custom-scrollbar shadow-inner"
          placeholder="Введите системный промт..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
