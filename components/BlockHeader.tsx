'use client';

import React from 'react';
import { BlockType } from '@/types';
import { BLOCK_META } from '@/lib/constants';

interface BlockHeaderProps {
  block: BlockType;
  showTransition?: boolean;
}

export default function BlockHeader({
  block,
  showTransition = false,
}: BlockHeaderProps) {
  const meta = BLOCK_META[block];

  const getColorClasses = (b: BlockType) => {
    switch (b) {
      case '0': return { badge: 'badge-teal', title: 'sp-title-teal', iconBg: 'bg-teal/10 border-teal/20' };
      case 'A': return { badge: 'badge-success', title: 'sp-title-success', iconBg: 'bg-success/10 border-success/20' };
      case 'B': return { badge: 'badge-warning', title: 'sp-title-warning', iconBg: 'bg-warning/10 border-warning/20' };
      case 'C': return { badge: 'badge-violet', title: 'sp-title-violet', iconBg: 'bg-violet/10 border-violet/20' };
      default: return { badge: 'badge-accent', title: 'sp-title', iconBg: 'bg-plum/10 border-plum/20' };
    }
  };

  const styles = getColorClasses(block);

  return (
    <div
      className={`mb-8 ${showTransition ? 'animate-fade-in-up' : ''}`}
    >
      <div className="flex items-center gap-4 mb-2">
        <span className={`text-3xl p-2 rounded-xl border ${styles.iconBg} ${showTransition ? 'animate-[scaleIn_0.4s_ease-out]' : ''}`}>
          {meta.icon}
        </span>
        <div>
          <div className="mb-1">
            <span className={`badge ${styles.badge} shadow-sm`}>Блок {block}</span>
          </div>
          <h2 className={`${styles.title} text-xl md:text-2xl font-bold tracking-tight drop-shadow-sm`}>
            <span>{meta.title}</span>
          </h2>
        </div>
      </div>
      <p 
        className={`text-sm text-foreground-secondary pl-[4.5rem] leading-relaxed ${showTransition ? 'animate-fade-in' : ''}`} 
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
      >
        {meta.subtitle}
      </p>
    </div>
  );
}
