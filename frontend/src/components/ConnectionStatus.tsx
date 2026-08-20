'use client';

import type { ConnectionStatus } from '@/hooks/useMatchConnection';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  compact?: boolean;
}

export function ConnectionStatusIndicator({ status, compact = false }: ConnectionStatusProps) {
  if (status === 'connected' && compact) return null;

  const config = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...', animate: true },
    connected: { color: 'bg-emerald-500', text: 'Live', animate: false },
    reconnecting: { color: 'bg-amber-500', text: 'Reconnecting...', animate: true },
    disconnected: { color: 'bg-red-500', text: 'Disconnected', animate: false },
  }[status];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-gray-500">{config.text}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      status === 'disconnected'
        ? 'bg-red-900/40 text-red-300 border border-red-700'
        : status === 'reconnecting'
        ? 'bg-amber-900/40 text-amber-300 border border-amber-700'
        : status === 'connected'
        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'
        : 'bg-gray-800 text-gray-400 border border-gray-700'
    }`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`} />
      {config.text}
    </div>
  );
}
