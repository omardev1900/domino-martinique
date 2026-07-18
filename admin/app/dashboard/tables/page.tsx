'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TableRow, { GameRoom } from '@/components/TableRow';
import { logAdminAction } from '@/lib/adminLog';

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'FINISHED'>('ACTIVE');
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState('');

  // Fetch ACTIVE tables (real-time)
  useEffect(() => {
    if (activeTab !== 'ACTIVE') return;
    
    setLoading(true);
    setRooms([]); // Clear finished rooms
    // FIX-ADMIN: Suppression du filtre lastActivity >= 6h.
    // Ce filtre cachait les salles bloquées (fantômes) qui sont précisément celles
    // qu'un admin doit pouvoir voir et fermer manuellement.
    // Les salles périmées sont maintenant marquées visuellement côté UI (badge "Bloquée").
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['WAITING', 'PLAYING'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: GameRoom[] = snap.docs.map((d) => ({
        roomId: d.id,
        ...d.data(),
      } as GameRoom));
      // Sort: PLAYING first, then WAITING, then by createdAt desc
      data.sort((a, b) => {
        if (a.status === 'PLAYING' && b.status !== 'PLAYING') return -1;
        if (a.status !== 'PLAYING' && b.status === 'PLAYING') return 1;
        return 0;
      });
      setRooms(data);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  // Fetch FINISHED tables (one-time fetch)
  useEffect(() => {
    if (activeTab !== 'FINISHED') return;

    setLoading(true);
    setRooms([]); // Clear active rooms
    const fetchFinished = async () => {
      try {
        // Enlève orderBy('createdAt', 'desc') pour éviter l'erreur d'index manquant sur Firestore
        const q = query(
          collection(db, 'rooms'),
          where('status', '==', 'FINISHED'),
          limit(50)
        );
        const snap = await getDocs(q);
        const data: GameRoom[] = snap.docs.map((d) => ({
          roomId: d.id,
          ...d.data(),
        } as GameRoom));
        
        // Tri local par date de création (les plus récents en premier)
        data.sort((a, b) => {
          const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toMillis?.() || 0;
          const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toMillis?.() || 0;
          return timeB - timeA;
        });
        
        setRooms(data);
      } catch (e) {
        console.error("Erreur chargement tables terminées", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFinished();
  }, [activeTab]);

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupMsg('');
    try {
      const res = await fetch('/api/rooms/cleanup', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const msg = data.deleted === 0 ? 'Aucune room fantôme trouvée.' : `${data.deleted} room${data.deleted > 1 ? 's' : ''} supprimée${data.deleted > 1 ? 's' : ''}.`;
      setCleanupMsg(msg);
      if (data.deleted > 0) await logAdminAction('cleanup_rooms', { details: `${data.deleted} rooms supprimées` });
    } catch (err: any) {
      setCleanupMsg(`Erreur : ${err.message}`);
    } finally {
      setCleaning(false);
      setTimeout(() => setCleanupMsg(''), 5000);
    }
  };

  const playingCount = activeTab === 'ACTIVE' ? rooms.filter((r) => r.status === 'PLAYING').length : 0;
  const waitingCount = activeTab === 'ACTIVE' ? rooms.filter((r) => r.status === 'WAITING').length : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Suivi des Salles</h1>
          <p className="text-gray-400 mt-1 text-sm">Surveillance des tables actives et historiques</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeTab === 'ACTIVE' && (
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-sm font-medium text-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={cleaning ? 'animate-spin inline-block' : ''}>🧹</span>
              {cleaning ? 'Nettoyage…' : 'Nettoyer rooms fantômes'}
            </button>
          )}
          {activeTab === 'ACTIVE' && (
            <>
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-semibold">
                  {playingCount} en jeu
                </span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400 text-sm font-semibold">
                  {waitingCount} en attente
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'ACTIVE' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Salles en cours
        </button>
        <button
          onClick={() => setActiveTab('FINISHED')}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'FINISHED' ? 'border-gray-300 text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Historique (Terminées)
        </button>
      </div>

      {/* Cleanup feedback */}
      {cleanupMsg && (
        <div className="mb-4 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm">
          🧹 {cleanupMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-white font-semibold">
            {loading ? 'Chargement…' : `${rooms.length} salle${rooms.length !== 1 ? 's' : ''} ${activeTab === 'ACTIVE' ? 'active' : 'terminée'}${rooms.length !== 1 ? 's' : ''}`}
          </p>
          {activeTab === 'ACTIVE' ? (
            <span className="flex items-center gap-2 text-yellow-400 text-xs font-medium bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Temps réel
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gray-400 text-xs font-medium bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">
              Dernières 50 salles
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement des salles…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-4">🎲</p>
            <p className="text-gray-400 font-semibold text-lg">Aucune table {activeTab === 'ACTIVE' ? 'active' : 'terminée'}</p>
            <p className="text-gray-600 text-sm mt-2">
              {activeTab === 'ACTIVE' 
                ? 'Les salles en cours de jeu ou en attente apparaîtront ici automatiquement'
                : 'Les salles terminées apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code salle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom / Joueurs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Joueurs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Objectif
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut / Vainqueur
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Créé il y a
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <TableRow key={room.roomId} room={room} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info footer */}
      {!loading && rooms.length > 0 && activeTab === 'ACTIVE' && (
        <p className="text-gray-600 text-xs mt-4 text-center">
          Les données se mettent à jour automatiquement • Fermer une salle la marque comme FINISHED
        </p>
      )}
    </div>
  );
}
