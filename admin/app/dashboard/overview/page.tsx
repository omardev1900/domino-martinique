'use client';

import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StatCard from '@/components/StatCard';
import { formatTimestamp } from '@/lib/adminAuth';

type RoomRow = {
  roomId: string;
  roomName?: string;
  players?: Array<{ uid: string; displayName?: string }>;
  gameMode?: string;
  status?: string;
  createdAt?: any;
};

type Stats = {
  totalPlayers: number;
  activeRooms: number;
  gamesToday: number;
  bannedPlayers: number;
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats>({ totalPlayers: 0, activeRooms: 0, gamesToday: 0, bannedPlayers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentRooms, setRecentRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  useEffect(() => {
    // Total players
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const total = snap.size;
      const banned = snap.docs.filter((d) => d.data().isBanned === true).length;
      setStats((prev) => ({ ...prev, totalPlayers: total, bannedPlayers: banned }));
      setStatsLoading(false);
    });

    // Active rooms: status PLAYING ou WAITING avec activité dans les dernières 3h
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    const activeQ = query(
      collection(db, 'rooms'),
      where('status', 'in', ['PLAYING', 'WAITING']),
      where('lastActivity', '>=', threeHoursAgo)
    );
    const unsubActive = onSnapshot(activeQ, (snap) => {
      setStats((prev) => ({ ...prev, activeRooms: snap.size }));
    });

    // Games today: createdAt est stocké en millisecondes (number)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayQ = query(
      collection(db, 'rooms'),
      where('createdAt', '>=', todayMidnight.getTime())
    );
    const unsubToday = onSnapshot(todayQ, (snap) => {
      setStats((prev) => ({ ...prev, gamesToday: snap.size }));
    });

    // Recent rooms
    const recentQ = query(
      collection(db, 'rooms'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubRecent = onSnapshot(recentQ, (snap) => {
      const rooms: RoomRow[] = snap.docs.map((d) => ({
        roomId: d.id,
        ...d.data(),
      } as RoomRow));
      setRecentRooms(rooms);
      setRoomsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubActive();
      unsubToday();
      unsubRecent();
    };
  }, []);

  const statusBadge = (status?: string) => {
    if (status === 'PLAYING') {
      return (
        <span className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-500/20">
          EN JEU
        </span>
      );
    }
    if (status === 'WAITING') {
      return (
        <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-400/20">
          EN ATTENTE
        </span>
      );
    }
    return (
      <span className="inline-block bg-gray-700/40 text-gray-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-600/30">
        {status || '—'}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble</h1>
        <p className="text-gray-400 mt-1 text-sm">Statistiques en temps réel de la plateforme</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Joueurs inscrits"
          value={stats.totalPlayers}
          icon="👥"
          accent
          loading={statsLoading}
        />
        <StatCard
          title="Tables actives"
          value={stats.activeRooms}
          icon="🎲"
          loading={statsLoading}
        />
        <StatCard
          title="Parties aujourd'hui"
          value={stats.gamesToday}
          icon="📅"
          loading={statsLoading}
        />
        <StatCard
          title="Joueurs bannis"
          value={stats.bannedPlayers}
          icon="🚫"
          loading={statsLoading}
        />
      </div>

      {/* Recent rooms */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Dernières salles créées</h2>
            <p className="text-gray-500 text-xs mt-0.5">10 salles les plus récentes</p>
          </div>
          <span className="text-yellow-400 text-xs font-medium bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
            En direct
          </span>
        </div>

        {roomsLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentRooms.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🎲</p>
            <p className="text-gray-400 font-medium">Aucune salle trouvée</p>
            <p className="text-gray-600 text-sm mt-1">Les salles apparaîtront ici dès leur création</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code salle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joueurs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRooms.map((room) => (
                  <tr key={room.roomId} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-yellow-400 font-mono text-xs bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                        {room.roomId.slice(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">{room.roomName || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-semibold text-sm">
                        {room.players?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300 text-sm">{room.gameMode || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">{statusBadge(room.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-400 text-sm">{formatTimestamp(room.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
