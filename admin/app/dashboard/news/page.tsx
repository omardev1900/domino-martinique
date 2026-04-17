'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/adminLog';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  fullText: string;
  createdAt: Timestamp;
  active: boolean;
  priority: number;
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fullText, setFullText] = useState('');
  const [priority, setPriority] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(items);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSaving(true);
    try {
      const newsData = {
        title,
        content,
        fullText,
        priority: Number(priority),
        active: true,
        createdAt: editingId ? (news.find(n => n.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), newsData);
        await logAdminAction('edit_news', { details: `News edited: ${title}` });
      } else {
        await addDoc(collection(db, 'news'), newsData);
        await logAdminAction('create_news', { details: `News created: ${title}` });
      }

      resetForm();
      fetchNews();
    } catch (err) {
      console.error('Error saving news:', err);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'actualité "${name}" ?`)) return;

    try {
      await deleteDoc(doc(db, 'news', id));
      await logAdminAction('delete_news', { details: `News deleted: ${name}` });
      fetchNews();
    } catch (err) {
      console.error('Error deleting news:', err);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await updateDoc(doc(db, 'news', id), { active: !currentStatus });
      await logAdminAction('toggle_news', { details: `${!currentStatus ? 'Activated' : 'Deactivated'} news: ${name}` });
      fetchNews();
    } catch (err) {
      console.error('Error toggling news status:', err);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setFullText(item.fullText || '');
    setPriority(item.priority || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setFullText('');
    setPriority(0);
  };

  return (
    <div className="p-8 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Gestion des Actualités</h1>
        <p className="text-gray-400 mt-1">Créez et gérez les actualités affichées sur l'écran d'accueil des joueurs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="xl:col-span-1">
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-8">
            <h2 className="text-lg font-bold text-white mb-6">
              {editingId ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Grand Tournoi de Pâques"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Accroche (Home Screen)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ex: Préparez-vous pour le tournoi..."
                  rows={3}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors resize-none"
                  required
                />
                <p className="text-gray-600 text-[10px] mt-1 italic">Ce texte s'affiche directement sur l'accueil.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Contenu détaillé (Historique)</label>
                <textarea
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                  placeholder="Détails complets de l'actualité..."
                  rows={6}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Priorité</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                />
                <p className="text-gray-600 text-[10px] mt-1 italic">Plus le nombre est élevé, plus la news est prioritaire.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Publier'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Liste */}
        <div className="xl:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Historique</h2>
              <button 
                onClick={fetchNews}
                className="text-xs text-yellow-400 hover:underline"
              >
                Rafraîchir
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : news.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">Aucune actualité enregistrée.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-950/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Titre / Aperçu</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {news.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(item.id, item.active, item.title)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              item.active 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}
                          >
                            {item.active ? 'Actif' : 'Masqué'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium text-sm">{item.title}</p>
                          <p className="text-gray-500 text-xs truncate max-w-xs">{item.content}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {item.createdAt?.toDate().toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="text-red-500 hover:text-red-400 transition-colors text-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
