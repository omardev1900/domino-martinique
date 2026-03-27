'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProfile } from '@/components/PlayerRow';

type Category = 'victories' | 'coins' | 'level' | 'leaguePoints' | 'gamesPlayed' | 'cochons';

const CATEGORIES: { key: Category; label: string; icon: string; unit: string; getValue: (p: PlayerProfile) => number }[] = [
  { key: 'victories',    label: 'Victoires',      icon: '🏆', unit: 'victoires', getValue: (p) => p.stats?.gamesWon ?? 0 },
  { key: 'coins',        label: 'Coins',           icon: '🪙', unit: 'coins',    getValue: (p) => p.economy?.coins ?? p.stats?.coins ?? 0 },
  { key: 'level',        label: 'Niveau',          icon: '⭐', unit: 'niv.',     getValue: (p) => p.stats?.level ?? 0 },
  { key: 'leaguePoints', label: 'Points de ligue', icon: '🐷', unit: 'pts',      getValue: (p) => p.stats?.leaguePoints ?? 0 },
  { key: 'gamesPlayed',  label: 'Parties jouées',  icon: '🎲', unit: 'parties',  getValue: (p) => p.stats?.gamesPlayed ?? 0 },
  { key: 'cochons',      label: 'Cochons infligés', icon: '🥩', unit: 'cochons', getValue: (p) => p.stats?.totalCochonsInflicted ?? 0 },
];

const LEAGUE_LABELS: Record<string, string> = {
  APPRENTI: '🔰 Apprenti',
  MAITRE:   '🥈 Maître',
  ROI:      '👑 Roi',
  LEGENDE:  '🔥 Légende',
};

const PODIUM_COLORS = ['text-yellow-400 bg-yellow-400/10 border-yellow-400/30', 'text-gray-300 bg-gray-600/20 border-gray-500/30', 'text-orange-400 bg-orange-500/10 border-orange-500/20'];
const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('victories');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setPlayers(data.users ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers, refreshKey]);

  const cat = CATEGORIES.find((c) => c.key === category)!;
  const sorted = [...players]
    .filter((p) => cat.getValue(p) > 0)
    .sort((a, b) => cat.getValue(b) - cat.getValue(a))
    .slice(0, 50);

  const winRate = (p: PlayerProfile) => {
    const gp = p.stats?.gamesPlayed ?? 0;
    const gw = p.stats?.gamesWon ?? 0;
    return gp > 0 ? Math.round((gw / gp) * 100) : 0;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Classement</h1>
          <p className="text-gray-400 mt-1 text-sm">Top 50 joueurs par catégorie</p>
        </div>
        <button onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 transition-all disabled:opacity-50">
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span> Actualiser
        </button>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              category === c.key
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
            }`}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement du classement…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <p className="text-4xl mb-3">{cat.icon}</p>
          <p className="text-gray-400 font-medium">Aucun joueur avec des {cat.label.toLowerCase()}</p>
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {sorted.length >= 3 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
                const rank = i === 0 ? 1 : i === 1 ? 0 : 2; // reorder: 2nd, 1st, 3rd
                const realRank = rank === 0 ? 1 : rank === 1 ? 2 : 3;
                const colors = PODIUM_COLORS[realRank - 1];
                const height = realRank === 1 ? 'pt-0' : realRank === 2 ? 'pt-6' : 'pt-10';
                return (
                  <div key={p.uid} className={`flex flex-col items-center ${height}`}>
                    <p className="text-3xl mb-2">{PODIUM_MEDALS[realRank - 1]}</p>
                    <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-xl ${colors}`}>
                      {(p.displayName || p.uid)[0].toUpperCase()}
                    </div>
                    <p className="text-white font-semibold text-sm mt-2 text-center truncate max-w-[120px]">{p.displayName || 'Anonyme'}</p>
                    <p className={`text-sm font-bold mt-0.5 ${realRank === 1 ? 'text-yellow-400' : realRank === 2 ? 'text-gray-300' : 'text-orange-400'}`}>
                      {cat.getValue(p).toLocaleString('fr-FR')} {cat.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <p className="text-white font-semibold">{cat.icon} Classement {cat.label} — {sorted.length} joueurs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Rang</th>
                    <th className="px-4 py-3 w-10" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joueur</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat.icon} {cat.label}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Niveau</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ligue</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Victoires / Parties</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, idx) => {
                    const rank = idx + 1;
                    const medal = rank <= 3 ? PODIUM_MEDALS[rank - 1] : null;
                    return (
                      <tr key={p.uid} className={`border-b border-gray-800/60 transition-colors ${rank <= 3 ? 'bg-yellow-400/3' : 'hover:bg-gray-800/30'}`}>
                        <td className="px-4 py-3.5 text-center">
                          {medal ? (
                            <span className="text-xl">{medal}</span>
                          ) : (
                            <span className="text-gray-500 font-mono text-sm">{rank}</span>
                          )}
                        </td>
                        <td className="px-2 py-3.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank === 1 ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-400' : 'bg-gray-800 text-gray-300'}`}>
                            {(p.displayName || p.uid)[0].toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-white font-medium text-sm">{p.displayName || <span className="text-gray-600 italic">Anonyme</span>}</p>
                          <p className="text-gray-600 text-xs font-mono mt-0.5">{p.uid.slice(0, 10)}…</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`font-bold text-sm ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                            {cat.getValue(p).toLocaleString('fr-FR')}
                          </span>
                          <span className="text-gray-600 text-xs ml-1">{cat.unit}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-2 py-1 rounded-full border border-gray-700">
                            Niv. {p.stats?.level ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs text-gray-400">{LEAGUE_LABELS[p.stats?.leagueGrade ?? ''] ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-white text-sm">{p.stats?.gamesWon ?? 0}</span>
                          <span className="text-gray-600"> / </span>
                          <span className="text-gray-400 text-sm">{p.stats?.gamesPlayed ?? 0}</span>
                          <p className="text-gray-600 text-xs mt-0.5">{winRate(p)}% win</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
