'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logAdminAction } from '@/lib/adminLog';
import { PlayerProfile } from '@/components/PlayerRow';
import PlayerModal from '@/components/PlayerModal';

type BannedPlayer = PlayerProfile & {
  banReason?: string;
  bannedAt?: number;
};

function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BansPage() {
  const [allBanned, setAllBanned] = useState<BannedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unbanning, setUnbanning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);

  const fetchBanned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const banned: BannedPlayer[] = (data.users as BannedPlayer[]).filter((u) => u.isBanned);
      // Sort by most recently banned
      banned.sort((a, b) => (b.bannedAt ?? 0) - (a.bannedAt ?? 0));
      setAllBanned(banned);
    } catch (err) {
      console.error('Erreur chargement bans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanned(); }, [fetchBanned, refreshKey]);

  const handleUnban = async (player: BannedPlayer) => {
    setUnbanning(player.uid);
    try {
      await updateDoc(doc(db, 'users', player.uid), {
        isBanned: false,
        banReason: null,
        bannedAt: null,
      });
      await logAdminAction('unban', { targetUid: player.uid, targetName: player.displayName || player.uid });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Erreur unban:', err);
    } finally {
      setUnbanning(null);
    }
  };

  const filtered = allBanned.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.displayName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.banReason || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onUpdated={() => { setRefreshKey((k) => k + 1); setSelectedPlayer(null); }}
        />
      )}

      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des bans</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {loading ? 'Chargement…' : `${allBanned.length} joueur${allBanned.length !== 1 ? 's' : ''} banni${allBanned.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 transition-all disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            Actualiser
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou motif…"
              className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-4">
              <div className="w-9 h-9 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Chargement des bans…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-5xl mb-4">🚫</p>
              <p className="text-gray-400 font-semibold text-lg">
                {search ? 'Aucun résultat' : 'Aucun joueur banni'}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {search ? 'Essayez un autre terme' : 'La liste des joueurs bannis apparaîtra ici'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 w-12" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joueur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date du ban</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stats</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((player) => (
                    <BanRow
                      key={player.uid}
                      player={player}
                      unbanning={unbanning === player.uid}
                      onUnban={handleUnban}
                      onSelect={setSelectedPlayer}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BanRow({
  player,
  unbanning,
  onUnban,
  onSelect,
}: {
  player: BannedPlayer;
  unbanning: boolean;
  onUnban: (p: BannedPlayer) => void;
  onSelect: (p: PlayerProfile) => void;
}) {
  const initial = (player.displayName || player.uid || '?')[0].toUpperCase();
  const gamesPlayed = player.stats?.gamesPlayed ?? 0;
  const gamesWon = player.stats?.gamesWon ?? 0;

  return (
    <tr
      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer"
      onClick={() => onSelect(player)}
    >
      {/* Avatar */}
      <td className="px-4 py-4">
        <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm">
          {initial}
        </div>
      </td>
      {/* Name */}
      <td className="px-4 py-4">
        <p className="text-white font-medium text-sm">{player.displayName || <span className="text-gray-600 italic">Sans nom</span>}</p>
        <p className="text-gray-600 text-xs font-mono mt-0.5">{player.uid.slice(0, 12)}…</p>
      </td>
      {/* Email */}
      <td className="px-4 py-4">
        <p className="text-gray-400 text-sm">{player.email || <span className="text-gray-700 italic">—</span>}</p>
      </td>
      {/* Reason */}
      <td className="px-4 py-4">
        {player.banReason ? (
          <span className="inline-block bg-red-500/10 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-500/20">
            {player.banReason}
          </span>
        ) : (
          <span className="text-gray-600 text-xs italic">Non renseigné</span>
        )}
      </td>
      {/* Date */}
      <td className="px-4 py-4 text-center">
        <span className="text-gray-400 text-sm">{formatDate(player.bannedAt)}</span>
      </td>
      {/* Stats */}
      <td className="px-4 py-4 text-center">
        <span className="text-gray-400 text-sm">
          {gamesWon}<span className="text-gray-600"> / </span>{gamesPlayed}
        </span>
        <p className="text-gray-600 text-xs mt-0.5">V/P</p>
      </td>
      {/* Unban */}
      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onUnban(player)}
          disabled={unbanning}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {unbanning ? '...' : 'Débannir'}
        </button>
      </td>
    </tr>
  );
}
