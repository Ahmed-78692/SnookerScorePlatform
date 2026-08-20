'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';
import type { MatchDto } from '@/lib/types';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<MatchDto[]>('/api/matches/live')
      .then(setMatches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading matches...</div>
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

  const liveMatches = matches.filter((m) => m.status === 'InProgress');
  const completedMatches = matches.filter((m) => m.status === 'Completed');
  const scheduledMatches = matches.filter(
    (m) => m.status !== 'InProgress' && m.status !== 'Completed'
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Matches</h1>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-green-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </h2>
            <div className="space-y-2">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Scheduled */}
        {scheduledMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-amber-400 mb-3">
              Scheduled
            </h2>
            <div className="space-y-2">
              {scheduledMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedMatches.length > 0 && (
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
              Completed
            </h2>
            <div className="space-y-2">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            No matches found.
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchDto }) {
  const isLive = match.status === 'InProgress';
  const isCompleted = match.status === 'Completed';

  return (
    <Link
      href={`/live/${match.id}`}
      className="flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-green-700/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        {match.tournamentName && (
          <div className="text-xs text-gray-500 mb-0.5 truncate">
            {match.tournamentName}
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`text-gray-200 truncate ${
              isCompleted && match.winnerId === match.player1Id
                ? 'font-semibold text-white'
                : ''
            }`}
          >
            {match.player1Name}
          </span>
          <span className="score-num text-white font-bold">
            {match.player1FramesWon}
          </span>
          <span className="text-gray-600">-</span>
          <span className="score-num text-white font-bold">
            {match.player2FramesWon}
          </span>
          <span
            className={`text-gray-200 truncate ${
              isCompleted && match.winnerId === match.player2Id
                ? 'font-semibold text-white'
                : ''
            }`}
          >
            {match.player2Name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4 shrink-0">
        {match.tableNumber && (
          <span className="text-xs text-gray-500">T{match.tableNumber}</span>
        )}
        {isLive && (
          <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-medium">
            LIVE
          </span>
        )}
        {isCompleted && (
          <span className="text-xs text-gray-500">
            {match.completedAt
              ? new Date(match.completedAt).toLocaleDateString()
              : 'Done'}
          </span>
        )}
        {!isLive && !isCompleted && (
          <span className="text-xs text-gray-500">
            {new Date(match.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
