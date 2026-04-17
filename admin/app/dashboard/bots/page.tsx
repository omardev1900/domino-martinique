'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Difficulty = 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN';

type BotProfile = {
  id: string;
  name: string;
  avatarId: string;
  imageUrl?: string; // URL distante (prioritaire)
  difficulty: Difficulty;
  isLocal?: boolean; // local fallback (non modifiable)
};

const LOCAL_BOTS: BotProfile[] = [
  { id: 'bot_ti_1', name: 'Ti-Sonson', avatarId: 'avatar_ti_sonson', difficulty: 'TI_MANMAY', isLocal: true },
  { id: 'bot_ti_2', name: 'Man-Yaya', avatarId: 'avatar_man_yaya', difficulty: 'TI_MANMAY', isLocal: true },
  { id: 'bot_ti_3', name: 'Doudou', avatarId: 'avatar_doudou', difficulty: 'TI_MANMAY', isLocal: true },
  { id: 'bot_ti_4', name: 'Chabin', avatarId: 'avatar_chabin', difficulty: 'TI_MANMAY', isLocal: true },
  { id: 'bot_ti_5', name: 'Fifine', avatarId: 'avatar_fifine', difficulty: 'TI_MANMAY', isLocal: true },
  { id: 'bot_mapipi_1', name: 'Dédé', avatarId: 'avatar_dede', difficulty: 'MAPIPI', isLocal: true },
  { id: 'bot_mapipi_2', name: 'Maxime', avatarId: 'avatar_maxime', difficulty: 'MAPIPI', isLocal: true },
  { id: 'bot_mapipi_3', name: 'Tatie', avatarId: 'avatar_tatie', difficulty: 'MAPIPI', isLocal: true },
  { id: 'bot_mapipi_4', name: 'Jojo', avatarId: 'avatar_jojo', difficulty: 'MAPIPI', isLocal: true },
  { id: 'bot_mapipi_5', name: 'Chabine', avatarId: 'avatar_chabine', difficulty: 'MAPIPI', isLocal: true },
  { id: 'bot_gran_1', name: 'Tonton-Léon', avatarId: 'avatar_tonton_leon', difficulty: 'GRAN_MOUN', isLocal: true },
  { id: 'bot_gran_2', name: 'Eudorge', avatarId: 'avatar_eudorge', difficulty: 'GRAN_MOUN', isLocal: true },
  { id: 'bot_gran_3', name: 'Man-Zouzou', avatarId: 'avatar_man_zouzou', difficulty: 'GRAN_MOUN', isLocal: true },
  { id: 'bot_gran_4', name: 'Papi-Jo', avatarId: 'avatar_papi_jo', difficulty: 'GRAN_MOUN', isLocal: true },
  { id: 'bot_gran_5', name: 'Tante-Rose', avatarId: 'avatar_tante_rose', difficulty: 'GRAN_MOUN', isLocal: true },
];

const DIFF_META: Record<Difficulty, { label: string; color: string; icon: string; desc: string }> = {
  TI_MANMAY: { label: 'Ti Manmay',  icon: '🌱', color: 'text-green-400 bg-green-500/10 border-green-500/20',   desc: 'Débutant' },
  MAPIPI:    { label: 'Mapipi',     icon: '⚔️', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', desc: 'Intermédiaire' },
  GRAN_MOUN: { label: 'Gran Moun',  icon: '👑', color: 'text-red-400 bg-red-500/10 border-red-500/20',         desc: 'Expert' },
};

const EMPTY: Partial<BotProfile> = { name: '', avatarId: '', difficulty: 'TI_MANMAY' };

export default function BotsPage() {
  const [remoteBots, setRemoteBots] = useState<BotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<BotProfile> | null>(null);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [tab, setTab] = useState<'remote' | 'local'>('remote');
  const [feedback, setFeedback] = useState('');
  const [initializing, setInitializing] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 400; // Les avatars n'ont pas besoin d'être géants
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (MAX_SIZE / width) * height;
              width = MAX_SIZE;
            } else {
              width = (MAX_SIZE / height) * width;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Conversion échouée'));
          }, 'image/webp', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bots');
      const data = await res.json();
      setRemoteBots(data.bots ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing.difficulty) return;
    setSaving(true);
    try {
      let imageUrl = editing.imageUrl || '';

      if (imageFile) {
        setUploading(true);
        const webpBlob = await convertToWebP(imageFile);
        const fileName = `${Date.now()}.webp`;
        const storageRef = ref(storage, `bots/${fileName}`);
        const uploadResult = await uploadBytes(storageRef, webpBlob);
        imageUrl = await getDownloadURL(uploadResult.ref);
        setUploading(false);
      }

      const botData = { ...editing, imageUrl };

      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showFeedback(editing.id ? 'Bot mis à jour.' : 'Bot créé.');
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      fetch_();
    } catch (err: any) { showFeedback(`Erreur: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce bot ?')) return;
    setDeleting(id);
    try {
      await fetch('/api/bots', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      fetch_();
    } catch { } finally { setDeleting(null); }
  };

  const handleInitialize = async () => {
    if (!confirm('Voulez-vous copier les 15 bots par défaut vers Firestore ?')) return;
    setInitializing(true);
    let count = 0;
    try {
      for (const bot of LOCAL_BOTS) {
        // Envoi simple pour chaque bot (l'API gère le doublon si l'ID existe déjà)
        const { isLocal, ...botData } = bot;
        await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(botData),
        });
        count++;
      }
      showFeedback(`${count} bots synchronisés avec Firestore.`);
      fetch_();
    } catch (err: any) {
      showFeedback(`Erreur lors de l'initialisation: ${err.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const allBots = tab === 'remote' ? remoteBots : LOCAL_BOTS;
  const filtered = filter === 'all' ? allBots : allBots.filter((b) => b.difficulty === filter);

  const countByDiff = (bots: BotProfile[], d: Difficulty) => bots.filter((b) => b.difficulty === d).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Bots IA</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {remoteBots.length} bots distants · 15 bots locaux (fallback)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm rounded-xl border border-gray-700 transition-all disabled:opacity-50"
          >
            {initializing ? 'Initialisation…' : '🔄 Initialiser Firestore'}
          </button>
          <button onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-lg shadow-yellow-400/20">
            + Nouveau bot
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">✓ {feedback}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.entries(DIFF_META) as [Difficulty, typeof DIFF_META[Difficulty]][]).map(([diff, meta]) => (
          <div key={diff} className={`bg-gray-900 border rounded-xl p-4 ${filter === diff ? 'border-yellow-400/30' : 'border-gray-800'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{meta.icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
            </div>
            <p className="text-gray-500 text-xs">{meta.desc}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <div>
                <p className="text-white font-bold text-lg">{countByDiff(remoteBots, diff)}</p>
                <p className="text-gray-600 text-xs">distants</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold text-lg">{countByDiff(LOCAL_BOTS, diff)}</p>
                <p className="text-gray-600 text-xs">locaux</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + filter */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-800 border border-gray-700 p-1 rounded-xl">
          {(['remote', 'local'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t === 'remote' ? `🌐 Firestore (${remoteBots.length})` : `📱 Locaux (${LOCAL_BOTS.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === 'all' ? 'bg-gray-700 text-white border-gray-600' : 'text-gray-500 border-gray-700 hover:text-gray-300'}`}>
            Tous
          </button>
          {(Object.entries(DIFF_META) as [Difficulty, typeof DIFF_META[Difficulty]][]).map(([d, m]) => (
            <button key={d} onClick={() => setFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === d ? `${m.color} ring-1 ring-current` : 'text-gray-500 border-gray-700 hover:text-gray-300'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
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
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-gray-400 font-medium">Aucun bot {tab === 'remote' ? 'Firestore' : 'local'}</p>
            {tab === 'remote' && <p className="text-gray-600 text-sm mt-1">Les bots Firestore surchargent les bots locaux de même ID</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avatar ID</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulté</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  {tab === 'remote' && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((bot) => {
                  const meta = DIFF_META[bot.difficulty];
                  return (
                    <tr key={bot.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm border ${meta.color}`}>
                            {bot.imageUrl ? (
                              <img src={bot.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              bot.name[0].toUpperCase()
                            )}
                          </div>
                          <p className="text-white font-medium text-sm">{bot.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><code className="text-gray-500 text-xs font-mono">{bot.id}</code></td>
                      <td className="px-4 py-3.5"><code className="text-gray-500 text-xs font-mono">{bot.avatarId || '—'}</code></td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {bot.isLocal ? (
                          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">📱 Local</span>
                        ) : (
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">🌐 Firestore</span>
                        )}
                      </td>
                      {tab === 'remote' && (
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => {
                                setEditing({ id: bot.id, name: bot.name, avatarId: bot.avatarId, imageUrl: bot.imageUrl, difficulty: bot.difficulty });
                                setImagePreview(bot.imageUrl || null);
                                setImageFile(null);
                              }}
                                className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-all">
                                Modifier
                              </button>
                            <button onClick={() => handleDelete(bot.id)} disabled={deleting === bot.id}
                              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-50">
                              {deleting === bot.id ? '…' : 'Supprimer'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal edit/create */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-5">{editing.id ? 'Modifier le bot' : 'Nouveau bot'}</h2>
            
            <div className="space-y-4">
              {/* Nom du bot */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Nom du bot *</label>
                <input 
                  type="text" 
                  value={editing.name || ''} 
                  onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))}
                  placeholder="Ex: Ti-Sonson"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" 
                />
              </div>

              {/* Avatar Photo */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Avatar (Photo)</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-950 border border-gray-800 mx-auto">
                      <img src={imagePreview} alt="Bot" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="bot-image-upload" />
                    <label htmlFor="bot-image-upload" className="flex items-center justify-center w-full px-4 py-2.5 bg-gray-800 border border-dashed border-gray-700 rounded-xl text-gray-400 text-xs cursor-pointer hover:border-yellow-400 hover:text-yellow-400 transition-all">
                      {imageFile ? 'Changer la photo' : 'Uploader une photo (WebP)'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Config Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Asset ID Local</label>
                  <input 
                    type="text" 
                    value={editing.avatarId || ''} 
                    onChange={(e) => setEditing((p) => ({ ...p!, avatarId: e.target.value }))}
                    placeholder="Ex: Chip_1"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium block mb-1.5">Difficulté *</label>
                  <select 
                    value={editing.difficulty} 
                    onChange={(e) => setEditing((p) => ({ ...p!, difficulty: e.target.value as Difficulty }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  >
                    <option value="TI_MANMAY">Ti Manmay</option>
                    <option value="MAPIPI">Mapipi</option>
                    <option value="GRAN_MOUN">Gran Moun</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium text-sm rounded-xl transition-all">
                Annuler
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || !editing.name?.trim()}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
              >
                {saving ? 'Sauvegarde…' : editing.id ? 'Mettre à jour' : 'Créer le bot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
