'use client';

import React, { useId, useState } from 'react';

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
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.85;
  const isFloating = isFocused || value.length > 0;

  return (
    <div className="relative group mt-4">
      {/* Floating Label */}
      <label
        htmlFor={id}
        className={`absolute left-4 px-2 transition-all duration-300 pointer-events-none rounded
          ${isFloating 
            ? '-top-3 text-xs text-plum font-bold bg-[#2A2020] shadow-sm' 
            : 'top-5 text-base text-foreground-tertiary bg-transparent'
          }`}
      >
        {placeholder}
      </label>
      <textarea
        id={id}
        className="text-input min-h-[180px] pt-6"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
      />

      {/* Character counter */}
      <div className="flex justify-end mt-2">
        <span
          className={`text-xs font-mono transition-colors duration-200 ${
            charCount > maxLength ? 'text-rose-500' :
            isNearLimit ? 'text-warning' : 'text-foreground-tertiary'
          }`}
        >
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
