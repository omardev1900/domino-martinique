'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type PlayerProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  avatarId?: string;
  isBanned?: boolean;
  // Stats stockées sous stats.{}
  stats?: {
    gamesPlayed?: number;
    gamesWon?: number;
    coins?: number;
    xp?: number;
    level?: number;
    diamonds?: number;
    leaguePoints?: number;
    leagueGrade?: string;
    totalCochonsInflicted?: number;
    totalPointsAccumulated?: number;
  };
  banReason?: string | null;
  bannedAt?: number | null;
  // Économie stockée sous economy.{}
  economy?: {
    coins?: number;
    diamonds?: number;
  };
};

type PlayerRowProps = {
  player: PlayerProfile;
  onUpdated: () => void;
  onSelect: (player: PlayerProfile) => void;
};

export default function PlayerRow({ player, onUpdated, onSelect }: PlayerRowProps) {
  const [loading, setLoading] = useState(false);

  const initial = (player.displayName || player.uid || '?')[0].toUpperCase();

  // Coins : economy.coins en priorité, sinon stats.coins
  const coins = player.economy?.coins ?? player.stats?.coins ?? 0;
  const level = player.stats?.level ?? 0;
  const gamesWon = player.stats?.gamesWon ?? 0;
  const gamesPlayed = player.stats?.gamesPlayed ?? 0;

  const handleToggleBan = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', player.uid), {
        isBanned: !player.isBanned,
      });
      onUpdated();
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr
      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer"
      onClick={() => onSelect(player)}
    >
      {/* Avatar */}
      <td className="px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">
          {initial}
        </div>
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <p className="text-white font-medium text-sm">{player.displayName || <span className="text-gray-600 italic">Sans nom</span>}</p>
        <p className="text-gray-600 text-xs font-mono mt-0.5">{player.uid.slice(0, 12)}…</p>
      </td>
      {/* Email */}
      <td className="px-4 py-3">
        <p className="text-gray-400 text-sm">{player.email || <span className="text-gray-700 italic">—</span>}</p>
      </td>
      {/* Level */}
      <td className="px-4 py-3 text-center">
        <span className="inline-block bg-gray-800 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400/20">
          Niv. {level}
        </span>
      </td>
      {/* Coins */}
      <td className="px-4 py-3 text-center">
        <span className="text-yellow-400 font-semibold text-sm">
          🪙 {coins.toLocaleString('fr-FR')}
        </span>
      </td>
      {/* Games */}
      <td className="px-4 py-3 text-center">
        <span className="text-white text-sm">
          {gamesWon}
          <span className="text-gray-500"> / </span>
          <span className="text-gray-400">{gamesPlayed}</span>
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3 text-center">
        {player.isBanned ? (
          <span className="inline-block bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20 tracking-wide">
            BANNI
          </span>
        ) : (
          <span className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wide">
            ACTIF
          </span>
        )}
      </td>
      {/* Actions */}
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleToggleBan}
          disabled={loading}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            player.isBanned
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40'
              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40'
          }`}
        >
          {loading ? '...' : player.isBanned ? 'Débannir' : 'Bannir'}
        </button>
      </td>
    </tr>
  );
}
