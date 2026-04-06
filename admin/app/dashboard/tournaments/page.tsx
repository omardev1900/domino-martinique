'use client';

import React, { useState, useEffect, useCallback } from 'react';

type GameMode = 'MANCHE' | 'VICTOIRE' | 'SCORE' | 'COCHON';
type TStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED';

type Tournament = {
  id?: string;
  title: string;
  description: string;
  gameMode: GameMode;
  winningCondition: number;
  startAt: number;   // ms timestamp
  endAt: number;
  maxPlayers: number;
  entryFeeCoins: number;
  entryFeeDiamonds?: number;
  entryFeeCash?: number; // EUR
  reward1st: number;
  reward2nd: number;
  reward3rd: number;
  rewardDiamonds1st?: number;
  rewardDiamonds2nd?: number;
  rewardDiamonds3rd?: number;
  status: TStatus;
  participants?: string[];
  minLevel?: number;
  createdAt?: number;
};

const MODE_META: Record<GameMode, { icon: string; label: string }> = {
  MANCHE:   { icon: '🏁', label: 'Manche' },
  VICTOIRE: { icon: '🏆', label: 'Victoire' },
  SCORE:    { icon: '🔢', label: 'Score' },
  COCHON:   { icon: '🐷', label: 'Cochon' },
};

const STATUS_META: Record<TStatus, { label: string; color: string; dot: string }> = {
  UPCOMING: { label: 'À venir',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',   dot: 'bg-blue-400' },
  ACTIVE:   { label: 'En cours',  color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  ENDED:    { label: 'Terminé',   color: 'text-gray-400 bg-gray-700/40 border-gray-600/30',    dot: 'bg-gray-500' },
};

function toInputDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromInputDate(s: string): number {
  return new Date(s).getTime() || Date.now();
}

const EMPTY_T: Tournament = {
  title: '',
  description: '',
  gameMode: 'MANCHE',
  winningCondition: 3,
  startAt: Date.now() + 86400000, // tomorrow
  endAt: Date.now() + 2 * 86400000,
  maxPlayers: 32,
  entryFeeCoins: 500,
  entryFeeDiamonds: 0,
  entryFeeCash: 0,
  reward1st: 5000,
  reward2nd: 2000,
  reward3rd: 500,
  rewardDiamonds1st: 10,
  rewardDiamonds2nd: 0,
  rewardDiamonds3rd: 0,
  status: 'UPCOMING',
  minLevel: 1,
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TStatus | 'all'>('all');
  const [feedback, setFeedback] = useState('');
  const [managing, setManaging] = useState<Tournament | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setTournaments(data.tournaments ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const handleSave = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showFeedback(editing.id ? 'Tournoi mis à jour.' : 'Tournoi créé.');
      setEditing(null);
      fetchTournaments();
    } catch (err: any) { showFeedback(`Erreur: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch('/api/tournaments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      fetchTournaments();
    } catch { } finally { setDeleting(null); }
  };

  const handleStatusChange = async (t: Tournament, status: TStatus) => {
    await fetch('/api/tournaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, status }) });
    fetchTournaments();
  };

  const filtered = filterStatus === 'all' ? tournaments : tournaments.filter((t) => t.status === filterStatus);

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const counts = { UPCOMING: 0, ACTIVE: 0, ENDED: 0 };
  tournaments.forEach((t) => { counts[t.status]++; });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournois</h1>
          <p className="text-gray-400 mt-1 text-sm">{tournaments.length} tournoi{tournaments.length !== 1 ? 's' : ''} — {counts.ACTIVE} en cours</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY_T })}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-yellow-400/20">
          + Créer un tournoi
        </button>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">✓ {feedback}</div>
      )}

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filterStatus === 'all' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
          Tous ({tournaments.length})
        </button>
        {(Object.entries(STATUS_META) as [TStatus, typeof STATUS_META[TStatus]][]).map(([s, m]) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filterStatus === s ? `${m.color} ring-1 ring-current` : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
            <span className={`w-2 h-2 rounded-full ${m.dot}`} />
            {m.label} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-gray-400 font-semibold text-lg">Aucun tournoi</p>
          <p className="text-gray-600 text-sm mt-2">Créez votre premier tournoi pour engager la communauté</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const sm = STATUS_META[t.status];
            const mm = MODE_META[t.gameMode];
            const participants = t.participants?.length ?? 0;
            return (
              <div key={t.id} className={`bg-gray-900 border rounded-xl p-5 transition-all ${t.status === 'ACTIVE' ? 'border-green-500/30' : 'border-gray-800'}`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sm.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} ${t.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                        {sm.label}
                      </span>
                      <span className="text-xs text-gray-500">{mm.icon} Mode {mm.label}</span>
                    </div>
                    <h3 className="text-white font-bold text-base">{t.title}</h3>
                    {t.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{t.description}</p>}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <MiniStat label="Joueurs" value={`${participants}/${t.maxPlayers}`} />
                  <MiniStat label="Mise" value={`🪙 ${t.entryFeeCoins.toLocaleString('fr-FR')}`} />
                  <MiniStat label="Objectif" value={`${t.winningCondition} ${t.gameMode === 'MANCHE' ? 'manches' : t.gameMode === 'VICTOIRE' ? 'victoires' : t.gameMode === 'SCORE' ? 'pts' : 'cochons'}`} />
                  <MiniStat label="Durée" value={Math.round((t.endAt - t.startAt) / 3600000) + 'h'} />
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-400/5 border border-yellow-400/10 rounded-xl overflow-x-auto whitespace-nowrap">
                  <span className="text-xs text-gray-500 flex-shrink-0">Récompenses :</span>
                  <span className="text-yellow-400 text-xs font-semibold">🥇 {t.reward1st.toLocaleString('fr-FR')}🪙{t.rewardDiamonds1st ? ` +${t.rewardDiamonds1st}💎` : ''}</span>
                  <span className="text-gray-400 text-xs font-semibold">🥈 {t.reward2nd.toLocaleString('fr-FR')}🪙{t.rewardDiamonds2nd ? ` +${t.rewardDiamonds2nd}💎` : ''}</span>
                  <span className="text-orange-400 text-xs font-semibold">🥉 {t.reward3rd.toLocaleString('fr-FR')}🪙{t.rewardDiamonds3rd ? ` +${t.rewardDiamonds3rd}💎` : ''}</span>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-600 mb-4">
                  📅 {formatDate(t.startAt)} → {formatDate(t.endAt)}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {t.status === 'UPCOMING' && (
                    <button onClick={() => handleStatusChange(t, 'ACTIVE')}
                      className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-semibold rounded-lg transition-all min-w-[90px]">
                      ▶ Démarrer
                    </button>
                  )}
                  {t.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusChange(t, 'ENDED')}
                      className="flex-1 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 text-xs font-semibold rounded-lg transition-all min-w-[90px]">
                      ■ Terminer
                    </button>
                  )}
                  <button onClick={() => setManaging({ ...t })}
                    className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg transition-all min-w-[90px]">
                    👥 Gérer
                  </button>
                  <button onClick={() => setEditing({ ...t })}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-all">
                    ✏️
                  </button>
                  <button onClick={() => t.id && handleDelete(t.id)} disabled={deleting === t.id}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50">
                    {deleting === t.id ? '…' : '🗑️'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create/edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{editing.id ? 'Modifier le tournoi' : 'Créer un tournoi'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Title + description */}
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Titre *</label>
                  <input type="text" value={editing.title} onChange={(e) => setEditing((p) => ({ ...p!, title: e.target.value }))} placeholder="Grand Tournoi de Martinique"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Description</label>
                  <textarea rows={2} value={editing.description} onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))} placeholder="Détails du tournoi…"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors resize-none" />
                </div>
              </div>

              {/* Mode + condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Mode de jeu</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(MODE_META) as [GameMode, typeof MODE_META[GameMode]][]).map(([m, meta]) => (
                      <button key={m} onClick={() => setEditing((p) => ({ ...p!, gameMode: m }))}
                        className={`p-2 rounded-lg text-sm border text-center transition-all ${editing.gameMode === m ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'}`}>
                        {meta.icon} {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Objectif de victoire</label>
                  <input type="number" min="1" max="100" value={editing.winningCondition} onChange={(e) => setEditing((p) => ({ ...p!, winningCondition: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                  <p className="text-gray-600 text-xs mt-1">
                    {editing.gameMode === 'MANCHE' ? 'manches à gagner' : editing.gameMode === 'VICTOIRE' ? 'victoires à atteindre' : editing.gameMode === 'SCORE' ? 'points à atteindre' : 'cochons à infliger'}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Début</label>
                  <input type="datetime-local" value={toInputDate(editing.startAt)} onChange={(e) => setEditing((p) => ({ ...p!, startAt: fromInputDate(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Fin</label>
                  <input type="datetime-local" value={toInputDate(editing.endAt)} onChange={(e) => setEditing((p) => ({ ...p!, endAt: fromInputDate(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>

              {/* Players + entry */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Max joueurs</label>
                  <input type="number" min="4" max="1024" value={editing.maxPlayers} onChange={(e) => setEditing((p) => ({ ...p!, maxPlayers: parseInt(e.target.value) || 32 }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Niveau Min</label>
                  <input type="number" min="1" max="100" value={editing.minLevel || 1} onChange={(e) => setEditing((p) => ({ ...p!, minLevel: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Droits d&apos;entrée</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-3 gap-2">
                      <span className="text-xs">🪙</span>
                      <input type="number" min="0" value={editing.entryFeeCoins} onChange={(e) => setEditing((p) => ({ ...p!, entryFeeCoins: parseInt(e.target.value) || 0 }))}
                        className="bg-transparent text-white w-full py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-3 gap-2">
                      <span className="text-xs">💎</span>
                      <input type="number" min="0" value={editing.entryFeeDiamonds || 0} onChange={(e) => setEditing((p) => ({ ...p!, entryFeeDiamonds: parseInt(e.target.value) || 0 }))}
                        className="bg-transparent text-white w-full py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-3 gap-2">
                      <span className="text-xs">€</span>
                      <input type="number" min="0" value={editing.entryFeeCash || 0} onChange={(e) => setEditing((p) => ({ ...p!, entryFeeCash: parseFloat(e.target.value) || 0 }))}
                        className="bg-transparent text-white w-full py-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Récompenses</label>
                <div className="space-y-3 p-4 bg-yellow-400/5 border border-yellow-400/10 rounded-xl">
                  {/* Row 1st */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-yellow-400 text-xs mb-1 block font-bold">🥇 1er (Pièces)</label>
                      <input type="number" min="0" value={editing.reward1st} onChange={(e) => setEditing((p) => ({ ...p!, reward1st: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                    <div>
                      <label className="text-yellow-400 text-xs mb-1 block font-bold">🥇 1er (Diamants)</label>
                      <input type="number" min="0" value={editing.rewardDiamonds1st ?? 0} onChange={(e) => setEditing((p) => ({ ...p!, rewardDiamonds1st: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                  </div>
                  {/* Row 2nd */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 text-xs mb-1 block font-bold">🥈 2ème (Pièces)</label>
                      <input type="number" min="0" value={editing.reward2nd} onChange={(e) => setEditing((p) => ({ ...p!, reward2nd: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-xs mb-1 block font-bold">🥈 2ème (Diamants)</label>
                      <input type="number" min="0" value={editing.rewardDiamonds2nd ?? 0} onChange={(e) => setEditing((p) => ({ ...p!, rewardDiamonds2nd: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                  </div>
                  {/* Row 3rd */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-orange-300 text-xs mb-1 block font-bold">🥉 3ème (Pièces)</label>
                      <input type="number" min="0" value={editing.reward3rd} onChange={(e) => setEditing((p) => ({ ...p!, reward3rd: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                    <div>
                      <label className="text-orange-300 text-xs mb-1 block font-bold">🥉 3ème (Diamants)</label>
                      <input type="number" min="0" value={editing.rewardDiamonds3rd ?? 0} onChange={(e) => setEditing((p) => ({ ...p!, rewardDiamonds3rd: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              {editing.id && (
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Statut</label>
                  <div className="flex gap-2">
                    {(Object.keys(STATUS_META) as TStatus[]).map((s) => (
                      <button key={s} onClick={() => setEditing((p) => ({ ...p!, status: s }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${editing.status === s ? `${STATUS_META[s].color} ring-1 ring-current` : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'}`}>
                        {STATUS_META[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium text-sm rounded-xl transition-all">Annuler</button>
              <button onClick={handleSave} disabled={saving || !editing.title.trim()}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-40">
                {saving ? 'Sauvegarde…' : editing.id ? 'Mettre à jour' : 'Créer le tournoi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Participants */}
      {managing && (
        <ParticipantsModal tournament={managing} onClose={() => setManaging(null)} refresh={fetchTournaments} />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-xs font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function ParticipantsModal({ tournament, onClose, refresh }: { tournament: Tournament; onClose: () => void; refresh: () => void; }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partRes, usersRes] = await Promise.all([
        fetch(`/api/tournaments/${tournament.id}/participants`),
        fetch('/api/users')
      ]);
      const partData = await partRes.json();
      const usersData = await usersRes.json();
      setParticipants(partData.participants || []);
      setAllUsers(usersData.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (userId: string) => {
    await fetch(`/api/tournaments/${tournament.id}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    fetchData();
    refresh();
  };

  const handleRemove = async (userId: string) => {
    await fetch(`/api/tournaments/${tournament.id}/participants`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    fetchData();
    refresh();
  };

  const partIds = new Set(participants.map(p => p.id));
  const filteredUsers = allUsers.filter(u => 
    !partIds.has(u.uid) && 
    (u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Gérer les participants</h2>
            <p className="text-gray-400 text-sm mt-0.5">{tournament.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
        </div>
        
        <div className="flex-1 overflow-auto flex flex-col p-6 gap-6">
          {loading ? (
            <div className="flex items-center gap-2 text-yellow-400 mx-auto justify-center py-10">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Chargement...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
              
              {/* Colonne Liste des Participants */}
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-semibold flex items-center justify-between">
                  Inscrits
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{participants.length} / {tournament.maxPlayers}</span>
                </h3>
                <div className="flex-1 bg-gray-800/30 rounded-xl border border-gray-800 overflow-y-auto min-h-[300px] p-2 space-y-1">
                  {participants.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">Aucun participant pour le moment.</p>
                  ) : (
                    participants.map(p => (
                      <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-800/80 rounded-lg group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold border border-gray-600">
                            {p.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium leading-tight">{p.displayName}</p>
                            <p className="text-yellow-400 text-xs font-semibold">T-Score: {p.score} pt(s)</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemove(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          Retirer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Colonne Ajout Manuel */}
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-semibold">Ajouter des joueurs</h3>
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Rechercher par pseudo ou email..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                />
                
                <div className="flex-1 bg-gray-800/30 rounded-xl border border-gray-800 overflow-y-auto min-h-[250px] p-2 space-y-1">
                  {search.trim().length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10 px-4">Tapez un nom pour rechercher un utilisateur à inviter.</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">Aucun joueur trouvé.</p>
                  ) : (
                    filteredUsers.map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-gray-800/80 rounded-lg transition-colors border border-transparent hover:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">{u.displayName || 'Sans nom'}</span>
                          <span className="text-gray-500 text-xs">{u.email}</span>
                        </div>
                        <button 
                          onClick={() => handleAdd(u.uid)}
                          disabled={participants.length >= tournament.maxPlayers}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-md border border-blue-500/20 disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
