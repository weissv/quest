'use client';

import React, { useState, useEffect } from 'react';

interface SlidersMatrixProps {
  value: string; // JSON string of { school, family, child }
  onChange: (value: string) => void;
}

export default function SlidersMatrix({ value, onChange }: SlidersMatrixProps) {
  const [values, setValues] = useState({
    school: 33,
    family: 33,
    child: 34,
  });

  // Initialize from value if present
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed.school === 'number') {
          setValues(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [value]);

  const handleChange = (key: 'school' | 'family' | 'child', newValue: number) => {
    const oldVal = values[key];
    const delta = newValue - oldVal;

    const otherKeys = (['school', 'family', 'child'] as const).filter((k) => k !== key);
    let val1 = values[otherKeys[0]];
    let val2 = values[otherKeys[1]];

    // We need to subtract delta from val1 and val2
    // If one of them hits 0, the other takes the rest of the deduction
    let new1 = val1 - Math.round(delta / 2);
    let new2 = val2 - (delta - Math.round(delta / 2));

    if (new1 < 0) {
      new2 += new1;
      new1 = 0;
    } else if (new2 < 0) {
      new1 += new2;
      new2 = 0;
    }

    // If both are constrained (which happens if newValue > 100, which range input prevents)
    // we just clamp
    if (new1 < 0) new1 = 0;
    if (new2 < 0) new2 = 0;

    // Recalculate to ensure exact 100
    const actualNewValue = 100 - new1 - new2;

    const newValues = {
      ...values,
      [key]: actualNewValue,
      [otherKeys[0]]: new1,
      [otherKeys[1]]: new2,
    };

    setValues(newValues);
    onChange(JSON.stringify(newValues));
  };

  // On first render if empty, set default
  useEffect(() => {
    if (!value) {
      onChange(JSON.stringify({ school: 33, family: 33, child: 34 }));
    }
  }, []);

  const renderSlider = (key: 'school' | 'family' | 'child', label: string, colorClass: string) => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-foreground-secondary font-medium">{label}</label>
          <span className={`font-bold text-lg ${colorClass}`}>{values[key]}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={values[key]}
          onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
          className="w-full h-3 bg-black/30 rounded-lg appearance-none cursor-pointer border border-white/5 accent-plum shadow-inner transition-all hover:bg-black/40"
        />
      </div>
    );
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in-up mt-4">
      {renderSlider('school', 'Школа (учителя, кураторы, система)', 'text-teal-light')}
      {renderSlider('family', 'Семья (родители, репетиторы от родителей)', 'text-success')}
      {renderSlider('child', 'Ребенок (сам ученик)', 'text-plum-light')}

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
        <span className="text-foreground-secondary font-medium">Сумма ответственности:</span>
        <span className={`font-bold text-xl ${values.school + values.family + values.child === 100 ? 'text-success' : 'text-rose-500'}`}>
          {values.school + values.family + values.child}%
        </span>
      </div>
    </div>
  );
}
