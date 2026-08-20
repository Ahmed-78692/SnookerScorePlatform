'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface MatchSetupProps {
  onMatchCreated: (matchId: string, info: {
    player1Id: string;
    player1Name: string;
    player2Id: string;
    player2Name: string;
    bestOf: number;
  }) => void;
}

export function MatchSetup({ onMatchCreated }: MatchSetupProps) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [bestOf, setBestOf] = useState(5);
  const [tableNumber, setTableNumber] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      setError('Both player names are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate temp IDs for players (in production, would select from player DB)
      const p1Id = `player_${Date.now()}_1`;
      const p2Id = `player_${Date.now()}_2`;

      const match = await api.createMatch({
        player1Id: p1Id,
        player1Name: player1Name.trim(),
        player2Id: p2Id,
        player2Name: player2Name.trim(),
        bestOf,
        tableNumber,
      });

      onMatchCreated(match.id, {
        player1Id: p1Id,
        player1Name: player1Name.trim(),
        player2Id: p2Id,
        player2Name: player2Name.trim(),
        bestOf,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">New Match</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Player 1</label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:border-emerald-500"
              placeholder="Ahmed Sayed"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Player 2</label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:border-emerald-500"
              placeholder="Player B"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Best of</label>
            <div className="grid grid-cols-5 gap-2">
              {[3, 5, 7, 9, 11].map((n) => (
                <button
                  key={n}
                  onClick={() => setBestOf(n)}
                  className={`py-3 rounded-lg font-bold text-lg transition ${
                    bestOf === n
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Table Number (optional)</label>
            <input
              type="number"
              value={tableNumber || ''}
              onChange={(e) => setTableNumber(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:border-emerald-500"
              placeholder="1"
              min={1}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg font-bold text-lg transition"
          >
            {loading ? 'Creating...' : 'Start Match'}
          </button>
        </div>
      </div>
    </div>
  );
}
