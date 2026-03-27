'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { logAdminAction } from '@/lib/adminLog';

type Template = {
  label: string;
  title: string;
  body: string;
};

const TEMPLATES: Template[] = [
  { label: '🎉 Événement spécial', title: 'Événement spécial en cours !', body: 'Un tournoi exceptionnel vous attend. Connectez-vous pour participer !' },
  { label: '🪙 Bonus de coins', title: 'Bonus de coins offerts !', body: 'Connectez-vous maintenant pour récupérer vos coins gratuits.' },
  { label: '🔧 Maintenance', title: 'Maintenance prévue', body: 'Le jeu sera brièvement indisponible pour maintenance. Merci de votre compréhension.' },
  { label: '🆕 Mise à jour', title: 'Nouvelle mise à jour disponible', body: 'De nouvelles fonctionnalités vous attendent ! Mettez à jour l\'application.' },
  { label: '🏆 Tournoi', title: 'Tournoi en cours !', body: 'Rejoignez le tournoi et gagnez des récompenses exclusives.' },
];

type SendResult = { sent: number; failed: number; message?: string; topic?: string };

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [reachable, setReachable] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ title: string; body: string; target: string; sent: number; ts: number }[]>([]);

  useEffect(() => {
    fetch('/api/notify')
      .then((r) => r.json())
      .then((d) => setReachable(d.reachable ?? 0))
      .catch(() => setReachable(0));
  }, []);

  const handleTemplate = (t: Template) => {
    setTitle(t.title);
    setBody(t.body);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Le titre et le message sont requis.');
      return;
    }
    setSending(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      await logAdminAction('send_notification', {
        details: `"${title}" → ${target === 'all' ? 'tous les joueurs' : target} (${data.sent} envoyés)`,
      });

      // Save to local history
      setHistory((prev) => [{
        title, body, target, sent: data.sent, ts: Date.now(),
      }, ...prev].slice(0, 10));

      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  const charCount = body.length;
  const charLimit = 200;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Notifications push</h1>
        <p className="text-gray-400 mt-1 text-sm">Envoyer un message à tous les joueurs via Firebase Cloud Messaging</p>
      </div>

      {/* Reachable devices banner */}
      <div className={`mb-6 px-5 py-4 rounded-xl border flex items-center justify-between ${
        reachable === null
          ? 'bg-gray-800/50 border-gray-700'
          : reachable === 0
          ? 'bg-orange-500/5 border-orange-500/20'
          : 'bg-green-500/5 border-green-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{reachable === null ? '⏳' : reachable === 0 ? '⚠️' : '📱'}</span>
          <div>
            <p className="text-white font-semibold text-sm">
              {reachable === null ? 'Vérification…' : reachable === 0 ? 'Aucun appareil enregistré' : `${reachable} appareil${reachable > 1 ? 's' : ''} joignable${reachable > 1 ? 's' : ''}`}
            </p>
            {reachable === 0 && (
              <p className="text-orange-400 text-xs mt-0.5">
                L&apos;application mobile doit enregistrer les tokens FCM dans Firestore <code className="bg-orange-500/10 px-1 rounded">users/{'{uid}'}.fcmToken</code>
              </p>
            )}
          </div>
        </div>
        {reachable !== null && reachable > 0 && (
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Prêt
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Templates */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3 text-sm">Templates rapides</h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleTemplate(t)}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">Composer le message</h2>

            {/* Target */}
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Destinataires</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              >
                <option value="all">📱 Tous les joueurs ({reachable ?? '…'} appareils)</option>
                <option value="topic:news">📢 Topic : news</option>
                <option value="topic:events">🎯 Topic : events</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Titre de la notification</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Ex: Événement spécial en cours !"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1 text-right">{title.length}/80</p>
            </div>

            {/* Body */}
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={charLimit}
                rows={4}
                placeholder="Rédigez le contenu de la notification…"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
              />
              <p className={`text-xs mt-1 text-right ${charCount > charLimit * 0.9 ? 'text-orange-400' : 'text-gray-600'}`}>
                {charCount}/{charLimit}
              </p>
            </div>

            {/* Error / Result */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                ✗ {error}
              </div>
            )}
            {result && (
              <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                ✓ Notification envoyée — {result.sent} succès{result.failed > 0 ? `, ${result.failed} échecs` : ''}
                {result.message && <span className="text-gray-400 ml-1">({result.message})</span>}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>📣 Envoyer la notification</>
              )}
            </button>
          </div>
        </div>

        {/* Preview + history */}
        <div className="space-y-5">
          {/* Phone preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Aperçu</h2>
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-yellow-400/20 flex items-center justify-center">
                  <span className="text-xs">🎲</span>
                </div>
                <span className="text-gray-400 text-xs font-medium">Domino Martinique</span>
                <span className="text-gray-600 text-xs ml-auto">à l&apos;instant</span>
              </div>
              <p className="text-white text-sm font-semibold leading-snug">
                {title || <span className="text-gray-600 italic">Titre de la notification…</span>}
              </p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                {body || <span className="text-gray-600 italic">Message de la notification…</span>}
              </p>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm mb-3">Envois récents</h2>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <p className="text-white text-xs font-semibold truncate">{h.title}</p>
                    <p className="text-gray-500 text-xs truncate mt-0.5">{h.body}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-600 text-xs">{h.sent} envoyé{h.sent !== 1 ? 's' : ''}</span>
                      <span className="text-gray-700 text-xs">
                        {new Date(h.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
