'use client';

import React from 'react';
import { BlockType } from '@/types';
import { BLOCK_META } from '@/lib/constants';

interface ProgressBarProps {
  currentBlock: BlockType;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

const BLOCK_ORDER: BlockType[] = ['0', 'A', 'B', 'C', 'D'];

export default function ProgressBar({
  currentBlock,
  progress,
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  const currentBlockIndex = BLOCK_ORDER.indexOf(currentBlock);

  const getColorClasses = (b: BlockType, isActive: boolean, isCompleted: boolean) => {
    let base = { bg: 'bg-plum', text: 'text-white', border: 'border-plum', bar: 'bg-plum', completedBg: 'bg-plum/20', completedBorder: 'border-plum/40', completedText: 'text-plum' };
    
    switch (b) {
      case '0':
        base = { bg: 'bg-teal', text: 'text-white', border: 'border-teal', bar: 'bg-teal', completedBg: 'bg-teal/20', completedBorder: 'border-teal/40', completedText: 'text-teal' };
        break;
      case 'A':
        base = { bg: 'bg-success', text: 'text-white', border: 'border-success', bar: 'bg-success', completedBg: 'bg-success/20', completedBorder: 'border-success/40', completedText: 'text-success' };
        break;
      case 'B':
        base = { bg: 'bg-warning', text: 'text-surface', border: 'border-warning', bar: 'bg-warning', completedBg: 'bg-warning/20', completedBorder: 'border-warning/40', completedText: 'text-warning' };
        break;
      case 'C':
        base = { bg: 'bg-violet', text: 'text-white', border: 'border-violet', bar: 'bg-violet', completedBg: 'bg-violet/20', completedBorder: 'border-violet/40', completedText: 'text-violet' };
        break;
    }

    if (isActive) {
      return `border-2 ${base.bg} ${base.text} ${base.border} shadow-glow`;
    } else if (isCompleted) {
      return `border-2 ${base.completedBg} ${base.completedText} ${base.completedBorder}`;
    }
    return `border-2 bg-surface-raised text-foreground-tertiary border-surface-overlay`;
  };

  const getBarColor = (b: BlockType) => {
    switch (b) {
      case '0': return 'bg-teal';
      case 'A': return 'bg-success';
      case 'B': return 'bg-warning';
      case 'C': return 'bg-violet';
      default: return 'bg-plum';
    }
  };

  return (
    <div className="mb-6 md:mb-10">
      {/* Block indicators */}
      <div className="flex items-center gap-1 md:gap-2 mb-4 md:mb-5">
        {BLOCK_ORDER.map((block, idx) => {
          const meta = BLOCK_META[block];
          const isActive = idx === currentBlockIndex;
          const isCompleted = idx < currentBlockIndex;
          
          const iconClass = getColorClasses(block, isActive, isCompleted);
          const barClass = getBarColor(block);

          return (
            <div key={block} className="flex items-center gap-1 md:gap-2 flex-1">
              <div
                className={`flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${iconClass}`}
                title={meta.title}
              >
                {isCompleted ? '✓' : meta.icon}
              </div>
              {idx < BLOCK_ORDER.length - 1 && (
                <div className="flex-1 h-1 bg-surface-raised rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${barClass} ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-surface-raised rounded-full overflow-hidden border border-surface-overlay/50 shadow-inner">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7A3466 0%, #A04A84 50%, #B86A9E 100%)',
          }}
        >
          {/* Subtle glow effect on the tip of the progress bar */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-white/40 blur-[2px] rounded-r-full animate-pulse-slow" />
        </div>
      </div>

      {/* Step counter */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-3 gap-2 md:gap-0">
        <span className="text-[10px] md:text-sm text-foreground-secondary font-bold uppercase tracking-wider text-center">
          {BLOCK_META[currentBlock].title}
        </span>
        <span className="badge badge-accent bg-surface border-surface-overlay text-xs">
          {currentStep} из {totalSteps}
        </span>
      </div>
    </div>
  );
}
