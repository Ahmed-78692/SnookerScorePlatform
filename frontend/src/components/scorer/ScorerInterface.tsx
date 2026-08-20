'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import type { MatchStateUpdate, BallType } from '@/lib/types';
import { BALL_COLORS } from '@/lib/types';
import FrameHistory from './FrameHistory';
import MatchTimer from './MatchTimer';
import BreakMilestone from './BreakMilestone';

interface Props {
  matchId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
}

interface BreakBall {
  ball: string;
  points: number;
}

interface CompletedFrame {
  frameNumber: number;
  player1Score: number;
  player2Score: number;
  winnerId: string;
}

export function ScorerInterface({ matchId, player1Id, player1Name, player2Id, player2Name }: Props) {
  const [state, setState] = useState<MatchStateUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<'none' | 'foul' | 'endframe'>('none');
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [breakBalls, setBreakBalls] = useState<BreakBall[]>([]);
  const [scoreFlash, setScoreFlash] = useState<'p1' | 'p2' | null>(null);
  const [matchStartedAt, setMatchStartedAt] = useState<string | null>(null);
  const [completedFrames, setCompletedFrames] = useState<CompletedFrame[]>([]);
  // Track overall highest breaks across all frames
  const [overallHighBreak1, setOverallHighBreak1] = useState(0);
  const [overallHighBreak2, setOverallHighBreak2] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'green'>('green');
  const prevStateRef = useRef<MatchStateUpdate | null>(null);

  // Detect score changes for flash animation + track highest breaks
  useEffect(() => {
    if (state && prevStateRef.current) {
      if (state.player1FrameScore !== prevStateRef.current.player1FrameScore) setScoreFlash('p1');
      else if (state.player2FrameScore !== prevStateRef.current.player2FrameScore) setScoreFlash('p2');
    }
    if (state) {
      if (state.player1HighestBreak > overallHighBreak1) setOverallHighBreak1(state.player1HighestBreak);
      if (state.player2HighestBreak > overallHighBreak2) setOverallHighBreak2(state.player2HighestBreak);
    }
    prevStateRef.current = state;
    if (scoreFlash) {
      const t = setTimeout(() => setScoreFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [state, scoreFlash]);

  const handleStart = async (breakingPlayerId: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.startMatch(matchId, breakingPlayerId);
      setState(result);
      setStarted(true);
      setMatchStartedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  const send = useCallback(async (eventType: string, opts?: { ball?: string; foulPoints?: number; winnerId?: string }) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.submitEvent(matchId, { eventType, ball: opts?.ball, foulPoints: opts?.foulPoints, winnerId: opts?.winnerId });
      setState(result);
      setPanel('none');

      // Track break balls
      if (eventType === 'pot' && opts?.ball) {
        const pts = { red: 1, yellow: 2, green: 3, brown: 4, blue: 5, pink: 6, black: 7 }[opts.ball] || 0;
        setBreakBalls(prev => [...prev, { ball: opts.ball!, points: pts }]);
        setLastAction('');
      } else if (eventType === 'foul' || eventType === 'endbreak') {
        setBreakBalls([]);
        setLastAction(eventType === 'foul' ? `Foul +${opts?.foulPoints}` : 'Miss');
      } else if (eventType === 'endframe') {
        // Track completed frame
        if (state) {
          setCompletedFrames(prev => [...prev, {
            frameNumber: state.currentFrameNumber,
            player1Score: state.player1FrameScore,
            player2Score: state.player2FrameScore,
            winnerId: opts?.winnerId || '',
          }]);
        }
        setBreakBalls([]);

        // If match is NOT over, auto-start next frame
        if (result.status !== 'Completed') {
          setLastAction('Starting next frame...');
          try {
            // Alternate who breaks — loser of previous frame breaks next
            const nextBreaker = opts?.winnerId === player1Id ? player2Id : player1Id;
            const nextResult = await api.submitEvent(matchId, { eventType: 'startframe', breakingPlayerId: nextBreaker });
            setState(nextResult);
            setLastAction(`Frame ${result.currentFrameNumber} started`);
          } catch {
            setLastAction('Frame over — tap a ball to continue');
          }
        } else {
          setLastAction('Match complete!');
        }
      } else if (eventType === 'freeball') {
        setLastAction('Free ball');
      } else {
        setLastAction(eventType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [matchId, loading, state, player1Id, player2Id]);

  const handleUndo = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.undoEvent(matchId);
      setState(result);
      setBreakBalls(prev => prev.slice(0, -1));
      setLastAction('Undone');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Undo failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Who breaks screen ──
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f2318 100%)' }}>
        <div className="w-16 h-16 rounded-full bg-red-600 shadow-lg mb-6" style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.4), inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.1)' }} />
        <h2 className="text-lg font-semibold text-gray-200 mb-6">Who breaks first?</h2>
        <div className="w-full max-w-xs space-y-3">
          <button onClick={() => handleStart(player1Id)} disabled={loading}
            className="w-full py-4 rounded-xl font-semibold bg-blue-600/90 hover:bg-blue-500 active:scale-[0.97] transition-all text-white backdrop-blur">
            {player1Name}
          </button>
          <button onClick={() => handleStart(player2Id)} disabled={loading}
            className="w-full py-4 rounded-xl font-semibold bg-red-600/90 hover:bg-red-500 active:scale-[0.97] transition-all text-white backdrop-blur">
            {player2Name}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (!state) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;

  const isP1 = state.currentPlayerId === player1Id;

  if (state.status === 'Completed') {
    const winner = state.winnerId === player1Id ? player1Name : player2Name;
    const loser = state.winnerId === player1Id ? player2Name : player1Name;
    const winnerFrames = state.winnerId === player1Id ? state.player1FramesWon : state.player2FramesWon;
    const loserFrames = state.winnerId === player1Id ? state.player2FramesWon : state.player1FramesWon;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #060d18 0%, #0a1a12 40%, #060d18 100%)' }}>
        {/* Trophy animation area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          {/* Trophy */}
          <div className="relative mb-6">
            <span className="text-6xl">🏆</span>
            <div className="absolute -inset-4 bg-yellow-400/10 rounded-full blur-xl" />
          </div>

          {/* Winner */}
          <h2 className="text-2xl font-black text-white mb-1">{winner}</h2>
          <p className="text-sm text-emerald-400 font-medium uppercase tracking-wider mb-4">Match Winner</p>

          {/* Score */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl font-black text-emerald-400 score-num">{winnerFrames}</span>
            <span className="text-2xl text-gray-600">–</span>
            <span className="text-5xl font-black text-gray-500 score-num">{loserFrames}</span>
          </div>
          <p className="text-xs text-gray-600">vs {loser}</p>

          {/* Frame Results Table */}
          {completedFrames.length > 0 && (
            <div className="mt-8 w-full max-w-sm">
              <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_30px_1fr_30px] items-center px-4 py-2 bg-gray-800/30 text-[10px] text-gray-500 uppercase tracking-wider">
                  <span></span>
                  <span className="text-center">{player1Name.split(' ')[0]}</span>
                  <span></span>
                  <span className="text-center">{player2Name.split(' ')[0]}</span>
                  <span></span>
                </div>
                {completedFrames.map((f) => {
                  const p1Won = f.winnerId === player1Id;
                  return (
                    <div key={f.frameNumber} className="grid grid-cols-[40px_1fr_30px_1fr_30px] items-center px-4 py-2.5 border-t border-gray-800/30">
                      <span className="text-[11px] text-gray-600">F{f.frameNumber}</span>
                      <span className={`text-center font-bold score-num ${p1Won ? 'text-emerald-400' : 'text-gray-400'}`}>{f.player1Score}</span>
                      <span className="text-center text-gray-700">–</span>
                      <span className={`text-center font-bold score-num ${!p1Won ? 'text-emerald-400' : 'text-gray-400'}`}>{f.player2Score}</span>
                      <span className="text-center text-[10px]">{p1Won ? '🔵' : '🔴'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="bg-gray-900/40 rounded-xl p-4 text-center border border-gray-800/30">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Highest Break</p>
              <p className="text-2xl font-black text-white score-num">{overallHighBreak1 || '–'}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{player1Name}</p>
            </div>
            <div className="bg-gray-900/40 rounded-xl p-4 text-center border border-gray-800/30">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Highest Break</p>
              <p className="text-2xl font-black text-white score-num">{overallHighBreak2 || '–'}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{player2Name}</p>
            </div>
          </div>

          {/* Duration */}
          {matchStartedAt && (
            <div className="mt-6 flex items-center gap-2 text-gray-600 text-xs">
              <span>Duration:</span>
              <MatchTimer startedAt={matchStartedAt} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Scorer ──
  const bgGradient = theme === 'green'
    ? 'linear-gradient(180deg, #0c1220 0%, #0d1f15 50%, #0c1220 100%)'
    : 'linear-gradient(180deg, #080c14 0%, #0a0f1a 50%, #080c14 100%)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgGradient }}>

      {/* ═══ SCOREBOARD ═══ */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/5">
        {/* Timer + Theme toggle */}
        <div className="flex items-center justify-between px-3 py-1 bg-black/20">
          <MatchTimer startedAt={matchStartedAt} />
          <button onClick={() => setTheme(t => t === 'dark' ? 'green' : 'dark')}
            className="text-[9px] text-gray-600 hover:text-gray-400">
            {theme === 'green' ? '🌑' : '🌿'}
          </button>
        </div>

        <div className="grid grid-cols-[1fr_50px_1fr] items-center px-3 py-3">
          {/* Player 1 */}
          <div className={`text-center transition-opacity duration-200 ${isP1 ? '' : 'opacity-35'}`}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 truncate px-2">{player1Name}</div>
            <div className={`text-4xl font-black score-num ${scoreFlash === 'p1' ? 'score-flash' : ''}`}>{state.player1FrameScore}</div>
          </div>
          {/* Center */}
          <div className="flex flex-col items-center">
            <div className="text-[9px] text-gray-600 uppercase">F{state.currentFrameNumber}</div>
            <div className="text-xs font-bold text-gray-400 my-0.5">{state.player1FramesWon}:{state.player2FramesWon}</div>
            <div className={`w-2 h-2 rounded-full ${isP1 ? 'bg-blue-400' : 'bg-red-400'}`} />
          </div>
          {/* Player 2 */}
          <div className={`text-center transition-opacity duration-200 ${!isP1 ? '' : 'opacity-35'}`}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 truncate px-2">{player2Name}</div>
            <div className={`text-4xl font-black score-num ${scoreFlash === 'p2' ? 'score-flash' : ''}`}>{state.player2FrameScore}</div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/30 text-[10px]">
          <span className="text-gray-500">Break <span className={`font-bold text-sm ${state.currentBreak > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>{state.currentBreak}</span></span>
          <BreakMilestone currentBreak={state.currentBreak} />
          <span className="text-gray-500">Reds <span className="text-gray-300 font-bold">{state.redsRemaining}</span></span>
          <span className="text-gray-500">Rem <span className="text-gray-300 font-bold">{state.pointsRemaining}</span></span>
          {(state.player1SnookersRequired > 0 || state.player2SnookersRequired > 0) && (
            <span className="text-amber-400 font-bold">SNK {state.player1SnookersRequired || state.player2SnookersRequired}</span>
          )}
        </div>
      </div>

      {/* ═══ BREAK DISPLAY ═══ */}
      {breakBalls.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-1 overflow-x-auto bg-black/20 border-b border-white/5">
          <span className="text-[9px] text-gray-600 mr-1 shrink-0">BREAK:</span>
          {breakBalls.map((b, i) => (
            <span key={i} className="break-pill shrink-0" style={{ backgroundColor: BALL_COLORS[b.ball as BallType] || '#666' }}>
              {b.points}
            </span>
          ))}
          <span className="text-xs font-bold text-emerald-400 ml-2">= {state.currentBreak}</span>
        </div>
      )}

      {/* ═══ FEEDBACK ═══ */}
      <div className="h-6 flex items-center justify-center">
        {error ? <span className="text-red-400 text-[11px]">{error}</span>
          : lastAction ? <span className="text-gray-600 text-[11px]">{lastAction}</span> : null}
      </div>

      {/* ═══ CONTROLS ═══ */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 gap-5 max-w-sm mx-auto w-full">

        {/* Ball buttons */}
        <div className="flex justify-center gap-3 flex-wrap">
          {(['red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black'] as BallType[]).map((ball) => {
            const pts = { red: 1, yellow: 2, green: 3, brown: 4, blue: 5, pink: 6, black: 7 }[ball];
            return (
              <button key={ball} onClick={() => send('pot', { ball })} disabled={loading}
                className="ball-btn" style={{ backgroundColor: BALL_COLORS[ball] }}>
                {pts}
              </button>
            );
          })}
        </div>

        {/* Action row */}
        <div className="grid grid-cols-5 gap-1.5 w-full">
          <ActionBtn label="Foul" color="bg-red-900/80" active={panel === 'foul'}
            onClick={() => setPanel(panel === 'foul' ? 'none' : 'foul')} disabled={loading} />
          <ActionBtn label="Miss" color="bg-amber-900/80"
            onClick={() => send('endbreak')} disabled={loading} />
          <ActionBtn label="Free" color="bg-teal-900/80"
            onClick={() => send('freeball')} disabled={loading} />
          <ActionBtn label="Concede" color="bg-purple-900/80" active={panel === 'endframe'}
            onClick={() => setPanel(panel === 'endframe' ? 'none' : 'endframe')} disabled={loading} />
          <ActionBtn label="Undo" color="bg-gray-800"
            onClick={handleUndo} disabled={loading} />
        </div>

        {/* Foul sub-panel */}
        {panel === 'foul' && (
          <div className="grid grid-cols-4 gap-2 w-full">
            {[4, 5, 6, 7].map(pts => (
              <button key={pts} onClick={() => send('foul', { foulPoints: pts })} disabled={loading}
                className="py-3.5 rounded-lg bg-red-800 text-white font-bold active:scale-95 transition-transform hover:bg-red-700">
                {pts}
              </button>
            ))}
          </div>
        )}

        {/* End Frame sub-panel */}
        {panel === 'endframe' && (
          <div className="w-full bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-700/50">
            <p className="text-[11px] text-gray-400 text-center mb-3">Award frame to:</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => send('endframe', { winnerId: player1Id })} disabled={loading}
                className="py-3 rounded-lg bg-blue-700 text-white font-semibold text-sm active:scale-95 transition-transform">
                {player1Name}
              </button>
              <button onClick={() => send('endframe', { winnerId: player2Id })} disabled={loading}
                className="py-3 rounded-lg bg-red-700 text-white font-semibold text-sm active:scale-95 transition-transform">
                {player2Name}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ FRAME HISTORY ═══ */}
      <FrameHistory frames={completedFrames} player1Id={player1Id} player2Id={player2Id}
        player1Name={player1Name} player2Name={player2Name} />

      <div className="h-4" />
    </div>
  );
}

function ActionBtn({ label, color, active, onClick, disabled }: { label: string; color: string; active?: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`py-2.5 rounded-lg text-[11px] font-semibold text-white active:scale-95 transition-all disabled:opacity-40 ${color} ${active ? 'ring-1 ring-white/40' : ''}`}>
      {label}
    </button>
  );
}
