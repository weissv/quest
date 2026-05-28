'use client';

import React from 'react';
import { Question } from '@/types';
import RadioOption from './RadioOption';
import TextInput from './TextInput';
import SlidersMatrix from './SlidersMatrix';

interface QuestionCardProps {
  question: Question;
  currentAnswer: string;
  onAnswer: (questionId: string, answer: string) => void;
}

export default function QuestionCard({
  question,
  currentAnswer,
  onAnswer,
}: QuestionCardProps) {
  const code = question.code || question.id;
  const isText = question.type === 'text' || question.type === 'TEXT' || question.type === 'OPEN';
  const isRadio = question.type === 'radio' || question.type === 'SELECT' || question.type === 'SJT';
  const isMatrix = question.type === 'sliders' || question.type === 'MATRIX';

  return (
    <div className="animate-slide-up">
      {/* Question text */}
      <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-8 text-balance">
        {question.text}
      </h3>

      {/* Text input */}
      {isText && (
        <div className="flex flex-col gap-2">
          <TextInput
            value={currentAnswer}
            onChange={(val) => onAnswer(code, val)}
            placeholder={
              code === '0.1'
                ? 'Введите семейный код...'
                : 'Ваш развёрнутый ответ (минимум 150 символов)...'
            }
            maxLength={code === '0.1' ? 50 : 2000}
          />
          {question.block === 'B' && (
            <div className={`text-xs text-right font-mono ${currentAnswer.length < 150 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentAnswer.length} / 150 символов
            </div>
          )}
        </div>
      )}

      {/* Radio options */}
      {isRadio && question.options && Array.isArray(question.options) && (
        <div className="flex flex-col gap-3">
          {question.options.map((option: any, idx: number) => {
            const label = typeof option === 'string' ? option : option.label;
            const value = typeof option === 'string' ? option : option.value || label;
            
            // In v3, we save the index for SJT questions instead of label, but for SELECT we might want value.
            // Let's modify the radio option to use index if it's SJT or value if SELECT, but useFormStore
            // SJT scoring expects the index in the answers object.
            const isSJT = question.type === 'SJT';
            const answerValue = isSJT ? idx : value;
            
            return (
              <RadioOption
                key={idx}
                option={option}
                name={code}
                isSelected={currentAnswer === answerValue}
                index={idx}
                onSelect={() => onAnswer(code, answerValue)}
              />
            );
          })}
        </div>
      )}

      {/* Sliders Matrix */}
      {isMatrix && (
        <SlidersMatrix
          value={currentAnswer}
          onChange={(val) => onAnswer(code, val)}
        />
      )}
    </div>
  );
}
