'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { logAdminAction } from '@/lib/adminLog';

// ── Default values (mirrors mobile constants) ──────────────────────────────────
const DEFAULTS = {
  // Gameplay
  turnDuration: 15,
  startingHandSize: 3,
  // Economy
  newPlayerCoins: 1000,
  dailyRewardCoins: 300,
  rakePercent: 10,
  soloWinCoins: 500,
  // Tables buy-in
  buyInDebutant: 100,
  buyInExpert: 1000,
  buyInLegende: 10000,
  // Rewards per event
  rewardRoundWinCoins: 5,
  rewardMancheWinCoins: 50,
  rewardCochonCoins: 100,
  rewardDoubleCochonCoins: 250,
  rewardMatchWinXp: 500,
  rewardMatchFinishXp: 100,
  // Pot distribution (%)
  potFirst: 80,
  potSecond: 20,
  // League thresholds (cochons)
  leagueMaitre: 31,
  leagueRoi: 151,
  leagueLegende: 500,
};

type ConfigKey = keyof typeof DEFAULTS;
type ConfigValues = Record<ConfigKey, number>;

function toConfigValues(raw: Record<string, unknown> | null): ConfigValues {
  const out = { ...DEFAULTS } as ConfigValues;
  if (!raw) return out;
  for (const key of Object.keys(DEFAULTS) as ConfigKey[]) {
    const v = raw[key];
    if (typeof v === 'number') (out as any)[key] = v;
  }
  return out;
}

// ── Section & field declarations ───────────────────────────────────────────────

type FieldDef = {
  key: ConfigKey;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
};

type Section = {
  title: string;
  icon: string;
  fields: FieldDef[];
};

const SECTIONS: Section[] = [
  {
    title: 'Gameplay',
    icon: '🎲',
    fields: [
      { key: 'turnDuration', label: 'Durée d\'un tour', unit: 'secondes', min: 5, max: 120, hint: '0 = pas de timer' },
      { key: 'startingHandSize', label: 'Dominos en main au départ', unit: 'dominos', min: 1, max: 14 },
    ],
  },
  {
    title: 'Tables de jeu',
    icon: '🪙',
    fields: [
      { key: 'buyInDebutant', label: 'Mise Table Débutant 🌱', unit: 'coins', min: 0, max: 100000 },
      { key: 'buyInExpert', label: 'Mise Table Expert ⚔️', unit: 'coins', min: 0, max: 1000000 },
      { key: 'buyInLegende', label: 'Mise Table Légende 👑', unit: 'coins', min: 0, max: 10000000 },
      { key: 'rakePercent', label: 'Commission (rake)', unit: '%', min: 0, max: 30 },
    ],
  },
  {
    title: 'Distribution du Pot',
    icon: '🏆',
    fields: [
      { key: 'potFirst', label: '1er joueur', unit: '%', min: 50, max: 100 },
      { key: 'potSecond', label: '2ème joueur', unit: '%', min: 0, max: 50, hint: '3ème = 0% (perd sa mise)' },
    ],
  },
  {
    title: 'Récompenses par événement',
    icon: '🎁',
    fields: [
      { key: 'rewardRoundWinCoins', label: 'Gagner une manche', unit: '🪙', min: 0, max: 10000 },
      { key: 'rewardMancheWinCoins', label: 'Gagner un match (manche)', unit: '🪙', min: 0, max: 100000 },
      { key: 'rewardCochonCoins', label: 'Cochon infligé', unit: '🪙', min: 0, max: 10000 },
      { key: 'rewardDoubleCochonCoins', label: 'Double Cochon', unit: '🪙', min: 0, max: 50000 },
      { key: 'soloWinCoins', label: 'Victoire en Solo', unit: '🪙', min: 0, max: 10000 },
      { key: 'rewardMatchWinXp', label: 'Victoire du match (XP)', unit: 'XP', min: 0, max: 10000 },
      { key: 'rewardMatchFinishXp', label: 'Fin de match (XP)', unit: 'XP', min: 0, max: 5000 },
    ],
  },
  {
    title: 'Économie joueur',
    icon: '💰',
    fields: [
      { key: 'newPlayerCoins', label: 'Coins à l\'inscription', unit: '🪙', min: 0, max: 100000 },
      { key: 'dailyRewardCoins', label: 'Récompense journalière', unit: '🪙', min: 0, max: 10000 },
    ],
  },
  {
    title: 'Seuils de Ligue (cochons)',
    icon: '🐷',
    fields: [
      { key: 'leagueMaitre', label: 'Maître Saucissier 🥈', unit: 'cochons', min: 1, max: 999 },
      { key: 'leagueRoi', label: 'Roi du Boudin 👑', unit: 'cochons', min: 1, max: 9999 },
      { key: 'leagueLegende', label: 'Légende du Groin 🔥', unit: 'cochons', min: 1, max: 99999 },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [values, setValues] = useState<ConfigValues>(toConfigValues(null));
  const [saved, setSaved] = useState<ConfigValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.config) {
          setValues(toConfigValues(data.config));
          setSaved(toConfigValues(data.config));
          setUpdatedAt(data.config.updatedAt ?? null);
          setUpdatedBy(data.config.updatedBy ?? null);
        } else {
          setSaved(toConfigValues(null));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isDirty = saved !== null && JSON.stringify(values) !== JSON.stringify(saved);

  const handleChange = (key: ConfigKey, raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) setValues((prev) => ({ ...prev, [key]: n }));
  };

  const handleReset = () => {
    if (saved) setValues({ ...saved });
  };

  const handleResetDefaults = () => {
    setValues({ ...DEFAULTS } as ConfigValues);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: values, updatedBy: user?.email ?? 'admin' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved({ ...values });
      setUpdatedAt(Date.now());
      setUpdatedBy(user?.email ?? 'admin');
      await logAdminAction('save_config', { details: 'config/game mis à jour' });
      setFeedback({ msg: 'Configuration sauvegardée.', ok: true });
    } catch (err: any) {
      setFeedback({ msg: `Erreur : ${err.message}`, ok: false });
    } finally {
      setSaving(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuration globale</h1>
          <p className="text-gray-400 mt-1 text-sm">Paramètres du jeu stockés dans Firestore · <code className="text-yellow-400/80 text-xs">config/game</code></p>
          {updatedAt && (
            <p className="text-gray-600 text-xs mt-1">
              Dernière sauvegarde : {new Date(updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {updatedBy && <> par <span className="text-gray-500">{updatedBy}</span></>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 transition-all"
          >
            Valeurs par défaut
          </button>
          {isDirty && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 transition-all"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20"
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm border ${feedback.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {feedback.ok ? '✓' : '✗'} {feedback.msg}
        </div>
      )}

      {/* Dirty banner */}
      {isDirty && !feedback && (
        <div className="mb-6 px-4 py-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          Modifications non sauvegardées — n&apos;oubliez pas de cliquer sur &quot;Sauvegarder&quot;
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement de la configuration…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <h2 className="text-white font-semibold">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {section.fields.map((field) => {
                  const current = values[field.key];
                  const defaultVal = DEFAULTS[field.key];
                  const isModified = saved ? current !== saved[field.key] : current !== defaultVal;
                  return (
                    <div key={field.key} className="px-6 py-4 flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-white text-sm font-medium">{field.label}</label>
                          {isModified && (
                            <span className="text-yellow-400 text-xs font-medium bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                              modifié
                            </span>
                          )}
                        </div>
                        {field.hint && <p className="text-gray-600 text-xs mt-0.5">{field.hint}</p>}
                        <p className="text-gray-600 text-xs mt-0.5">Défaut : {defaultVal} {field.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <input
                          type="number"
                          value={current}
                          min={field.min}
                          max={field.max}
                          step={field.step ?? 1}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                        {field.unit && (
                          <span className="text-gray-500 text-sm w-16 text-left">{field.unit}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Note de bas de page */}
          <div className="px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-blue-400/60 text-xs">
            ℹ️ Ces paramètres sont sauvegardés dans Firestore <code>config/game</code>. L&apos;application mobile doit être configurée pour lire ces valeurs dynamiquement afin qu&apos;elles prennent effet en temps réel.
          </div>
        </div>
      )}
    </div>
  );
}
