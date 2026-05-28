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
  return (
    <div className="animate-slide-up">
      {/* Question text */}
      <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-8 text-balance">
        {question.text}
      </h3>

      {/* Text input */}
      {question.type === 'text' && (
        <TextInput
          value={currentAnswer}
          onChange={(val) => onAnswer(question.id, val)}
          placeholder={
            question.id === '0.1'
              ? 'Введите семейный код...'
              : 'Ваш развёрнутый ответ...'
          }
          maxLength={question.id === '0.1' ? 50 : 2000}
        />
      )}

      {/* Radio options */}
      {question.type === 'radio' && question.options && (
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => (
            <RadioOption
              key={idx}
              option={option}
              name={question.id}
              isSelected={currentAnswer === option.label}
              index={idx}
              onSelect={(val) => onAnswer(question.id, val)}
            />
          ))}
        </div>
      )}

      {/* Sliders Matrix */}
      {question.type === 'sliders' && (
        <SlidersMatrix
          value={currentAnswer}
          onChange={(val) => onAnswer(question.id, val)}
        />
      )}
    </div>
  );
}
