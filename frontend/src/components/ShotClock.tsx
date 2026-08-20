'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface ShotClockProps {
  duration?: number;
  isRunning: boolean;
  onTimeout?: () => void;
}

export default function ShotClock({
  duration = 60,
  isRunning,
  onTimeout,
}: ShotClockProps) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            onTimeoutRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, remaining > 0, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(duration);
  }, [duration, clearTimer]);

  const progress = remaining / duration;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const isWarning = remaining <= 10;
  const isCritical = remaining <= 5;

  const strokeColor = isCritical
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : '#22c55e';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-28 h-28 ${isCritical ? 'animate-pulse' : ''}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#1f2937"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`score-num text-2xl font-bold ${
              isCritical
                ? 'text-red-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
