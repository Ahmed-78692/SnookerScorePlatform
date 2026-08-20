'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/apiHelpers';

const FORMATS = [
  'Single Elimination',
  'Double Elimination',
  'Round Robin',
  'Swiss',
  'Group Stage + Knockout',
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    format: FORMATS[0],
    bestOfFrames: 5,
    maxPlayers: 16,
    numberOfTables: 4,
    entryFee: 0,
    description: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await fetchApi<{ id: string }>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push(`/tournaments/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/tournaments"
          className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block"
        >
          ← Back to Tournaments
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Create Tournament</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5"
        >
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Tournament Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600"
              placeholder="e.g. Friday Night Knockout"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-300 mb-1">
              Format
            </label>
            <select
              id="format"
              name="format"
              value={form.format}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="bestOfFrames" className="block text-sm font-medium text-gray-300 mb-1">
                Best Of
              </label>
              <input
                id="bestOfFrames"
                name="bestOfFrames"
                type="number"
                min={1}
                max={35}
                step={2}
                value={form.bestOfFrames}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 score-num"
              />
            </div>
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-1">
                Max Players
              </label>
              <input
                id="maxPlayers"
                name="maxPlayers"
                type="number"
                min={2}
                max={128}
                value={form.maxPlayers}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 score-num"
              />
            </div>
            <div>
              <label htmlFor="numberOfTables" className="block text-sm font-medium text-gray-300 mb-1">
                Tables
              </label>
              <input
                id="numberOfTables"
                name="numberOfTables"
                type="number"
                min={1}
                max={20}
                value={form.numberOfTables}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 score-num"
              />
            </div>
            <div>
              <label htmlFor="entryFee" className="block text-sm font-medium text-gray-300 mb-1">
                Entry Fee (£)
              </label>
              <input
                id="entryFee"
                name="entryFee"
                type="number"
                min={0}
                step={0.5}
                value={form.entryFee}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 score-num"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-600 resize-none"
              placeholder="Optional tournament description..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  );
}
