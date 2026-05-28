'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import QuestionForm from '../components/QuestionForm';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = () => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  };

  const handleSave = async (updatedQuestions: any[], closeForm = true) => {
    setSaving(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestions),
      });
      if (res.ok) {
        setQuestions(updatedQuestions);
        if (closeForm) {
          setIsFormOpen(false);
          setEditingData(null);
        }
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (e) {
      alert('Ошибка при сохранении');
    }
    setSaving(false);
  };

  const saveQuestion = (formData: any) => {
    let updated;
    if (questions.find((q) => q.id === formData.id)) {
      // Edit existing
      updated = questions.map((q) => (q.id === formData.id ? formData : q));
    } else {
      // Add new
      updated = [...questions, formData];
    }
    handleSave(updated);
  };

  const deleteQuestion = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      handleSave(questions.filter((q) => q.id !== id), false);
    }
  };

  const startEdit = (q: any) => {
    setEditingData(q);
    setIsFormOpen(true);
  };

  const startNew = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-plum/20 border-t-plum animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div>
          <h1 className="text-4xl font-black tracking-tight sp-title"><span>Управление вопросами</span></h1>
          <p className="text-foreground-secondary mt-3 text-lg">Редактирование вопросов, весов и логики ветвления</p>
        </div>
        {!isFormOpen && (
          <button onClick={startNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Новый вопрос
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl">
            <QuestionForm 
              initialData={editingData} 
              onSave={saveQuestion} 
              onCancel={() => {
                setIsFormOpen(false);
                setEditingData(null);
              }} 
              saving={saving} 
            />
          </div>
        </div>
      )}

      <div className="space-y-12 pb-20">
          {['0', 'A', 'B', 'C', 'D'].map((block) => {
            const blockQuestions = questions.filter(q => q.block === block);
            if (blockQuestions.length === 0) return null;
            
            return (
              <div key={block} className="animate-slide-up relative" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <div className="sticky top-0 z-10 bg-[#1E1515]/95 backdrop-blur-xl py-4 mb-6 border-b border-foreground-tertiary/20 shadow-sm">
                  <h2 className="text-2xl font-black tracking-tight text-plum flex items-center gap-3">
                     <span className="w-10 h-10 rounded-xl bg-plum/10 border border-plum/30 flex items-center justify-center text-plum text-lg shadow-inner">{block}</span>
                     Блок {block}
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {blockQuestions.map((q) => (
                    <QuestionCard 
                      key={q.id} 
                      question={q} 
                      onEdit={startEdit} 
                      onDelete={deleteQuestion} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
