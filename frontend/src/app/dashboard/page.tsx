'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useMatchConnection } from '@/hooks/useMatchConnection';
import type { MatchDto, MatchStateUpdate } from '@/lib/types';

export default function DashboardPage() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const live = await api.getLiveMatches();
        setMatches(live.slice(0, 8));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Refresh match list every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Venue Dashboard</h1>
            <p className="text-sm text-gray-500">
              {matches.length} active table{matches.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Match Grid */}
        {matches.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No live matches right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveMatchCard({ match }: { match: MatchDto }) {
  const { state, connectionStatus } = useMatchConnection(match.id);

  // Use real-time state if available, otherwise fall back to REST data
  const p1Frames = state?.player1FramesWon ?? match.player1FramesWon;
  const p2Frames = state?.player2FramesWon ?? match.player2FramesWon;
  const p1Score = state?.player1FrameScore ?? match.currentFrame?.player1Score ?? 0;
  const p2Score = state?.player2FrameScore ?? match.currentFrame?.player2Score ?? 0;
  const currentBreak = state?.currentBreak ?? 0;
  const currentPlayerName = state?.currentPlayerName ?? '';
  const frameNumber = state?.currentFrameNumber ?? match.currentFrameNumber;
  const status = state?.status ?? match.status;

  const isConnected = connectionStatus === 'connected';

  return (
    <Link
      href={`/live/${match.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-700/50 transition-colors relative overflow-hidden"
    >
      {/* Table number badge */}
      {match.tableNumber && (
        <div className="absolute top-2 right-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
          Table {match.tableNumber}
        </div>
      )}

      {/* Connection indicator */}
      <div className="absolute top-2 left-2">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block ${
            isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
          }`}
        />
      </div>

      {/* Frame info */}
      <div className="text-center text-xs text-gray-500 mt-2 mb-3">
        Frame {frameNumber}{' '}
        {status === 'Completed' && (
          <span className="text-gray-400">• Final</span>
        )}
      </div>

      {/* Player 1 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-200 truncate flex-1">
          {match.player1Name}
        </span>
        <div className="flex items-center gap-2">
          <span className="score-num text-sm text-gray-400">{p1Score}</span>
          <span className="score-num text-lg font-bold text-white bg-gray-800 w-7 h-7 rounded flex items-center justify-center">
            {p1Frames}
          </span>
        </div>
      </div>

      {/* Player 2 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-200 truncate flex-1">
          {match.player2Name}
        </span>
        <div className="flex items-center gap-2">
          <span className="score-num text-sm text-gray-400">{p2Score}</span>
          <span className="score-num text-lg font-bold text-white bg-gray-800 w-7 h-7 rounded flex items-center justify-center">
            {p2Frames}
          </span>
        </div>
      </div>

      {/* Current break indicator */}
      {currentBreak > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-500">{currentPlayerName}: </span>
          <span
            className={`score-num text-xs font-semibold ${
              currentBreak >= 100
                ? 'text-yellow-400'
                : currentBreak >= 50
                ? 'text-green-400'
                : 'text-gray-300'
            }`}
          >
            {currentBreak}
          </span>
        </div>
      )}
    </Link>
  );
}
