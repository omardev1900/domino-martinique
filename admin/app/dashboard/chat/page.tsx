'use client';

import React, { useState, useEffect, useCallback } from 'react';

type Category = 'message' | 'emoji';
type CostType = 'free' | 'coins';

type ChatItem = {
  firestoreId?: string;
  text: string;
  category: Category;
  costType: CostType;
  costAmount: number;
  usagesPerPurchase: number; // 0 = achat à vie, N = pack de N envois consommables
  order: number;
  enabled: boolean;
};

const EMPTY_MESSAGE: Partial<ChatItem> = {
  text: '', category: 'message', costType: 'free', costAmount: 0, usagesPerPurchase: 0, order: 0, enabled: true,
};

// Messages et emojis par défaut (codés en dur côté mobile → à migrer)
const DEFAULT_MESSAGES: Omit<ChatItem, 'firestoreId'>[] = [
  { text: 'Bien joué !',       category: 'message', costType: 'free', costAmount: 0, order: 0, enabled: true },
  { text: 'Aïe...',            category: 'message', costType: 'free', costAmount: 0, order: 1, enabled: true },
  { text: 'Dépêche-toi !',     category: 'message', costType: 'free', costAmount: 0, order: 2, enabled: true },
  { text: 'Chiré !',           category: 'message', costType: 'free', costAmount: 0, order: 3, enabled: true },
  { text: 'Je passe...',       category: 'message', costType: 'free', costAmount: 0, order: 4, enabled: true },
  { text: 'Beau coup !',       category: 'message', costType: 'free', costAmount: 0, order: 5, enabled: true },
  { text: "Tu m'as bloqué !",  category: 'message', costType: 'free', costAmount: 0, order: 6, enabled: true },
  { text: "C'est mon tour !",  category: 'message', costType: 'free', costAmount: 0, order: 7, enabled: true },
  { text: '😂', category: 'emoji', costType: 'free', costAmount: 0, order: 0, enabled: true },
  { text: '😡', category: 'emoji', costType: 'free', costAmount: 0, order: 1, enabled: true },
  { text: '😱', category: 'emoji', costType: 'free', costAmount: 0, order: 2, enabled: true },
  { text: '👏', category: 'emoji', costType: 'free', costAmount: 0, order: 3, enabled: true },
  { text: '🥳', category: 'emoji', costType: 'free', costAmount: 0, order: 4, enabled: true },
  { text: '😭', category: 'emoji', costType: 'free', costAmount: 0, order: 5, enabled: true },
  { text: '🤔', category: 'emoji', costType: 'free', costAmount: 0, order: 6, enabled: true },
  { text: '🤫', category: 'emoji', costType: 'free', costAmount: 0, order: 7, enabled: true },
  { text: '💀', category: 'emoji', costType: 'free', costAmount: 0, order: 8, enabled: true },
  { text: '🔥', category: 'emoji', costType: 'free', costAmount: 0, order: 9, enabled: true },
  { text: '🏆', category: 'emoji', costType: 'free', costAmount: 0, order: 10, enabled: true },
  { text: '👎', category: 'emoji', costType: 'free', costAmount: 0, order: 11, enabled: true },
];

const EMPTY_EMOJI: Partial<ChatItem> = {
  text: '', category: 'emoji', costType: 'free', costAmount: 0, usagesPerPurchase: 0, order: 0, enabled: true,
};

export default function ChatAdminPage() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>('message');
  const [editing, setEditing] = useState<Partial<ChatItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat-messages');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setFeedback('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(i => i.category === activeTab);

  const openNew = () => setEditing(activeTab === 'message' ? { ...EMPTY_MESSAGE } : { ...EMPTY_EMOJI });
  const openEdit = (item: ChatItem) => setEditing({ ...item });
  const closeModal = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      setFeedback('Sauvegardé ✓');
      fetchItems();
      closeModal();
    } catch {
      setFeedback('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const initDefaults = async () => {
    if (!confirm(`Insérer les ${DEFAULT_MESSAGES.length} messages/emojis par défaut dans Firestore ?`)) return;
    setSaving(true);
    try {
      await Promise.all(DEFAULT_MESSAGES.map(item =>
        fetch('/api/chat-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
      ));
      setFeedback(`${DEFAULT_MESSAGES.length} items insérés ✓`);
      fetchItems();
    } catch {
      setFeedback('Erreur lors de l\'initialisation.');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: ChatItem) => {
    if (!confirm(`Supprimer "${item.text}" ?`)) return;
    await fetch('/api/chat-messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firestoreId: item.firestoreId }),
    });
    fetchItems();
  };

  const toggleEnabled = async (item: ChatItem) => {
    await fetch('/api/chat-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, enabled: !item.enabled }),
    });
    fetchItems();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">💬 Gestion du Tchat</h1>
          <p className="text-gray-400 text-sm mt-1">
            Messages et emojis affichés en jeu — gratuits ou achetables par les joueurs.
          </p>
        </div>
        <button
          onClick={initDefaults}
          disabled={saving}
          className="shrink-0 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold text-sm hover:bg-yellow-400/20 disabled:opacity-50 whitespace-nowrap"
        >
          ⚡ Initialiser les défauts
        </button>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          {feedback}
        </div>
      )}

      {/* Onglets Messages / Emojis */}
      <div className="flex gap-2 mb-6">
        {(['message', 'emoji'] as Category[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === tab
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab === 'message' ? '💬 Messages' : '😄 Emojis'}
          </button>
        ))}
        <button
          onClick={openNew}
          className="ml-auto px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm"
        >
          + Ajouter
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-center py-12 border border-dashed border-gray-700 rounded-xl">
          Aucun {activeTab === 'message' ? 'message' : 'emoji'} — cliquez sur "+ Ajouter"
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div
              key={item.firestoreId}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50"
            >
              {/* Contenu */}
              <span className="flex-1 text-white font-medium text-sm">{item.text}</span>

              {/* Badge coût */}
              {item.costType === 'free' ? (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                  Gratuit
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  🪙 {item.costAmount}
                  {item.usagesPerPurchase > 0
                    ? ` · 🎫 ${item.usagesPerPurchase} envois`
                    : ' · ♾️ à vie'}
                </span>
              )}

              {/* Ordre */}
              <span className="text-gray-500 text-xs w-10 text-center">#{item.order}</span>

              {/* Toggle actif */}
              <button
                onClick={() => toggleEnabled(item)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  item.enabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
                  item.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>

              {/* Actions */}
              <button
                onClick={() => openEdit(item)}
                className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-bold"
              >
                Éditer
              </button>
              <button
                onClick={() => deleteItem(item)}
                className="px-3 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-bold"
              >
                Suppr.
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editing.firestoreId ? 'Modifier' : 'Ajouter'} un {activeTab === 'message' ? 'message' : 'emoji'}
            </h2>

            {/* Texte */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                {activeTab === 'message' ? 'Texte du message' : 'Emoji (caractère unicode)'}
              </label>
              <input
                className="mt-1 w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none"
                value={editing.text ?? ''}
                onChange={e => setEditing({ ...editing, text: e.target.value })}
                placeholder={activeTab === 'message' ? 'Ex: Bien joué !' : 'Ex: 😂'}
                maxLength={activeTab === 'message' ? 40 : 4}
              />
            </div>

            {/* Type de coût */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Type</label>
              <div className="flex gap-2 mt-1">
                {(['free', 'coins'] as CostType[]).map(ct => (
                  <button
                    key={ct}
                    onClick={() => setEditing({ ...editing, costType: ct, costAmount: ct === 'free' ? 0 : (editing.costAmount || 100) })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      editing.costType === ct
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {ct === 'free' ? '🆓 Gratuit' : '🪙 Payant'}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant si payant */}
            {editing.costType === 'coins' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Prix (coins)</label>
                  <input
                    type="number"
                    className="mt-1 w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none"
                    value={editing.costAmount ?? 100}
                    onChange={e => setEditing({ ...editing, costAmount: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Usages par achat
                  </label>
                  <p className="text-xs text-gray-600 mb-1">0 = achat à vie (illimité) · ex: 50 = le joueur reçoit 50 envois</p>
                  <input
                    type="number"
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none"
                    value={editing.usagesPerPurchase ?? 0}
                    onChange={e => setEditing({ ...editing, usagesPerPurchase: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </>
            )}

            {/* Ordre */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Ordre d'affichage</label>
              <input
                type="number"
                className="mt-1 w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-400 outline-none"
                value={editing.order ?? 0}
                onChange={e => setEditing({ ...editing, order: Number(e.target.value) })}
                min={0}
              />
            </div>

            {/* Activé */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Activé (visible en jeu)</label>
              <button
                onClick={() => setEditing({ ...editing, enabled: !editing.enabled })}
                className={`w-12 h-6 rounded-full transition-colors ${editing.enabled ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${editing.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 font-bold hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.text?.trim()}
                className="flex-1 py-2 rounded-lg bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 disabled:opacity-50"
              >
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
