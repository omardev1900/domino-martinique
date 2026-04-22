'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
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

// ─── Config des enums (source de vérité pour les dropdowns/checkboxes) ────────

const ALL_PLACEMENTS: { value: AdPlacement; label: string; desc: string }[] = [
    { value: 'HOME',               label: 'Accueil',              desc: "Popup à l'ouverture de l'écran d'accueil" },
    { value: 'BEFORE_SOLO',        label: 'Avant partie solo',    desc: "Quand le joueur accède à l'écran de configuration solo" },
    { value: 'AFTER_ROUND_SOLO',   label: 'Après round (solo)',   desc: "Après chaque round terminé en solo" },
    { value: 'END_OF_MANCHE_SOLO', label: 'Fin de manche (solo)', desc: "À la fin d'une manche complète en solo" },
    { value: 'END_OF_MATCH_SOLO',  label: 'Fin de match (solo)',  desc: "À la fin d'un match complet en solo" },
    { value: 'BEFORE_MULTI',       label: 'Avant partie multi',   desc: "Lors de l'entrée dans une partie multijoueur" },
    { value: 'END_OF_MATCH_MULTI', label: 'Fin de match (multi)', desc: "À la fin d'un match multijoueur" },
];

const ALL_FREQUENCIES: { value: AdFrequency; label: string; desc: string }[] = [
    { value: 'EVERY_TIME',       label: 'À chaque fois',        desc: "Affiché à chaque occurrence du placement" },
    { value: 'ONCE_PER_SESSION', label: 'Une fois par session', desc: "Affiché une seule fois par démarrage de l'app" },
    { value: 'ONCE_PER_DAY',     label: 'Une fois par jour',    desc: "Affiché au maximum une fois par jour calendaire" },
];

// ─── Helpers date ─────────────────────────────────────────────────────────────

function resolveMs(v: unknown): number {
    if (v instanceof Timestamp) return v.toMillis();
    if (typeof v === 'number') return v;
    return 0;
}

function msToDatetimeLocal(ms: number): string {
    if (!ms) return '';
    const d = new Date(ms);
    // Format: YYYY-MM-DDThh:mm (local time via ISO splice)
    const offset = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function datetimeLocalToMs(s: string): number {
    if (!s) return 0;
    return new Date(s).getTime();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdFormPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const isNew = params.id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [active, setActive] = useState(true);
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [placements, setPlacements] = useState<AdPlacement[]>([]);
    const [frequency, setFrequency] = useState<AdFrequency>('EVERY_TIME');

    // Pré-remplit le formulaire si on est en mode édition
    useEffect(() => {
        if (isNew) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'ads', params.id));
                if (!snap.exists()) { setNotFound(true); return; }
                const d = snap.data();
                setTitle(d.title ?? '');
                setImageUrl(d.imageUrl ?? '');
                setTargetUrl(d.targetUrl ?? '');
                setActive(d.active !== false);
                setStartsAt(msToDatetimeLocal(resolveMs(d.startsAt)));
                setEndsAt(msToDatetimeLocal(resolveMs(d.endsAt)));
                setPlacements((d.placements as AdPlacement[]) ?? []);
                setFrequency((d.frequency as AdFrequency) ?? 'EVERY_TIME');
            } catch (err) {
                console.error('Ad load error:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id]);

    const togglePlacement = (p: AdPlacement) =>
        setPlacements(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { alert('Le titre est obligatoire.'); return; }
        if (!imageUrl.trim()) { alert("L'URL de l'image est obligatoire."); return; }
        if (placements.length === 0) { alert('Sélectionne au moins un placement.'); return; }
        if (!startsAt || !endsAt) { alert('Les dates de début et de fin sont obligatoires.'); return; }
        if (datetimeLocalToMs(startsAt) >= datetimeLocalToMs(endsAt)) {
            alert('La date de fin doit être postérieure à la date de début.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                title: title.trim(),
                imageUrl: imageUrl.trim(),
                targetUrl: targetUrl.trim() || null,
                active,
                startsAt: datetimeLocalToMs(startsAt),
                endsAt: datetimeLocalToMs(endsAt),
                placements,
                frequency,
            };

            if (isNew) {
                await addDoc(collection(db, 'ads'), { ...data, createdAt: Date.now() });
                await logAdminAction('create_news' as any, { details: `Pub créée : ${data.title}` });
            } else {
                await updateDoc(doc(db, 'ads', params.id), data);
                await logAdminAction('edit_news' as any, { details: `Pub modifiée : ${data.title}` });
            }

            router.push('/dashboard/ads');
        } catch (err) {
            console.error('Ad save error:', err);
            alert("Erreur lors de l'enregistrement. Vérifie la console.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-gray-500">Chargement…</div>
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-8">
            <div>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-400 mb-4">Publicité introuvable.</p>
                <Link href="/dashboard/ads" className="text-yellow-400 hover:text-yellow-300 text-sm underline">
                    ← Retour à la liste
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-2xl mx-auto">

                {/* ── En-tête ── */}
                <div className="mb-8">
                    <Link
                        href="/dashboard/ads"
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                        ← Retour aux publicités
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-3">
                        {isNew ? 'Créer une publicité' : 'Modifier la publicité'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ── Contenu ── */}
                    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contenu</h2>

                        {/* Titre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Titre <span className="text-yellow-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Nom interne de la publicité"
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                URL de l'image <span className="text-yellow-400">*</span>
                            </label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                placeholder="https://…"
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none transition-colors"
                            />
                            {imageUrl && (
                                <div className="mt-3 rounded-xl overflow-hidden bg-gray-800 max-h-36 flex justify-center items-center">
                                    <img
                                        src={imageUrl}
                                        alt="Aperçu"
                                        className="max-h-36 object-contain"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* URL cible */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                URL cible{' '}
                                <span className="text-gray-500 font-normal">(optionnel)</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Lien ouvert lorsque l'utilisateur tape sur la pub.
                            </p>
                            <input
                                type="url"
                                value={targetUrl}
                                onChange={e => setTargetUrl(e.target.value)}
                                placeholder="https://…"
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Toggle active */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setActive(v => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span
                                className="text-sm font-medium text-gray-300 cursor-pointer select-none"
                                onClick={() => setActive(v => !v)}
                            >
                                Pub{' '}
                                {active
                                    ? <span className="text-green-400">active</span>
                                    : <span className="text-red-400">inactive</span>
                                }
                            </span>
                        </div>
                    </section>

                    {/* ── Période de diffusion ── */}
                    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Période de diffusion</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Début <span className="text-yellow-400">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startsAt}
                                    onChange={e => setStartsAt(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Fin <span className="text-yellow-400">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={endsAt}
                                    onChange={e => setEndsAt(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ── Placements ── */}
                    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Placements <span className="text-yellow-400">*</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Sélectionne les écrans où cette pub peut apparaître.
                            </p>
                        </div>
                        <div className="space-y-2">
                            {ALL_PLACEMENTS.map(({ value, label, desc }) => {
                                const checked = placements.includes(value);
                                return (
                                    <label
                                        key={value}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                            checked
                                                ? 'bg-yellow-400/5 border-yellow-400/30'
                                                : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => togglePlacement(value)}
                                            className="mt-0.5 accent-yellow-400"
                                        />
                                        <div>
                                            <div className={`text-sm font-medium ${checked ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                {label}
                                            </div>
                                            <div className="text-xs text-gray-500">{desc}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Fréquence ── */}
                    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Fréquence d'affichage
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                À quelle fréquence cette pub est montrée au même utilisateur.
                            </p>
                        </div>
                        <div className="space-y-2">
                            {ALL_FREQUENCIES.map(({ value, label, desc }) => (
                                <label
                                    key={value}
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        frequency === value
                                            ? 'bg-yellow-400/5 border-yellow-400/30'
                                            : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="frequency"
                                        value={value}
                                        checked={frequency === value}
                                        onChange={() => setFrequency(value)}
                                        className="mt-0.5 accent-yellow-400"
                                    />
                                    <div>
                                        <div className={`text-sm font-medium ${frequency === value ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {label}
                                        </div>
                                        <div className="text-xs text-gray-500">{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-end gap-3 pb-8">
                        <Link
                            href="/dashboard/ads"
                            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl text-sm transition-colors"
                        >
                            {saving ? 'Enregistrement…' : isNew ? 'Créer la pub' : 'Sauvegarder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
