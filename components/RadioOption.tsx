'use client';

import React from 'react';
import { Option } from '@/types';

interface RadioOptionProps {
  option: Option;
  name: string;
  isSelected: boolean;
  index: number;
  onSelect: (value: string) => void;
}

export default function RadioOption({
  option,
  name,
  isSelected,
  index,
  onSelect,
}: RadioOptionProps) {
  return (
    <label
      className={`radio-option ${isSelected ? 'selected' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <input
        type="radio"
        name={name}
        value={option.label}
        checked={isSelected}
        onChange={(e) => onSelect(e.target.value)}
        className="sr-only"
      />

      {/* Custom radio indicator */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div
          className={`
            w-5 h-5 rounded-full border-2 transition-all duration-200
            ${
              isSelected
                ? 'border-accent bg-accent shadow-glow'
                : 'border-foreground-tertiary/50 bg-transparent'
            }
          `}
        >
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      </div>

      {/* Label text */}
      <span
        className={`
          text-[15px] leading-relaxed transition-colors duration-200
          ${isSelected ? 'text-foreground font-medium' : 'text-foreground-secondary'}
        `}
      >
        {option.label}
      </span>
    </label>
  );
}
