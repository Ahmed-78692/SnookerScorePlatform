'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  format: string;
  bestOfFrames: number;
  maxPlayers: number;
  currentPlayerCount: number;
  status: string;
  entryFee?: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<Tournament[]>('/api/tournaments')
      .then(setTournaments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading tournaments...</div>
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
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Tournaments</h1>
          <Link
            href="/tournaments/create"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Tournament
          </Link>
        </div>

        {/* Tournament Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No tournaments found. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-green-700/50 transition-colors group"
              >
                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors mb-2 truncate">
                  {t.name}
                </h3>
                <div className="space-y-1.5 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span className="text-gray-300">
                      {new Date(t.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format</span>
                    <span className="text-gray-300">{t.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best of</span>
                    <span className="score-num text-gray-300">{t.bestOfFrames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Players</span>
                    <span className="score-num text-gray-300">
                      {t.currentPlayerCount}/{t.maxPlayers}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.status === 'InProgress'
                        ? 'bg-green-500/10 text-green-400'
                        : t.status === 'Completed'
                        ? 'bg-gray-500/10 text-gray-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
