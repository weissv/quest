'use client';

import React from 'react';
import { BlockType } from '@/types';
import { BLOCK_META } from '@/data/questions';

interface BlockHeaderProps {
  block: BlockType;
  showTransition?: boolean;
}

export default function BlockHeader({
  block,
  showTransition = false,
}: BlockHeaderProps) {
  const meta = BLOCK_META[block];

  return (
    <div
      className={`mb-6 ${showTransition ? 'animate-fade-in' : ''}`}
    >
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-2xl">{meta.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-accent">Блок {block}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mt-1">
            {meta.title}
          </h2>
        </div>
      </div>
      <p className="text-sm text-foreground-secondary pl-[2.75rem]">
        {meta.subtitle}
      </p>
    </div>
  );
}
