'use client';

import React, { useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface QuestionFormProps {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}

export default function QuestionForm({ initialData, onSave, onCancel, saving }: QuestionFormProps) {
  const [formData, setFormData] = useState<any>(
    initialData || {
      id: `q-${Date.now()}`,
      block: 'A',
      type: 'radio',
      text: '',
      options: [],
    }
  );

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    handleChange('options', newOptions);
  };

  const addOption = () => {
    handleChange('options', [...(formData.options || []), { label: '', weight: 0 }]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    handleChange('options', newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="glass-card-elevated p-6 animate-scale-in border-plum/50 shadow-glow">
      <div className="flex justify-between items-center mb-6 border-b border-foreground-tertiary/10 pb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-plum">
            {initialData ? 'Редактирование вопроса' : 'Новый вопрос'}
          </h3>
          <p className="text-xs font-mono text-foreground-tertiary mt-1">ID: {formData.id}</p>
        </div>
        <button 
          onClick={onCancel} 
          className="p-2 hover:bg-surface-raised rounded-xl text-foreground-tertiary hover:text-danger transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground-secondary uppercase tracking-wider">Блок анкеты</label>
            <select
              value={formData.block}
              onChange={(e) => handleChange('block', e.target.value)}
              className="text-input"
            >
              <option value="0">Блок 0 (Идентификация)</option>
              <option value="A">Блок A (SJT)</option>
              <option value="B">Блок B (Верификация)</option>
              <option value="C">Блок C (Кросс-валидация)</option>
              <option value="D">Блок D (Мотивация)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground-secondary uppercase tracking-wider">Тип вопроса</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="text-input"
            >
              <option value="radio">Один выбор (Radio)</option>
              <option value="checkbox">Множественный выбор (Checkbox)</option>
              <option value="text">Текст (Text)</option>
              <option value="textarea">Большой текст (Textarea)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground-secondary uppercase tracking-wider">Текст вопроса</label>
          <textarea
            value={formData.text}
            onChange={(e) => handleChange('text', e.target.value)}
            className="text-input h-24"
            placeholder="Введите текст вопроса..."
            required
          />
        </div>

        {/* DependsOn section */}
        <div className="p-4 bg-surface-raised rounded-xl border border-warning/20">
          <label className="flex items-center gap-2 text-sm font-bold text-warning uppercase tracking-wider mb-3">
            <input 
              type="checkbox" 
              checked={!!formData.dependsOn}
              onChange={(e) => {
                if (e.target.checked) {
                  handleChange('dependsOn', { questionId: '', value: '' });
                } else {
                  handleChange('dependsOn', undefined);
                }
              }}
              className="w-4 h-4 accent-warning"
            />
            Зависимость (Ветвление)
          </label>
          {formData.dependsOn && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <input
                  type="text"
                  placeholder="ID вопроса (напр. q-1)"
                  value={formData.dependsOn.questionId}
                  onChange={(e) => handleChange('dependsOn', { ...formData.dependsOn, questionId: e.target.value })}
                  className="text-input py-3"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Значение для триггера"
                  value={Array.isArray(formData.dependsOn.value) ? formData.dependsOn.value.join(', ') : formData.dependsOn.value}
                  onChange={(e) => {
                     const val = e.target.value;
                     const finalVal = val.includes(',') ? val.split(',').map(s => s.trim()) : val;
                     handleChange('dependsOn', { ...formData.dependsOn, value: finalVal });
                  }}
                  className="text-input py-3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Options section */}
        {['radio', 'checkbox', 'select'].includes(formData.type) && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-foreground-secondary uppercase tracking-wider">Варианты ответа</label>
              <button 
                type="button" 
                onClick={addOption}
                className="text-xs flex items-center gap-1 bg-plum/20 text-plum px-3 py-1.5 rounded-lg hover:bg-plum/30 transition-colors font-bold"
              >
                <Plus className="w-3 h-3" /> Добавить вариант
              </button>
            </div>
            
            <div className="space-y-3">
              {(formData.options || []).map((opt: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-foreground-tertiary/10">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Текст варианта"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                      className="w-full bg-transparent border-b border-foreground-tertiary/20 focus:border-plum outline-none px-2 py-1 text-sm"
                      required
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      placeholder="Вес"
                      value={opt.weight ?? 0}
                      onChange={(e) => handleOptionChange(idx, 'weight', parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent border-b border-foreground-tertiary/20 focus:border-plum outline-none px-2 py-1 text-sm text-center font-mono"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeOption(idx)}
                    className="p-2 text-foreground-tertiary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!formData.options || formData.options.length === 0) && (
                <p className="text-sm text-foreground-tertiary text-center py-4 bg-surface-raised rounded-xl border border-dashed border-foreground-tertiary/20">
                  Нет вариантов ответа
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-foreground-tertiary/10 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Отмена
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {saving ? 'Сохранение...' : 'Сохранить вопрос'}
          </button>
        </div>
      </form>
    </div>
  );
}
