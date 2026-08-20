'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMatchConnection } from '@/hooks/useMatchConnection';
import { BALL_COLORS } from '@/lib/types';
import type { BallType } from '@/lib/types';

export default function LiveMatchPage() {
  const { matchId } = useParams() as { matchId: string };
  const { state, connectionStatus } = useMatchConnection(matchId);

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mb-4" />
        <p className="text-gray-500">
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting for match data...'}
        </p>
      </div>
    );
  }

  const isP1 = state.currentPlayerName === state.player1Name;

  return (
    <div className="min-h-screen bg-gray-950 p-4 max-w-lg mx-auto">
      {/* Back */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/live" className="text-xs text-gray-500 hover:text-white">← Back</Link>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[10px] text-gray-500">{connectionStatus === 'connected' ? 'Live' : connectionStatus}</span>
        </div>
      </div>

      {/* Tournament */}
      {state.tournamentName && (
        <div className="text-center mb-4">
          <p className="text-xs text-emerald-400 uppercase tracking-widest">{state.tournamentName}</p>
          {state.tableNumber && <p className="text-[10px] text-gray-600">Table {state.tableNumber}</p>}
        </div>
      )}

      {/* Live badge */}
      {state.status === 'InProgress' && (
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Live</span>
        </div>
      )}

      {/* Score Card */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="grid grid-cols-[1fr_50px_1fr] items-center p-6">
          <div className={`text-center ${isP1 ? '' : 'opacity-40'}`}>
            <p className="text-xs text-gray-400 mb-2 truncate">{state.player1Name}</p>
            <p className="text-5xl font-black score-num">{state.player1FrameScore}</p>
            {isP1 && <div className="w-6 h-0.5 bg-blue-500 mx-auto mt-2 rounded" />}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-400">{state.player1FramesWon}:{state.player2FramesWon}</p>
            <p className="text-[9px] text-gray-600">F{state.currentFrameNumber}</p>
          </div>
          <div className={`text-center ${!isP1 ? '' : 'opacity-40'}`}>
            <p className="text-xs text-gray-400 mb-2 truncate">{state.player2Name}</p>
            <p className="text-5xl font-black score-num">{state.player2FrameScore}</p>
            {!isP1 && <div className="w-6 h-0.5 bg-red-500 mx-auto mt-2 rounded" />}
          </div>
        </div>

        {/* Break */}
        {state.currentBreak > 0 && (
          <div className="bg-emerald-950/40 border-t border-emerald-900/30 px-4 py-2.5 text-center">
            <span className="text-xs text-emerald-600">Break </span>
            <span className="text-xl font-bold text-emerald-400 score-num">{state.currentBreak}</span>
            <span className="text-xs text-gray-500 ml-2">({state.currentPlayerName})</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 border-t border-gray-800 text-center divide-x divide-gray-800">
          <Stat label="Best" value={String(state.player1HighestBreak)} />
          <Stat label="Best" value={String(state.player2HighestBreak)} />
          <Stat label="Rem" value={String(state.pointsRemaining)} />
          <Stat label="Reds" value={String(state.redsRemaining)} />
        </div>
      </div>

      {/* Snookers required */}
      {(state.player1SnookersRequired > 0 || state.player2SnookersRequired > 0) && (
        <div className="mt-4 text-center bg-amber-950/30 border border-amber-800/40 rounded-lg py-2 px-4">
          <span className="text-xs text-amber-400">
            {state.player1SnookersRequired > 0
              ? `${state.player1Name} needs ${state.player1SnookersRequired} snooker(s)`
              : `${state.player2Name} needs ${state.player2SnookersRequired} snooker(s)`}
          </span>
        </div>
      )}

      {/* Match complete */}
      {state.status === 'Completed' && (
        <div className="mt-6 text-center bg-emerald-950/30 border border-emerald-800 rounded-xl py-6">
          <span className="text-3xl">🏆</span>
          <p className="text-lg font-bold text-emerald-400 mt-2">Match Complete</p>
        </div>
      )}

      {/* Share links */}
      <div className="mt-8 flex justify-center gap-3">
        <a href={`/display/${matchId}`} target="_blank"
          className="text-xs text-gray-500 px-3 py-1.5 bg-gray-800 rounded-full hover:text-white transition">🖥️ TV Display</a>
        <a href={`/overlay/${matchId}`} target="_blank"
          className="text-xs text-gray-500 px-3 py-1.5 bg-gray-800 rounded-full hover:text-white transition">🎬 OBS</a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5">
      <div className="text-[9px] text-gray-600 uppercase">{label}</div>
      <div className="text-sm font-bold text-gray-300">{value}</div>
    </div>
  );
}
