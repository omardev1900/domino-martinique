'use client';

import React, { useState, useEffect, useCallback } from 'react';

type ItemType = 'SKIN' | 'AVATAR' | 'CURRENCY_PACK' | 'EMOTE';
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

type StoreItem = {
  firestoreId?: string;
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  priceCoins?: number;
  priceDiamonds?: number;
  rewards?: { coins?: number; diamonds?: number };
  assetId: string;
  imageUrl?: string;
};

const TYPE_META: Record<ItemType, { label: string; icon: string; color: string }> = {
  AVATAR:        { label: 'Avatar',        icon: '🧑', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  SKIN:          { label: 'Skin dominos',  icon: '🎴', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  CURRENCY_PACK: { label: 'Pack devises',  icon: '💎', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  EMOTE:         { label: 'Emote',         icon: '😄', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
};

const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  COMMON:    { label: 'Commun',     color: 'text-gray-300 bg-gray-700/40 border-gray-600/30' },
  RARE:      { label: 'Rare',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  EPIC:      { label: 'Épique',     color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  LEGENDARY: { label: 'Légendaire', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
};

const EMPTY: Partial<StoreItem> = { id: '', name: '', description: '', type: 'AVATAR', rarity: 'COMMON', assetId: '', priceCoins: 0 };

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<StoreItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [feedback, setFeedback] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const handleSave = async () => {
    if (!editing?.id?.trim() || !editing.name?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showFeedback(editing.firestoreId ? 'Article mis à jour.' : 'Article créé.');
      setEditing(null);
      fetchItems();
    } catch (err: any) { showFeedback(`Erreur: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: StoreItem) => {
    if (!item.firestoreId) return;
    setDeleting(item.firestoreId);
    try {
      await fetch('/api/store', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firestoreId: item.firestoreId }) });
      fetchItems();
    } catch { } finally { setDeleting(null); }
  };

  const filtered = filterType === 'all' ? items : items.filter((i) => i.type === filterType);

  const countByType = (t: ItemType) => items.filter((i) => i.type === t).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Boutique</h1>
          <p className="text-gray-400 mt-1 text-sm">Gestion du catalogue <code className="text-yellow-400/80 text-xs">store_catalog</code> — {items.length} articles</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-yellow-400/20">
          + Nouvel article
        </button>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">✓ {feedback}</div>
      )}

      {/* Type filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filterType === 'all' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
          Tous ({items.length})
        </button>
        {(Object.entries(TYPE_META) as [ItemType, typeof TYPE_META[ItemType]][]).map(([type, meta]) => (
          <button key={type} onClick={() => setFilterType(type)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filterType === type ? `${meta.color} ring-1 ring-current` : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}>
            {meta.icon} {meta.label} ({countByType(type)})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-gray-400 font-medium">Catalogue vide</p>
            <p className="text-gray-600 text-sm mt-1">Les articles Firestore surchargent les articles codés dans l&apos;app</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rareté</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const typeMeta = TYPE_META[item.type];
                  const rarityMeta = RARITY_META[item.rarity];
                  return (
                    <tr key={item.firestoreId || item.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${rarityMeta.color}`}>
                            {typeMeta.icon}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{item.name}</p>
                            <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[200px]">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><code className="text-gray-500 text-xs font-mono">{item.id}</code></td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeMeta.color}`}>{typeMeta.icon} {typeMeta.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${rarityMeta.color}`}>{rarityMeta.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.priceCoins ? <span className="text-yellow-400 text-sm">🪙 {item.priceCoins.toLocaleString('fr-FR')}</span> :
                         item.priceDiamonds ? <span className="text-cyan-400 text-sm">💎 {item.priceDiamonds}</span> :
                         <span className="text-green-400 text-sm">Gratuit</span>}
                        {item.rewards && <p className="text-gray-600 text-xs mt-0.5">→ {item.rewards.coins ? `🪙${item.rewards.coins}` : ''} {item.rewards.diamonds ? `💎${item.rewards.diamonds}` : ''}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditing({ ...item })}
                            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-all">Modifier</button>
                          <button onClick={() => handleDelete(item)} disabled={deleting === item.firestoreId}
                            className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-50">
                            {deleting === item.firestoreId ? '…' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{editing.firestoreId ? 'Modifier l\'article' : 'Nouvel article'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">ID unique *</label>
                  <input type="text" value={editing.id || ''} onChange={(e) => setEditing((p) => ({ ...p!, id: e.target.value }))} placeholder="avatar_classique"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Nom *</label>
                  <input type="text" value={editing.name || ''} onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))} placeholder="Classique"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Description</label>
                <input type="text" value={editing.description || ''} onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))} placeholder="Description de l'article…"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Type *</label>
                  <select value={editing.type} onChange={(e) => setEditing((p) => ({ ...p!, type: e.target.value as ItemType }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors">
                    {(Object.entries(TYPE_META) as [ItemType, typeof TYPE_META[ItemType]][]).map(([t, m]) => (
                      <option key={t} value={t}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Rareté *</label>
                  <select value={editing.rarity} onChange={(e) => setEditing((p) => ({ ...p!, rarity: e.target.value as Rarity }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors">
                    {(Object.entries(RARITY_META) as [Rarity, typeof RARITY_META[Rarity]][]).map(([r, m]) => (
                      <option key={r} value={r}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Asset ID</label>
                <input type="text" value={editing.assetId || ''} onChange={(e) => setEditing((p) => ({ ...p!, assetId: e.target.value }))} placeholder="classic"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Prix 🪙 Coins</label>
                  <input type="number" min="0" value={editing.priceCoins ?? ''} onChange={(e) => setEditing((p) => ({ ...p!, priceCoins: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Prix 💎 Diamants</label>
                  <input type="number" min="0" value={editing.priceDiamonds ?? ''} onChange={(e) => setEditing((p) => ({ ...p!, priceDiamonds: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>
              {editing.type === 'CURRENCY_PACK' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Récompense 🪙 Coins</label>
                    <input type="number" min="0" value={editing.rewards?.coins ?? ''} onChange={(e) => setEditing((p) => ({ ...p!, rewards: { ...p!.rewards, coins: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Récompense 💎 Diamants</label>
                    <input type="number" min="0" value={editing.rewards?.diamonds ?? ''} onChange={(e) => setEditing((p) => ({ ...p!, rewards: { ...p!.rewards, diamonds: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium text-sm rounded-xl transition-all">Annuler</button>
              <button onClick={handleSave} disabled={saving || !editing.id?.trim() || !editing.name?.trim()}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-40">
                {saving ? 'Sauvegarde…' : editing.firestoreId ? 'Mettre à jour' : 'Créer l\'article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
