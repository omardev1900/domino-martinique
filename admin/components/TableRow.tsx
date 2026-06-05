'use client';

import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { timeAgo } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminLog';

export type GameRoom = {
  roomId: string;
  roomName?: string;
  status?: string;
  players?: Array<{ uid: string; displayName?: string; status?: string }>;
  gameState?: any;
  gameMode?: string;
  difficulty?: string;
  createdAt?: Timestamp | Date | number;
  winningCondition?: number;
  turnDuration?: number;
  buyIn?: number;
  isPrivate?: boolean;
  createdBy?: string;
};

type TableRowProps = {
  room: GameRoom;
};

export default function TableRow({ room }: TableRowProps) {
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  const handleClose = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'rooms', room.roomId), { status: 'FINISHED' });
      await logAdminAction('close_room', { details: `${room.roomId} — ${room.roomName || '—'}` });
      setClosed(true);
    } catch (err) {
      console.error('Erreur fermeture:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status?: string) => {
    if (closed || status === 'FINISHED') {
      let result = '';
      if (room.gameState && room.gameState.players) {
        // Déterminer le vainqueur selon le mode
        const sorted = [...room.gameState.players].sort((a: any, b: any) => {
          if (room.gameMode === 'SCORE') return b.score - a.score;
          return b.mancheWins - a.mancheWins; // VICTOIRE, MANCHE, COCHON...
        });
        const winner = sorted[0];
        if (winner && (winner.score > 0 || winner.mancheWins > 0)) {
           result = ` (🏆 ${winner.name || winner.displayName})`;
        }
      }
      return (
        <span className="inline-block bg-gray-700/40 text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-gray-600/30 tracking-wide">
          TERMINÉ{result}
        </span>
      );
    }
    if (status === 'PLAYING') {
      const gState = room.gameState;
      const progression = gState ? ` M${gState.mancheNumber || 1}/R${gState.roundNumber || 1}` : '';
      return (
        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wide animate-pulse">
          EN JEU{progression}
        </span>
      );
    }
    return (
      <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-400/20 tracking-wide">
        EN ATTENTE
      </span>
    );
  };

  const getObjective = () => {
    if (!room.gameMode || !room.winningCondition) return '—';
    const c = room.winningCondition;
    switch (room.gameMode) {
      case 'SCORE': return `${c} pts`;
      case 'VICTOIRE': return `${c} victoire${c > 1 ? 's' : ''}`;
      case 'COCHON': return `${c} cochon${c > 1 ? 's' : ''}`;
      case 'MANCHE': return `${c} manche${c > 1 ? 's' : ''}`;
      default: return `${c}`;
    }
  };

  const renderPlayers = () => {
    // If game has started, use gameState.players to include bots and real connection status
    const playersToRender = room.gameState?.players 
      ? room.gameState.players.map((gp: any) => ({
          uid: gp.id,
          displayName: gp.name || gp.displayName,
          status: gp.status
        }))
      : room.players || [];

    if (playersToRender.length === 0) return <span className="text-gray-500 text-xs">—</span>;
    return (
      <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
        {playersToRender.map((p: any) => {
          let icon = '🟢';
          if (p.status === 'BOT') icon = '🤖';
          if (p.status === 'DISCONNECTED') icon = '🔴';
          return (
            <span key={p.uid} className="inline-flex items-center gap-1 text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
              <span>{icon}</span> {p.displayName || 'Anonyme'}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      {/* Room code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span title={room.isPrivate ? 'Salle Privée' : 'Salle Publique'} className="text-sm">
            {room.isPrivate ? '🔒' : '🌍'}
          </span>
          <code className="text-yellow-400 font-mono text-xs bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
            {room.roomId.slice(0, 8).toUpperCase()}
          </code>
        </div>
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <p className="text-white font-medium text-sm">{room.roomName || '—'}</p>
        {renderPlayers()}
      </td>
      {/* Players count */}
      <td className="px-4 py-3 text-center">
        <span className="text-white font-semibold text-sm">
          {room.players?.length ?? 0}
        </span>
      </td>
      {/* Mode */}
      <td className="px-4 py-3 text-center">
        <span className="text-gray-300 text-sm">{room.gameMode || '—'}</span>
      </td>
      {/* Objective */}
      <td className="px-4 py-3 text-center">
        <span className="text-yellow-400 text-sm font-semibold">{getObjective()}</span>
      </td>
      {/* Status */}
      <td className="px-4 py-3 text-center">{statusBadge(room.status)}</td>
      {/* Created */}
      <td className="px-4 py-3 text-center">
        <span className="text-gray-400 text-sm">{timeAgo(room.createdAt)}</span>
      </td>
      {/* Action */}
      <td className="px-4 py-3 text-center">
        {!closed && room.status !== 'FINISHED' ? (
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Fermer'}
          </button>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
