'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
    collection,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/adminLog';

// ─── Types (miroir de mobile/src/core/ad.types.ts) ────────────────────────────

type AdFrequency = 'EVERY_TIME' | 'ONCE_PER_SESSION' | 'ONCE_PER_DAY';
type AdPlacement =
    | 'HOME'
    | 'BEFORE_SOLO'
    | 'AFTER_ROUND_SOLO'
    | 'END_OF_MANCHE_SOLO'
    | 'END_OF_MATCH_SOLO'
    | 'BEFORE_MULTI'
    | 'END_OF_MATCH_MULTI';

type Ad = {
    id: string;
    title: string;
    imageUrl: string;
    targetUrl: string | null;
    active: boolean;
    startsAt: number;
    endsAt: number;
    placements: AdPlacement[];
    frequency: AdFrequency;
    createdAt: number;
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<AdFrequency, string> = {
    EVERY_TIME: 'À chaque fois',
    ONCE_PER_SESSION: '1× / session',
    ONCE_PER_DAY: '1× / jour',
};

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
    HOME: 'Accueil',
    BEFORE_SOLO: 'Avant solo',
    AFTER_ROUND_SOLO: 'Après round (solo)',
    END_OF_MANCHE_SOLO: 'Fin manche (solo)',
    END_OF_MATCH_SOLO: 'Fin match (solo)',
    BEFORE_MULTI: 'Avant multi',
    END_OF_MATCH_MULTI: 'Fin match (multi)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveMs(v: unknown): number {
    if (v instanceof Timestamp) return v.toMillis();
    if (typeof v === 'number') return v;
    return 0;
}

function formatDate(ms: number): string {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setAds(
                snap.docs.map(d => ({
                    id: d.id,
                    title: (d.data().title as string) ?? '',
                    imageUrl: (d.data().imageUrl as string) ?? '',
                    targetUrl: (d.data().targetUrl as string | null) ?? null,
                    active: d.data().active === true,
                    startsAt: resolveMs(d.data().startsAt),
                    endsAt: resolveMs(d.data().endsAt),
                    placements: (d.data().placements as AdPlacement[]) ?? [],
                    frequency: (d.data().frequency as AdFrequency) ?? 'EVERY_TIME',
                    createdAt: resolveMs(d.data().createdAt),
                }))
            );
        } catch (err) {
            console.error('fetchAds error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAds(); }, []);

    const toggleActive = async (id: string, current: boolean, title: string) => {
        try {
            await updateDoc(doc(db, 'ads', id), { active: !current });
            await logAdminAction('toggle_news' as any, {
                details: `Pub ${!current ? 'activée' : 'désactivée'} : ${title}`,
            });
            fetchAds();
        } catch (err) {
            console.error('toggleActive error:', err);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Supprimer la publicité "${title}" ?`)) return;
        try {
            await deleteDoc(doc(db, 'ads', id));
            await logAdminAction('delete_news' as any, { details: `Pub supprimée : ${title}` });
            fetchAds();
        } catch (err) {
            console.error('handleDelete error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-6xl mx-auto">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Publicités</h1>
                        <p className="text-gray-400 mt-1 text-sm">
                            Popups admin-managed affichés dans l'application mobile.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/ads/new"
                        className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition-colors"
                    >
                        + Créer une pub
                    </Link>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="text-gray-500 text-center py-20">Chargement…</div>
                ) : ads.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                        <div className="text-5xl mb-4">📢</div>
                        <p className="text-gray-400 mb-4">Aucune publicité configurée.</p>
                        <Link
                            href="/dashboard/ads/new"
                            className="text-yellow-400 hover:text-yellow-300 font-medium text-sm underline"
                        >
                            Créer la première pub
                        </Link>
                    </div>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-800">
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-5 py-4 font-semibold">Publicité</th>
                                    <th className="px-5 py-4 font-semibold">Placements</th>
                                    <th className="px-5 py-4 font-semibold">Fréquence</th>
                                    <th className="px-5 py-4 font-semibold">Période</th>
                                    <th className="px-5 py-4 font-semibold">Statut</th>
                                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {ads.map(ad => (
                                    <tr key={ad.id} className="hover:bg-gray-800/30 transition-colors">

                                        {/* Titre + miniature */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {ad.imageUrl ? (
                                                    <img
                                                        src={ad.imageUrl}
                                                        alt=""
                                                        className="w-10 h-10 rounded-lg object-cover bg-gray-800 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 flex-shrink-0 text-lg">
                                                        📢
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-white">{ad.title}</div>
                                                    {ad.targetUrl && (
                                                        <div className="text-xs text-blue-400 truncate max-w-[180px]">
                                                            {ad.targetUrl}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Placements */}
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {ad.placements.slice(0, 2).map(p => (
                                                    <span
                                                        key={p}
                                                        className="px-2 py-0.5 text-[10px] font-medium bg-gray-800 text-gray-300 rounded-full whitespace-nowrap"
                                                    >
                                                        {PLACEMENT_LABELS[p] ?? p}
                                                    </span>
                                                ))}
                                                {ad.placements.length > 2 && (
                                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-800 text-gray-500 rounded-full">
                                                        +{ad.placements.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Fréquence */}
                                        <td className="px-5 py-4 text-gray-300 text-xs whitespace-nowrap">
                                            {FREQUENCY_LABELS[ad.frequency] ?? ad.frequency}
                                        </td>

                                        {/* Dates */}
                                        <td className="px-5 py-4 text-gray-400 text-xs">
                                            <div>{formatDate(ad.startsAt)}</div>
                                            <div>→ {formatDate(ad.endsAt)}</div>
                                        </td>

                                        {/* Toggle statut */}
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => toggleActive(ad.id, ad.active, ad.title)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors whitespace-nowrap ${
                                                    ad.active
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                }`}
                                            >
                                                {ad.active ? '● ACTIVE' : '○ INACTIVE'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/ads/${ad.id}`}
                                                    className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                                                >
                                                    Modifier
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(ad.id, ad.title)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
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
