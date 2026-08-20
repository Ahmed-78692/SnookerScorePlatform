'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ScorerInterface } from '@/components/scorer/ScorerInterface';
import { MatchSetup } from '@/components/scorer/MatchSetup';
import { LoginForm } from '@/components/scorer/LoginForm';
import { api } from '@/lib/api';

export default function ScorerPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{
    player1Id: string;
    player1Name: string;
    player2Id: string;
    player2Name: string;
    bestOf: number;
  } | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      setAuthenticated(true);
      const name = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
      setUserName(name || 'Scorer');
    }
  }, []);

  if (!authenticated) {
    return (
      <LoginForm onAuthenticated={(name) => {
        setAuthenticated(true);
        setUserName(name);
        if (typeof window !== 'undefined') localStorage.setItem('user_name', name);
      }} />
    );
  }

  if (!matchId || !matchInfo) {
    return <MatchSetup onMatchCreated={(id, info) => { setMatchId(id); setMatchInfo(info); }} />;
  }

  const liveUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/live/${matchId}` : '';
  const displayUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/display/${matchId}` : '';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar with match info & links */}
      <div className="bg-black/60 backdrop-blur border-b border-white/5 px-3 py-1.5 flex items-center justify-between">
        <button onClick={() => setShowQR(!showQR)} className="text-[10px] text-gray-400 hover:text-white transition">
          📡 Share
        </button>
        <span className="text-[10px] text-gray-600 font-mono">{matchId.slice(0, 8)}</span>
        <div className="flex gap-2 text-[10px]">
          <a href={`/display/${matchId}`} target="_blank" className="text-blue-400 hover:text-blue-300">TV</a>
          <a href={`/live/${matchId}`} target="_blank" className="text-emerald-400 hover:text-emerald-300">Live</a>
          <a href={`/overlay/${matchId}`} target="_blank" className="text-purple-400 hover:text-purple-300">OBS</a>
        </div>
      </div>

      {/* QR Code overlay */}
      {showQR && (
        <div className="bg-black/80 backdrop-blur px-4 py-4 flex flex-col items-center gap-3 border-b border-white/5">
          <p className="text-xs text-gray-400">Scan to watch this match live:</p>
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={liveUrl} size={140} />
          </div>
          <p className="text-[10px] text-gray-500 text-center break-all max-w-xs">{liveUrl}</p>
          <button onClick={() => setShowQR(false)} className="text-[10px] text-gray-500 hover:text-white mt-1">Close</button>
        </div>
      )}

      {/* Scorer */}
      <div className="flex-1">
        <ScorerInterface
          matchId={matchId}
          player1Id={matchInfo.player1Id}
          player1Name={matchInfo.player1Name}
          player2Id={matchInfo.player2Id}
          player2Name={matchInfo.player2Name}
        />
      </div>
    </div>
  );
}
