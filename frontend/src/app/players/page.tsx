'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';

interface Player {
  id: string;
  name: string;
  club?: string;
  matchesPlayed: number;
  matchesWon: number;
  highestBreak: number;
  centuries: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadPlayers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = query.trim()
        ? `/api/players/search?q=${encodeURIComponent(query.trim())}`
        : '/api/players';
      const data = await fetchApi<Player[]>(path);
      setPlayers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers('');
  }, [loadPlayers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadPlayers(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, loadPlayers]);

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-6">Players</h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 placeholder:text-gray-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm mb-4">Error: {error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-gray-400 animate-pulse py-8 text-center">
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div className="text-gray-500 py-8 text-center">
            {search ? 'No players found matching your search.' : 'No players registered yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 font-semibold text-sm">
                    {player.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-green-400 transition-colors truncate">
                      {player.name}
                    </div>
                    {player.club && (
                      <div className="text-xs text-gray-500 truncate">{player.club}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="score-num text-sm font-semibold text-gray-200">
                      {player.matchesPlayed}
                    </div>
                    <div className="text-xs text-gray-500">Played</div>
                  </div>
                  <div>
                    <div className="score-num text-sm font-semibold text-gray-200">
                      {player.matchesWon}
                    </div>
                    <div className="text-xs text-gray-500">Won</div>
                  </div>
                  <div>
                    <div className="score-num text-sm font-semibold text-green-400">
                      {player.highestBreak}
                    </div>
                    <div className="text-xs text-gray-500">High</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
