'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';

interface TournamentPlayer {
  id: string;
  name: string;
  seed?: number;
}

interface TournamentMatch {
  id: string;
  player1Name: string;
  player2Name: string;
  player1FramesWon: number;
  player2FramesWon: number;
  status: string;
  round?: string;
}

interface TournamentDetail {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  format: string;
  bestOfFrames: number;
  maxPlayers: number;
  description?: string;
  status: string;
  entryFee?: number;
  numberOfTables?: number;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
}

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApi<TournamentDetail>(`/api/tournaments/${id}`)
      .then(setTournament)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading tournament...</div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Tournament not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/tournaments"
          className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
        >
          ← All Tournaments
        </Link>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
              {tournament.description && (
                <p className="text-gray-400 mt-1 text-sm">{tournament.description}</p>
              )}
            </div>
            <span
              className={`self-start text-xs font-medium px-3 py-1 rounded-full ${
                tournament.status === 'InProgress'
                  ? 'bg-green-500/10 text-green-400'
                  : tournament.status === 'Completed'
                  ? 'bg-gray-500/10 text-gray-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {tournament.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-800">
            <div>
              <div className="text-xs text-gray-500 uppercase">Format</div>
              <div className="text-sm text-gray-200 mt-0.5">{tournament.format}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Best Of</div>
              <div className="text-sm text-gray-200 mt-0.5 score-num">
                {tournament.bestOfFrames}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Start Date</div>
              <div className="text-sm text-gray-200 mt-0.5">
                {new Date(tournament.startDate).toLocaleDateString()}
              </div>
            </div>
            {tournament.entryFee != null && (
              <div>
                <div className="text-xs text-gray-500 uppercase">Entry Fee</div>
                <div className="text-sm text-gray-200 mt-0.5 score-num">
                  £{tournament.entryFee}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Players ({tournament.players.length}/{tournament.maxPlayers})
          </h2>
          {tournament.players.length === 0 ? (
            <p className="text-gray-500 text-sm">No players registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {tournament.players.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-green-900/40 flex items-center justify-center text-xs text-green-400 font-medium">
                    {player.seed || '–'}
                  </div>
                  <span className="text-sm text-gray-200 truncate">{player.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Matches */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Matches</h2>
          {tournament.matches.length === 0 ? (
            <p className="text-gray-500 text-sm">No matches scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {tournament.matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/live/${match.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    {match.round && (
                      <span className="text-xs text-gray-500 block mb-0.5">
                        {match.round}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-200">{match.player1Name}</span>
                      <span className="score-num text-white font-semibold">
                        {match.player1FramesWon}
                      </span>
                      <span className="text-gray-600">-</span>
                      <span className="score-num text-white font-semibold">
                        {match.player2FramesWon}
                      </span>
                      <span className="text-gray-200">{match.player2Name}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      match.status === 'InProgress'
                        ? 'bg-green-500/10 text-green-400'
                        : match.status === 'Completed'
                        ? 'bg-gray-500/10 text-gray-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {match.status === 'InProgress' ? 'LIVE' : match.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
