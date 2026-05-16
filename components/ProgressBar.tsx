'use client';

import React from 'react';
import { BlockType } from '@/types';
import { BLOCK_META } from '@/data/questions';

interface ProgressBarProps {
  currentBlock: BlockType;
  progress: number; // 0-100
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

  return (
    <div className="mb-8">
      {/* Block indicators */}
      <div className="flex items-center gap-1.5 mb-4">
        {BLOCK_ORDER.map((block, idx) => {
          const meta = BLOCK_META[block];
          const isActive = idx === currentBlockIndex;
          const isCompleted = idx < currentBlockIndex;

          return (
            <div key={block} className="flex items-center gap-1.5">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold
                  transition-all duration-300
                  ${
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/40 shadow-glow'
                      : isCompleted
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-surface-raised text-foreground-tertiary border border-transparent'
                  }
                `}
                title={meta.title}
              >
                {isCompleted ? '✓' : meta.icon}
              </div>
              {idx < BLOCK_ORDER.length - 1 && (
                <div
                  className={`w-6 h-px transition-colors duration-300 ${
                    isCompleted ? 'bg-success/40' : 'bg-foreground-tertiary/20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, hsl(250 80% 65%), hsl(270 75% 55%))',
          }}
        />
        {/* Shimmer effect */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-40 animate-shimmer"
          style={{
            width: `${progress}%`,
            backgroundSize: '200% 100%',
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-foreground-tertiary font-medium">
          {BLOCK_META[currentBlock].title}
        </span>
        <span className="text-xs text-foreground-tertiary font-mono">
          {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
