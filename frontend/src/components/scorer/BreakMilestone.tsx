'use client';

import { useEffect, useState } from 'react';

interface BreakMilestoneProps {
  currentBreak: number;
}

export default function BreakMilestone({ currentBreak }: BreakMilestoneProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (currentBreak >= 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [currentBreak]);

  if (currentBreak < 50) return null;

  const isCentury = currentBreak >= 100;

  return (
    <div
      className={`inline-flex items-center transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
    >
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-bounce ${
          isCentury
            ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40'
            : 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40'
        }`}
      >
        {isCentury ? '🏆 CENTURY!' : '50+'}
      </span>
    </div>
  );
}
