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
  players?: Array<{ uid: string; displayName?: string }>;
  gameMode?: string;
  difficulty?: string;
  createdAt?: Timestamp | Date | number;
  winningCondition?: string;
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
      return (
        <span className="inline-block bg-gray-700/40 text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-gray-600/30 tracking-wide">
          TERMINÉ
        </span>
      );
    }
    if (status === 'PLAYING') {
      return (
        <span className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 tracking-wide animate-pulse">
          EN JEU
        </span>
      );
    }
    return (
      <span className="inline-block bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-400/20 tracking-wide">
        EN ATTENTE
      </span>
    );
  };

  const playerNames = room.players?.map((p) => p.displayName || 'Anonyme').join(', ') || '—';

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      {/* Room code */}
      <td className="px-4 py-3">
        <code className="text-yellow-400 font-mono text-xs bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
          {room.roomId.slice(0, 8).toUpperCase()}
        </code>
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <p className="text-white font-medium text-sm">{room.roomName || '—'}</p>
        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[160px]">{playerNames}</p>
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
      {/* Difficulty */}
      <td className="px-4 py-3 text-center">
        <span className="text-gray-300 text-sm">{room.difficulty || '—'}</span>
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
