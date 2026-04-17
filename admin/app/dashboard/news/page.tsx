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
import { 
  storage 
} from '@/lib/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { logAdminAction } from '@/lib/adminLog';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  fullText: string;
  createdAt: Timestamp;
  active: boolean;
  priority: number;
  imageUrl?: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Optional: Resize if too big (e.g., max 1200px)
          const MAX_WIDTH = 1200;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas conversion failed'));
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
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSaving(true);
    setUploading(true);
    try {
      let imageUrl = news.find(n => n.id === editingId)?.imageUrl || null;

      // Handle Image Upload
      if (imageFile) {
        const webpBlob = await convertToWebP(imageFile);
        const fileName = `${Date.now()}.webp`;
        const storageRef = ref(storage, `news/${fileName}`);
        const uploadResult = await uploadBytes(storageRef, webpBlob);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const newsData: any = {
        title,
        content,
        fullText,
        priority: Number(priority),
        active: true,
        createdAt: editingId ? (news.find(n => n.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp(),
      };

      if (imageUrl) newsData.imageUrl = imageUrl;

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
      setUploading(false);
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
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setFullText('');
    setPriority(0);
    setImageFile(null);
    setImagePreview(null);
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
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Image d'illustration</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-800">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 bg-gray-950 border border-dashed border-gray-800 rounded-xl text-gray-400 text-sm cursor-pointer hover:border-yellow-400 hover:text-yellow-400 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageFile ? 'Changer l\'image' : 'Sélectionner une image (WebP auto)'}
                    </label>
                  </div>
                </div>
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
                  {saving ? (uploading ? 'Upload Image...' : 'Enregistrement...') : editingId ? 'Mettre à jour' : 'Publier'}
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
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-800">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium text-sm">{item.title}</p>
                              <p className="text-gray-500 text-xs truncate max-w-xs">{item.content}</p>
                            </div>
                          </div>
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
