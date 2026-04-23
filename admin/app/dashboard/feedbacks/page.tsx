'use client';

import React, { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, where, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type FeedbackFilter = 'all' | 'unread' | 'read';

type FeedbackDoc = {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: { seconds: number } | null;
  appVersion: string;
  readAt: { seconds: number } | null;
};

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackDoc)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleMarkRead = async (id: string) => {
    await updateDoc(doc(db, 'feedbacks', id), { readAt: serverTimestamp() });
  };

  const handleMarkUnread = async (id: string) => {
    await updateDoc(doc(db, 'feedbacks', id), { readAt: null });
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const q = query(collection(db, 'feedbacks'), where('readAt', '==', null));
      const snap = await getDocs(q);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.update(d.ref, { readAt: serverTimestamp() }));
      await batch.commit();
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered = feedbacks.filter((f) => {
    if (filter === 'unread') return !f.readAt;
    if (filter === 'read') return !!f.readAt;
    return true;
  });

  const unreadCount = feedbacks.filter((f) => !f.readAt).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedbacks joueurs</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Retours envoyés depuis le bouton MDC dans l&apos;application
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 transition-all disabled:opacity-50"
          >
            {markingAll ? 'En cours…' : `Tout marquer lu (${unreadCount})`}
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex gap-2">
        {(['all', 'unread', 'read'] as FeedbackFilter[]).map((f) => {
          const labels: Record<FeedbackFilter, string> = { all: 'Tous', unread: 'Non lus', read: 'Lus' };
          const counts = { all: feedbacks.length, unread: unreadCount, read: feedbacks.length - unreadCount };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === f
                  ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                  : 'text-gray-500 bg-gray-800/50 border-gray-700 hover:text-gray-300'
              }`}
            >
              {labels[f]}
              <span className="opacity-70">({counts[f]})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-white font-semibold">
            {loading ? 'Chargement…' : `${filtered.length} feedback${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <span className="flex items-center gap-2 text-yellow-400 text-xs font-medium bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Temps réel
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement des feedbacks…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-gray-400 font-semibold text-lg">Aucun feedback</p>
            <p className="text-gray-600 text-sm mt-2">
              Les retours joueurs apparaîtront ici automatiquement
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((fb) => (
              <div
                key={fb.id}
                className={`px-6 py-4 flex gap-4 transition-colors ${
                  !fb.readAt ? 'bg-yellow-400/[0.03]' : ''
                }`}
              >
                {/* Indicateur non lu */}
                <div className="flex-shrink-0 pt-1">
                  {!fb.readAt ? (
                    <span className="w-2 h-2 rounded-full bg-yellow-400 block mt-1" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-700 block mt-1" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm">{fb.displayName}</span>
                    <span className="text-gray-600 font-mono text-xs">{fb.uid.slice(0, 12)}…</span>
                    <span className="text-gray-600 text-xs">v{fb.appVersion}</span>
                    <span className="text-gray-500 text-xs ml-auto">{formatDate(fb.createdAt)}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{fb.text}</p>
                  {fb.readAt && (
                    <p className="text-gray-600 text-xs mt-1.5">Lu le {formatDate(fb.readAt)}</p>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex items-start">
                  {!fb.readAt ? (
                    <button
                      onClick={() => handleMarkRead(fb.id)}
                      className="text-xs text-gray-500 hover:text-yellow-400 border border-gray-700 hover:border-yellow-400/30 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                    >
                      Marquer lu
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkUnread(fb.id)}
                      className="text-xs text-gray-600 hover:text-gray-400 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                    >
                      Non lu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
