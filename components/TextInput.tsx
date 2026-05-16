'use client';

import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function TextInput({
  value,
  onChange,
  placeholder = 'Ваш ответ...',
  maxLength = 2000,
}: TextInputProps) {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.85;

  return (
    <div className="relative">
      <textarea
        className="text-input min-h-[180px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />

      {/* Character counter */}
      <div className="flex justify-end mt-2">
        <span
          className={`text-xs font-mono transition-colors duration-200 ${
            isNearLimit ? 'text-warning' : 'text-foreground-tertiary'
          }`}
        >
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
