'use client';

import { useEffect, useState } from 'react';

interface MatchTimerProps {
  startedAt: string | null;
}

export default function MatchTimer({ startedAt }: MatchTimerProps) {
  const [elapsed, setElapsed] = useState<string>('00:00');

  useEffect(() => {
    if (!startedAt) {
      setElapsed('00:00');
      return;
    }

    const start = new Date(startedAt).getTime();

    const update = () => {
      const diff = Math.max(0, Date.now() - start);
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setElapsed(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="score-num">{elapsed}</span>
    </div>
  );
}
