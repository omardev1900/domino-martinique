'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerProfile } from '@/components/PlayerRow';
import { logAdminAction } from '@/lib/adminLog';

type Action = 'ban' | 'unban' | 'reset_stats' | 'add_coins';

const BAN_REASONS = [
  'Comportement toxique',
  'Triche / exploit',
  'Multi-comptes',
  'Langage inapproprié',
  'Spam',
  'Autre',
];

type Props = {
  player: PlayerProfile;
  onClose: () => void;
  onUpdated: () => void;
};

export default function PlayerModal({ player, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState<Action | null>(null);
  const [coinsAmount, setCoinsAmount] = useState('500');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [banReason, setBanReason] = useState(BAN_REASONS[0]);

  const coins = player.economy?.coins ?? player.stats?.coins ?? 0;
  const diamonds = player.economy?.diamonds ?? player.stats?.diamonds ?? 0;
  const level = player.stats?.level ?? 0;
  const xp = player.stats?.xp ?? 0;
  const gamesWon = player.stats?.gamesWon ?? 0;
  const gamesPlayed = player.stats?.gamesPlayed ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const leagueGrade = player.stats?.leagueGrade ?? '—';
  const leaguePoints = player.stats?.leaguePoints ?? 0;
  const totalCochons = player.stats?.totalCochonsInflicted ?? 0;

  const showFeedback = (msg: string, isError = false) => {
    if (isError) setErrorMsg(msg);
    else setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3000);
  };

  const handleAction = async (action: Action) => {
    setLoading(action);
    try {
      const ref = doc(db, 'users', player.uid);
      if (action === 'ban' || action === 'unban') {
        if (action === 'ban') {
          await updateDoc(ref, { isBanned: true, banReason, bannedAt: Date.now() });
        } else {
          await updateDoc(ref, { isBanned: false, banReason: null, bannedAt: null });
        }
        const target = { targetUid: player.uid, targetName: player.displayName || player.uid };
        await logAdminAction(action, action === 'ban' ? { ...target, details: banReason } : target);
        showFeedback(action === 'ban' ? `Joueur banni (${banReason}).` : 'Joueur débanni.');
        onUpdated();
      } else if (action === 'reset_stats') {
        await updateDoc(ref, {
          'stats.gamesPlayed': 0,
          'stats.gamesWon': 0,
          'stats.xp': 0,
          'stats.level': 1,
          'stats.leaguePoints': 0,
          'stats.totalCochonsInflicted': 0,
          'stats.totalPointsAccumulated': 0,
        });
        await logAdminAction('reset_stats', { targetUid: player.uid, targetName: player.displayName || player.uid });
        showFeedback('Stats réinitialisées.');
        onUpdated();
        setConfirmReset(false);
      } else if (action === 'add_coins') {
        const amount = parseInt(coinsAmount, 10);
        if (isNaN(amount) || amount <= 0) {
          showFeedback('Montant invalide.', true);
          setLoading(null);
          return;
        }
        await updateDoc(ref, { 'economy.coins': coins + amount });
        await logAdminAction('add_coins', { targetUid: player.uid, targetName: player.displayName || player.uid, details: `+${amount} coins` });
        showFeedback(`+${amount.toLocaleString('fr-FR')} coins envoyés.`);
        onUpdated();
      }
    } catch (err: any) {
      showFeedback(err.message || 'Erreur.', true);
    } finally {
      setLoading(null);
    }
  };

  const initial = (player.displayName || player.uid || '?')[0].toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center text-yellow-400 font-bold text-xl flex-shrink-0">
              {initial}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {player.displayName || <span className="text-gray-500 italic">Sans nom</span>}
              </h2>
              <p className="text-gray-400 text-sm">{player.email || '—'}</p>
              <p className="text-gray-600 text-xs font-mono mt-0.5">{player.uid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {player.isBanned ? (
              <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">
                BANNI
              </span>
            ) : (
              <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">
                ACTIF
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Feedback */}
        {successMsg && (
          <div className="mx-6 mt-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            ✗ {errorMsg}
          </div>
        )}

        <div className="px-6 py-5 space-y-6">
          {/* Stats grid */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Statistiques</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Niveau" value={`Niv. ${level}`} sub={`${xp.toLocaleString('fr-FR')} XP`} />
              <StatBox label="Coins" value={`🪙 ${coins.toLocaleString('fr-FR')}`} />
              <StatBox label="Diamants" value={`💎 ${diamonds.toLocaleString('fr-FR')}`} />
              <StatBox label="Ligue" value={leagueGrade} sub={`${leaguePoints} pts`} />
            </div>
          </div>

          {/* Games stats */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Parties</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Parties jouées" value={gamesPlayed.toString()} />
              <StatBox label="Victoires" value={gamesWon.toString()} accent />
              <StatBox label="Taux de victoire" value={`${winRate}%`} accent={winRate >= 50} />
              <StatBox label="Cochons infligés" value={totalCochons.toString()} />
            </div>
          </div>

          {/* Win rate bar */}
          {gamesPlayed > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">Taux de victoire</span>
                <span className="text-white text-xs font-semibold">{winRate}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Actions</h3>
            <div className="space-y-3">
              {/* Ban / Unban */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {player.isBanned ? 'Débannir le joueur' : 'Bannir le joueur'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {player.isBanned ? 'Restore l\'accès au jeu' : 'Empêche la connexion au jeu'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAction(player.isBanned ? 'unban' : 'ban')}
                    disabled={loading !== null}
                    className={`flex-shrink-0 text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      player.isBanned
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                    }`}
                  >
                    {loading === 'ban' || loading === 'unban' ? '...' : player.isBanned ? 'Débannir' : 'Bannir'}
                  </button>
                </div>
                {!player.isBanned && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-gray-500 text-xs flex-shrink-0">Motif :</label>
                    <select
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-400 transition-colors"
                    >
                      {BAN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Send coins */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div>
                  <p className="text-white text-sm font-medium">Envoyer des coins</p>
                  <p className="text-gray-500 text-xs mt-0.5">Ajouter des coins au solde actuel</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={coinsAmount}
                    onChange={(e) => setCoinsAmount(e.target.value)}
                    min="1"
                    className="w-24 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                  <button
                    onClick={() => handleAction('add_coins')}
                    disabled={loading !== null}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border border-yellow-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === 'add_coins' ? '...' : 'Envoyer 🪙'}
                  </button>
                </div>
              </div>

              {/* Reset stats */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Réinitialiser les stats</p>
                    <p className="text-gray-500 text-xs mt-0.5">Remet à zéro parties, victoires, XP, ligue</p>
                  </div>
                  {!confirmReset ? (
                    <button
                      onClick={() => setConfirmReset(true)}
                      disabled={loading !== null}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all disabled:opacity-50"
                    >
                      Réinitialiser
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 text-xs font-medium">Confirmer ?</span>
                      <button
                        onClick={() => handleAction('reset_stats')}
                        disabled={loading !== null}
                        className="text-xs font-bold px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all disabled:opacity-50"
                      >
                        {loading === 'reset_stats' ? '...' : 'Oui, reset'}
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`font-bold text-sm ${accent ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}
