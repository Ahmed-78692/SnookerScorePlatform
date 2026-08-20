'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useMatchConnection } from '@/hooks/useMatchConnection';
import type { MatchStateUpdate } from '@/lib/types';

const DEMO: MatchStateUpdate = {
  matchId: 'demo', player1Name: 'Ahmed Sayed', player2Name: 'Player B',
  player1FrameScore: 52, player2FrameScore: 31, player1FramesWon: 2, player2FramesWon: 1,
  currentFrameNumber: 4, currentPlayerId: 'p1', currentPlayerName: 'Ahmed Sayed',
  currentBreak: 24, player1HighestBreak: 52, player2HighestBreak: 31,
  redsRemaining: 8, pointsRemaining: 91, player1SnookersRequired: 0, player2SnookersRequired: 0,
  status: 'InProgress', tournamentName: 'PJHG Open 2026', tableNumber: 3,
};

export default function Wrapper() {
  return <Suspense fallback={null}><OBSOverlay /></Suspense>;
}

function OBSOverlay() {
  const { matchId } = useParams() as { matchId: string };
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout') || 'bottom';
  const isDemo = matchId === 'demo';
  const { state: live } = useMatchConnection(isDemo ? null : matchId);
  const state = isDemo ? DEMO : live;

  if (!state) return null;

  const isP1 = state.currentPlayerName === state.player1Name;
  const p = { state, isP1 };

  switch (layout) {
    case 'top': return <TopBar {...p} />;
    case 'scorebug': return <ScoreBug {...p} />;
    case 'minimal': return <Minimal {...p} />;
    case 'lower-third': return <LowerThird {...p} />;
    default: return <BottomBar {...p} />;
  }
}

interface OP { state: MatchStateUpdate; isP1: boolean; }

function BottomBar({ state, isP1 }: OP) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
      <div className="flex bg-black/90 backdrop-blur rounded-lg overflow-hidden border border-gray-700/40 shadow-2xl">
        <div className={`flex items-center gap-2 px-4 py-2 ${isP1 ? 'bg-blue-900/30' : ''}`}>
          {isP1 && <div className="w-0.5 h-5 bg-blue-400 rounded" />}
          <span className="text-xs text-gray-300 max-w-28 truncate">{state.player1Name}</span>
          <span className="text-xl font-bold text-white score-num">{state.player1FrameScore}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-3 border-x border-gray-700/30">
          <span className="text-[10px] text-gray-400 font-bold">{state.player1FramesWon}-{state.player2FramesWon}</span>
          <span className="text-[8px] text-gray-600">F{state.currentFrameNumber}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 ${!isP1 ? 'bg-red-900/30' : ''}`}>
          <span className="text-xl font-bold text-white score-num">{state.player2FrameScore}</span>
          <span className="text-xs text-gray-300 max-w-28 truncate">{state.player2Name}</span>
          {!isP1 && <div className="w-0.5 h-5 bg-red-400 rounded" />}
        </div>
        {state.currentBreak > 0 && (
          <div className="flex items-center px-3 border-l border-gray-700/30">
            <span className="text-sm font-bold text-emerald-400">{state.currentBreak}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ state, isP1 }: OP) {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2">
      <div className="flex bg-black/90 backdrop-blur rounded-b-lg overflow-hidden border border-t-0 border-gray-700/40">
        <div className={`flex items-center gap-2 px-4 py-1.5 ${isP1 ? 'bg-blue-900/20' : ''}`}>
          <span className="text-xs text-gray-300">{state.player1Name}</span>
          <span className="text-lg font-bold text-white score-num">{state.player1FrameScore}</span>
        </div>
        <div className="px-2 border-x border-gray-700/30 flex items-center">
          <span className="text-[9px] text-gray-500">{state.player1FramesWon}-{state.player2FramesWon}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 ${!isP1 ? 'bg-red-900/20' : ''}`}>
          <span className="text-lg font-bold text-white score-num">{state.player2FrameScore}</span>
          <span className="text-xs text-gray-300">{state.player2Name}</span>
        </div>
        {state.currentBreak > 0 && (
          <div className="flex items-center px-2 border-l border-gray-700/30">
            <span className="text-sm font-bold text-emerald-400">{state.currentBreak}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBug({ state, isP1 }: OP) {
  return (
    <div className="fixed top-4 left-4">
      <div className="bg-black/90 backdrop-blur rounded-lg border border-gray-700/40 overflow-hidden w-52">
        <Row name={state.player1Name} score={state.player1FrameScore} frames={state.player1FramesWon} active={isP1} color="blue" />
        <div className="h-px bg-gray-700/30" />
        <Row name={state.player2Name} score={state.player2FrameScore} frames={state.player2FramesWon} active={!isP1} color="red" />
        {state.currentBreak > 0 && (
          <div className="flex items-center justify-center py-1 bg-emerald-950/40 border-t border-emerald-900/30">
            <span className="text-[9px] text-emerald-600 mr-1">BRK</span>
            <span className="text-sm font-bold text-emerald-400">{state.currentBreak}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ name, score, frames, active, color }: { name: string; score: number; frames: number; active: boolean; color: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 ${active ? (color === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20') : ''}`}>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${active ? (color === 'blue' ? 'bg-blue-400' : 'bg-red-400') : 'bg-transparent'}`} />
        <span className="text-[11px] text-gray-300 w-24 truncate">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-600">{frames}</span>
        <span className="text-sm font-bold text-white score-num w-6 text-right">{score}</span>
      </div>
    </div>
  );
}

function Minimal({ state, isP1 }: OP) {
  return (
    <div className="fixed top-3 left-3">
      <div className="bg-black/80 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-700/30">
        <div className="flex items-center gap-2 text-xs">
          <span className={isP1 ? 'text-white' : 'text-gray-500'}>{state.player1Name}</span>
          <span className="text-white font-bold">{state.player1FrameScore}</span>
          <span className="text-gray-700">-</span>
          <span className="text-white font-bold">{state.player2FrameScore}</span>
          <span className={!isP1 ? 'text-white' : 'text-gray-500'}>{state.player2Name}</span>
          {state.currentBreak > 0 && <span className="text-emerald-400 font-bold ml-1">({state.currentBreak})</span>}
        </div>
      </div>
    </div>
  );
}

function LowerThird({ state, isP1 }: OP) {
  return (
    <div className="fixed bottom-6 left-6 right-6">
      <div className="max-w-2xl mx-auto">
        {state.tournamentName && (
          <div className="inline-block bg-emerald-800/90 px-3 py-0.5 rounded-t-md">
            <span className="text-[10px] text-white uppercase tracking-wider">{state.tournamentName}</span>
          </div>
        )}
        <div className="flex bg-black/90 backdrop-blur border border-gray-700/30 rounded-lg overflow-hidden">
          <div className={`flex-1 flex items-center justify-between px-5 py-3 ${isP1 ? 'bg-blue-900/15' : ''}`}>
            <span className="text-sm font-medium text-white">{state.player1Name}</span>
            <span className="text-3xl font-black text-white score-num">{state.player1FrameScore}</span>
          </div>
          <div className="w-px bg-gray-700/30" />
          <div className={`flex-1 flex items-center justify-between px-5 py-3 ${!isP1 ? 'bg-red-900/15' : ''}`}>
            <span className="text-3xl font-black text-white score-num">{state.player2FrameScore}</span>
            <span className="text-sm font-medium text-white">{state.player2Name}</span>
          </div>
          {state.currentBreak > 0 && (
            <div className="flex items-center px-4 border-l border-gray-700/30 bg-emerald-950/30">
              <span className="text-xl font-bold text-emerald-400">{state.currentBreak}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
