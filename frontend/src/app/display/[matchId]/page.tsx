'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useMatchConnection } from '@/hooks/useMatchConnection';
import type { MatchStateUpdate } from '@/lib/types';

const DEMO_STATE: MatchStateUpdate = {
  matchId: 'demo', player1Name: 'Ahmed Sayed', player2Name: 'Player B',
  player1FrameScore: 52, player2FrameScore: 31, player1FramesWon: 2, player2FramesWon: 1,
  currentFrameNumber: 4, currentPlayerId: 'p1', currentPlayerName: 'Ahmed Sayed',
  currentBreak: 24, player1HighestBreak: 52, player2HighestBreak: 31,
  redsRemaining: 8, pointsRemaining: 91, player1SnookersRequired: 0, player2SnookersRequired: 0,
  status: 'InProgress', tournamentName: 'PJHG Open 2026', tableNumber: 3,
};

export default function TVDisplayPage() {
  const { matchId } = useParams() as { matchId: string };
  const isDemo = matchId === 'demo';
  const { state: liveState, connectionStatus } = useMatchConnection(isDemo ? null : matchId);
  const [demoState] = useState(DEMO_STATE);
  const state = isDemo ? demoState : liveState;
  const [flash, setFlash] = useState(false);
  const prevScore = useRef({ p1: 0, p2: 0 });

  // Flash on score change
  useEffect(() => {
    if (!state) return;
    if (state.player1FrameScore !== prevScore.current.p1 || state.player2FrameScore !== prevScore.current.p2) {
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
    }
    prevScore.current = { p1: state.player1FrameScore, p2: state.player2FrameScore };
  }, [state]);

  if (!state) {
    return (
      <div className="h-screen flex flex-col items-center justify-center" style={{ background: '#030810' }}>
        <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse mb-4" />
        <p className="text-gray-500 text-lg">
          {connectionStatus === 'connecting' ? 'Connecting...' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Waiting for match...'}
        </p>
      </div>
    );
  }

  const isP1 = state.currentPlayerName === state.player1Name;
  const isOver = state.status === 'Completed';

  return (
    <div className="h-screen flex flex-col select-none cursor-none overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #040a12 0%, #061210 50%, #040a12 100%)' }}
      onDoubleClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}>

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-10 py-5">
        <div>
          {state.tournamentName && (
            <h1 className="text-base text-emerald-400/80 font-medium tracking-[0.2em] uppercase">{state.tournamentName}</h1>
          )}
          {state.tableNumber && <p className="text-xs text-gray-600 mt-0.5">Table {state.tableNumber}</p>}
        </div>
        {!isOver && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] text-red-400/70 uppercase tracking-widest font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Main Score */}
      <div className="flex-1 flex items-center justify-center px-10">
        <div className="w-full max-w-6xl grid grid-cols-[1fr_auto_1fr] items-center">
          {/* P1 */}
          <div className={`text-right pr-10 transition-all duration-500 ${isP1 ? 'scale-100 opacity-100' : 'scale-95 opacity-40'}`}>
            <p className="text-xl lg:text-2xl text-gray-300 font-medium mb-3">{state.player1Name}</p>
            <p className={`text-8xl lg:text-[11rem] font-black score-num leading-none transition-all duration-300 ${flash && isP1 ? 'text-emerald-300' : 'text-white'}`}>
              {state.player1FrameScore}
            </p>
            {isP1 && !isOver && <div className="h-1 bg-blue-500 rounded ml-auto w-16 mt-4" />}
          </div>

          {/* Center */}
          <div className="flex flex-col items-center px-8">
            <p className="text-4xl lg:text-5xl font-bold text-gray-600 score-num">
              {state.player1FramesWon}<span className="text-gray-800 mx-1">:</span>{state.player2FramesWon}
            </p>
            <p className="text-xs text-gray-700 uppercase tracking-[0.3em] mt-3">Frame {state.currentFrameNumber}</p>
          </div>

          {/* P2 */}
          <div className={`text-left pl-10 transition-all duration-500 ${!isP1 ? 'scale-100 opacity-100' : 'scale-95 opacity-40'}`}>
            <p className="text-xl lg:text-2xl text-gray-300 font-medium mb-3">{state.player2Name}</p>
            <p className={`text-8xl lg:text-[11rem] font-black score-num leading-none transition-all duration-300 ${flash && !isP1 ? 'text-emerald-300' : 'text-white'}`}>
              {state.player2FrameScore}
            </p>
            {!isP1 && !isOver && <div className="h-1 bg-red-500 rounded w-16 mt-4" />}
          </div>
        </div>
      </div>

      {/* Break */}
      {state.currentBreak > 0 && !isOver && (
        <div className="flex-none text-center pb-3">
          <div className="inline-flex items-center gap-3 bg-black/40 rounded-full px-8 py-2 border border-emerald-900/30">
            <span className="text-xs text-emerald-600 uppercase tracking-wider">Break</span>
            <span className="text-3xl lg:text-4xl font-bold text-emerald-400 score-num">{state.currentBreak}</span>
          </div>
        </div>
      )}

      {isOver && (
        <div className="flex-none text-center pb-6">
          <span className="text-2xl text-emerald-400 font-bold">🏆 Match Complete</span>
        </div>
      )}

      {/* Bottom stats */}
      <div className="flex-none bg-black/30 border-t border-white/5 px-10 py-3">
        <div className="flex justify-between max-w-4xl mx-auto text-sm text-gray-500">
          <span>Highest: <b className="text-gray-300">{state.player1HighestBreak}</b> | <b className="text-gray-300">{state.player2HighestBreak}</b></span>
          <span>Remaining: <b className="text-gray-300">{state.pointsRemaining}</b></span>
          <span>Reds: <b className="text-gray-300">{state.redsRemaining}</b></span>
        </div>
      </div>
    </div>
  );
}
