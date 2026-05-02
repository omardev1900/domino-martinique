'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { StoreItemPreview } from '@/components/StoreItemPreview';
import { storage } from '@/lib/firebase';

type ItemType = 'SKIN' | 'AVATAR' | 'CURRENCY_PACK';
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

type SkinConfig = {
  tableBackgroundColor: string;
  boardColor?: string;
  dominoBackgroundColor: string;
  dominoDotColor: string;
  dominoLineColor: string;
};

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
  skinConfig?: SkinConfig;
};

const TYPE_META: Record<ItemType, { label: string; icon: string; color: string }> = {
  AVATAR: { label: 'Avatar', icon: 'A', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  SKIN: { label: 'Skin domino', icon: 'S', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  CURRENCY_PACK: { label: 'Pack devises', icon: 'P', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};

const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  COMMON: { label: 'Commun', color: 'text-gray-300 bg-gray-700/40 border-gray-600/30' },
  RARE: { label: 'Rare', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  EPIC: { label: 'Epique', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  LEGENDARY: { label: 'Legendaire', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
};

const EMPTY: Partial<StoreItem> = {
  id: '',
  name: '',
  description: '',
  type: 'AVATAR',
  rarity: 'COMMON',
  assetId: '',
  priceCoins: 0,
};

function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (maxSize / width) * height;
            width = maxSize;
          } else {
            width = (maxSize / height) * width;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Conversion failed'))),
          'image/webp',
          0.85,
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<StoreItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [feedback, setFeedback] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/store');
      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 3000);
  }, []);

  const openNew = () => {
    setImageFile(null);
    setImagePreview(null);
    setEditing({ ...EMPTY });
  };

  const openEdit = (item: StoreItem) => {
    setImageFile(null);
    setImagePreview(item.imageUrl ?? null);
    setEditing({ ...item });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editing?.id?.trim() || !editing.name?.trim()) return;

    setSaving(true);
    try {
      let imageUrl = editing.imageUrl ?? '';

      if (imageFile) {
        setUploading(true);
        const webp = await convertToWebP(imageFile);
        const storageRef = ref(storage, `avatars/${editing.id}_${Date.now()}.webp`);
        const result = await uploadBytes(storageRef, webp);
        imageUrl = await getDownloadURL(result.ref);
      }

      const response = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, imageUrl }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      showFeedback(editing.firestoreId ? 'Article mis a jour.' : 'Article cree.');
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      await fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      showFeedback(`Erreur: ${message}`);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (item: StoreItem) => {
    if (!item.firestoreId) return;

    setDeleting(item.firestoreId);
    try {
      await fetch('/api/store', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firestoreId: item.firestoreId }),
      });
      await fetchItems();
    } finally {
      setDeleting(null);
    }
  };

  const filteredItems = filterType === 'all' ? items : items.filter((item) => item.type === filterType);
  const countByType = (type: ItemType) => items.filter((item) => item.type === type).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Boutique</h1>
          <p className="mt-1 text-sm text-gray-400">
            Catalogue <code className="text-xs text-yellow-400/80">store_catalog</code> - {items.length} articles
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300"
        >
          + Nouvel article
        </button>
      </div>

      {feedback ? (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {feedback}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
            filterType === 'all'
              ? 'border-gray-600 bg-gray-700 text-white'
              : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Tous ({items.length})
        </button>
        {(Object.entries(TYPE_META) as [ItemType, (typeof TYPE_META)[ItemType]][]).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              filterType === type
                ? `${meta.color} ring-1 ring-current`
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {meta.icon} {meta.label} ({countByType(type)})
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center gap-4 p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
            <p className="text-sm text-gray-400">Chargement...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-3 text-4xl">[]</p>
            <p className="font-medium text-gray-400">Catalogue vide</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Rarete</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Prix</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const typeMeta = TYPE_META[item.type];
                  const rarityMeta = RARITY_META[item.rarity];

                  return (
                    <tr
                      key={item.firestoreId || item.id}
                      className="border-b border-gray-800/60 transition-colors hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <StoreItemPreview item={item} heightClassName="h-10" />
                          <div>
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="text-xs font-mono text-gray-500">{item.id}</code>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${typeMeta.color}`}>
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${rarityMeta.color}`}>
                          {rarityMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.priceCoins ? (
                          <span className="text-sm text-yellow-400">Coins {item.priceCoins.toLocaleString('fr-FR')}</span>
                        ) : item.priceDiamonds ? (
                          <span className="text-sm text-cyan-400">Diamants {item.priceDiamonds}</span>
                        ) : (
                          <span className="text-sm text-green-400">Gratuit</span>
                        )}
                        {item.rewards ? (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {item.rewards.coins ? `Coins ${item.rewards.coins}` : ''}
                            {item.rewards.coins && item.rewards.diamonds ? ' - ' : ''}
                            {item.rewards.diamonds ? `Diamants ${item.rewards.diamonds}` : ''}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition-all hover:bg-gray-700"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleting === item.firestoreId}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deleting === item.firestoreId ? '...' : 'Supprimer'}
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

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                {editing.firestoreId ? "Modifier l'article" : 'Nouvel article'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-xl text-gray-500 hover:text-gray-300">
                x
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Apercu</p>
                <StoreItemPreview item={editing} previewUrl={imagePreview} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">ID unique *</label>
                  <input
                    type="text"
                    value={editing.id || ''}
                    onChange={(event) => setEditing((prev) => ({ ...prev!, id: event.target.value }))}
                    placeholder="avatar_classique"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Nom *</label>
                  <input
                    type="text"
                    value={editing.name || ''}
                    onChange={(event) => setEditing((prev) => ({ ...prev!, name: event.target.value }))}
                    placeholder="Classique"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Description</label>
                <input
                  type="text"
                  value={editing.description || ''}
                  onChange={(event) => setEditing((prev) => ({ ...prev!, description: event.target.value }))}
                  placeholder="Description..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Type *</label>
                  <select
                    value={editing.type}
                    onChange={(event) =>
                      setEditing((prev) => ({ ...prev!, type: event.target.value as ItemType }))
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  >
                    {(Object.entries(TYPE_META) as [ItemType, (typeof TYPE_META)[ItemType]][]).map(([type, meta]) => (
                      <option key={type} value={type}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Rarete *</label>
                  <select
                    value={editing.rarity}
                    onChange={(event) =>
                      setEditing((prev) => ({ ...prev!, rarity: event.target.value as Rarity }))
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  >
                    {(Object.entries(RARITY_META) as [Rarity, (typeof RARITY_META)[Rarity]][]).map(([rarity, meta]) => (
                      <option key={rarity} value={rarity}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editing.type === 'AVATAR' ? (
                <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Image avatar</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                        Choisir une image
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                      <p className="mt-1.5 text-xs text-gray-600">JPG, PNG, WebP - conversion WebP 200x200</p>
                      {imageFile ? <p className="mt-1 text-xs text-green-400">{imageFile.name}</p> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Asset ID</label>
                  <input
                    type="text"
                    value={editing.assetId || ''}
                    onChange={(event) => setEditing((prev) => ({ ...prev!, assetId: event.target.value }))}
                    placeholder="classic"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Prix Coins</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.priceCoins ?? ''}
                    onChange={(event) =>
                      setEditing((prev) => ({
                        ...prev!,
                        priceCoins: event.target.value ? parseInt(event.target.value, 10) : undefined,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Prix Diamants</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.priceDiamonds ?? ''}
                    onChange={(event) =>
                      setEditing((prev) => ({
                        ...prev!,
                        priceDiamonds: event.target.value ? parseInt(event.target.value, 10) : undefined,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {editing.type === 'CURRENCY_PACK' ? (
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Recompense Coins</label>
                    <input
                      type="number"
                      min="0"
                      value={editing.rewards?.coins ?? ''}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev!,
                          rewards: {
                            ...prev!.rewards,
                            coins: parseInt(event.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">Recompense Diamants</label>
                    <input
                      type="number"
                      min="0"
                      value={editing.rewards?.diamonds ?? ''}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev!,
                          rewards: {
                            ...prev!.rewards,
                            diamonds: parseInt(event.target.value, 10) || 0,
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white transition-colors focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>
              ) : null}

              {editing.type === 'SKIN' ? (
                <div className="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Configuration skin</p>
                  {([
                    { key: 'tableBackgroundColor', label: 'Table - fond', placeholder: '#105B3A' },
                    { key: 'boardColor', label: 'Plateau - surface', placeholder: '#1B5E20' },
                    { key: 'dominoBackgroundColor', label: 'Dominos - fond', placeholder: '#FFFFFF' },
                    { key: 'dominoDotColor', label: 'Dominos - points', placeholder: '#000000' },
                    { key: 'dominoLineColor', label: 'Dominos - ligne', placeholder: '#000000' },
                  ] as { key: keyof SkinConfig; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => {
                    const value = (editing.skinConfig as SkinConfig | undefined)?.[key] ?? '';
                    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);

                    return (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <label className="flex-1 text-xs font-medium text-gray-400">{label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={isValidHex ? value : '#000000'}
                            onChange={(event) =>
                              setEditing((prev) => ({
                                ...prev!,
                                skinConfig: {
                                  ...(prev!.skinConfig as SkinConfig),
                                  [key]: event.target.value,
                                },
                              }))
                            }
                            className="h-8 w-8 cursor-pointer rounded border border-gray-600 bg-transparent"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(event) =>
                              setEditing((prev) => ({
                                ...prev!,
                                skinConfig: {
                                  ...(prev!.skinConfig as SkinConfig),
                                  [key]: event.target.value,
                                },
                              }))
                            }
                            placeholder={placeholder}
                            className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs font-mono text-white transition-colors focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading || !editing.id?.trim() || !editing.name?.trim()}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-gray-900 transition-all hover:bg-yellow-300 disabled:opacity-40"
              >
                {uploading ? 'Upload...' : saving ? 'Sauvegarde...' : editing.firestoreId ? 'Mettre a jour' : "Creer l'article"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
