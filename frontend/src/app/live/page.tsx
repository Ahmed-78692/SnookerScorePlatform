'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { MatchDto } from '@/lib/types';

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const data = await api.getLiveMatches();
      setMatches(data);
    } catch {
      // Silently fail — will retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-[10px] text-gray-600 hover:text-white">← Home</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Live Matches</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-500">Auto-refreshing</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-600 animate-pulse">Loading...</div>
      )}

      {!loading && matches.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">🎱</span>
          <p className="text-gray-400">No live matches right now</p>
          <p className="text-xs text-gray-600 mt-1">Start scoring on another device to see matches here</p>
          <Link href="/scorer" className="inline-block mt-6 px-5 py-2.5 bg-emerald-700 rounded-lg text-sm font-medium text-white hover:bg-emerald-600 transition">
            Start Scoring →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((match) => (
          <Link key={match.id} href={`/live/${match.id}`}
            className="block bg-gray-900/80 border border-gray-800 rounded-xl p-4 hover:border-emerald-700/50 transition group">
            {match.tournamentName && (
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-2">
                {match.tournamentName}{match.tableNumber ? ` • Table ${match.tableNumber}` : ''}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-200">{match.player1Name}</p>
                <p className="text-2xl font-black score-num">{match.currentFrame.player1Score}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-gray-600">F{match.currentFrameNumber}</p>
                <p className="text-sm font-bold text-gray-400">{match.player1FramesWon}:{match.player2FramesWon}</p>
                <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1 animate-pulse" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-medium text-gray-200">{match.player2Name}</p>
                <p className="text-2xl font-black score-num">{match.currentFrame.player2Score}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
