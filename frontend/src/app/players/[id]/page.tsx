'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';

interface PlayerProfile {
  id: string;
  name: string;
  club?: string;
  email?: string;
  joinedAt?: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  highestBreak: number;
  centuries: number;
  fiftyPlusBreaks: number;
  averageBreak: number;
  totalFramesPlayed: number;
  totalFramesWon: number;
  frameWinRate: number;
  totalPointsScored: number;
  recentMatches?: RecentMatch[];
}

interface RecentMatch {
  id: string;
  opponentName: string;
  playerFrames: number;
  opponentFrames: number;
  won: boolean;
  date: string;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApi<PlayerProfile>(`/api/players/${id}`)
      .then(setPlayer)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading player...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Player not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/players"
          className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
        >
          ← All Players
        </Link>

        {/* Player Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 font-bold text-xl">
              {player.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{player.name}</h1>
              {player.club && (
                <p className="text-gray-400 text-sm">{player.club}</p>
              )}
              {player.joinedAt && (
                <p className="text-gray-500 text-xs mt-0.5">
                  Member since {new Date(player.joinedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Matches Played" value={player.matchesPlayed} />
          <StatCard label="Matches Won" value={player.matchesWon} />
          <StatCard
            label="Win Rate"
            value={`${Math.round(player.winRate * 100)}%`}
            highlight
          />
          <StatCard
            label="Highest Break"
            value={player.highestBreak}
            highlight
          />
          <StatCard label="Centuries" value={player.centuries} />
          <StatCard label="50+ Breaks" value={player.fiftyPlusBreaks} />
          <StatCard
            label="Avg Break"
            value={Math.round(player.averageBreak)}
          />
          <StatCard label="Total Points" value={player.totalPointsScored} />
          <StatCard label="Frames Played" value={player.totalFramesPlayed} />
          <StatCard label="Frames Won" value={player.totalFramesWon} />
          <StatCard
            label="Frame Win %"
            value={`${Math.round(player.frameWinRate * 100)}%`}
          />
          <StatCard label="Matches Lost" value={player.matchesLost} />
        </div>

        {/* Recent Matches */}
        {player.recentMatches && player.recentMatches.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Matches</h2>
            <div className="space-y-2">
              {player.recentMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/live/${match.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        match.won
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {match.won ? 'W' : 'L'}
                    </span>
                    <span className="text-sm text-gray-200">
                      vs {match.opponentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="score-num text-sm text-white font-medium">
                      {match.playerFrames}-{match.opponentFrames}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(match.date).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
      <div
        className={`score-num text-lg font-bold ${
          highlight ? 'text-green-400' : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
