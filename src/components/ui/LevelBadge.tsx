'use client';

import type { CEFRLevel } from '@/types';

type BadgeSize = 'sm' | 'md' | 'lg';

interface LevelBadgeProps {
  level: CEFRLevel;
  size?: BadgeSize;
}

/* Clean solid color per tier */
const tierColors: Record<CEFRLevel, string> = {
  A1: '#3d6b6b',
  A2: '#4a7d7d',
  B1: '#e58300',
  B2: '#cc7400',
  C1: '#7C3AED',
  C2: '#6D28D9',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3.5 py-1 text-sm',
  lg: 'px-5 py-1.5 text-base',
};

export default function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const bgColor = tierColors[level];

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold tracking-wide text-white
        ${sizeStyles[size]}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {level}
    </span>
  );
}
