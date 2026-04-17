'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { logAdminAction } from '@/lib/adminLog';

interface BGMTrack {
  id: string;
  name: string;
  url: string;
  type: 'BGM';
  addedAt: number;
}

interface AudioConfig {
  bgmList: BGMTrack[];
  assignments: {
    bgm1: string | null; // Slot ID or null for default
    bgm2: string | null;
    bgm3: string | null;
  };
}

const CONTEXT_LABELS = {
  bgm3: { label: 'Menu Principal', icon: '🏠', desc: 'Musique jouée au lancement et dans les menus.' },
  bgm1: { label: 'Partie (Normal)', icon: '🃏', desc: 'Musique d\'ambiance durant le jeu standard.' },
  bgm2: { label: 'Partie (Intense)', icon: '🔥', desc: 'Musique jouée lors des moments critiques.' },
};

export default function AudioManagementPage() {
  const [tracks, setTracks] = useState<BGMTrack[]>([]);
  const [assignments, setAssignments] = useState<AudioConfig['assignments']>({ bgm1: null, bgm2: null, bgm3: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form State
  const [newTrackName, setNewTrackName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'config', 'audio');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AudioConfig;
        setTracks(data.bgmList || []);
        setAssignments(data.assignments || { bgm1: null, bgm2: null, bgm3: null });
      }
    } catch (err) {
      console.error('Error fetching audio config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !newTrackName) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `bgm_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `audio/bgm/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        }, 
        (error) => {
          setFeedback({ msg: 'Erreur d\'upload.', ok: false });
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newTrack: BGMTrack = {
            id: `track_${timestamp}`,
            name: newTrackName,
            url: downloadURL,
            type: 'BGM',
            addedAt: timestamp
          };

          const updatedTracks = [...tracks, newTrack];
          await setDoc(doc(db, 'config', 'audio'), { bgmList: updatedTracks }, { merge: true });
          
          await logAdminAction('upload_audio', { details: `Nouvelle musique : ${newTrackName}` });
          
          setTracks(updatedTracks);
          setFeedback({ msg: 'Musique ajoutée avec succès !', ok: true });
          setFile(null);
          setNewTrackName('');
          setUploading(false);
        }
      );
    } catch (err) {
      setFeedback({ msg: 'Erreur lors de la sauvegarde.', ok: false });
      setUploading(false);
    }
  };

  const handleAssign = async (slot: keyof AudioConfig['assignments'], trackId: string | null) => {
    try {
      const newAssignments = { ...assignments, [slot]: trackId };
      setAssignments(newAssignments);

      // Mettre à jour Firestore pour le mobile
      // On construit l'objet complet car soundManager attend bgmList pour les URLs
      await setDoc(doc(db, 'config', 'audio'), { assignments: newAssignments }, { merge: true });
      
      // On déclenche aussi la mise à jour des URLs simplifiées pour le soundManager Mobile
      const track = tracks.find(t => t.id === trackId);
      const updateData: any = { assignments: newAssignments };
      
      // On met à jour le slot spécifique dans la config à plat pour faciliter la lecture mobile
      // sounds/bgm1, sounds/bgm2 etc.
      // Mais restons sur la logique soundManager qui filtre bgmList
      
      await logAdminAction('assign_audio', { details: `Affectation changée pour ${slot}` });
      setFeedback({ msg: 'Affectation mise à jour.', ok: true });
      
      // Auto-clear feedback
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ msg: 'Erreur d\'affectation.', ok: false });
    }
  };

  const handleDelete = async (track: BGMTrack) => {
    if (!confirm(`Supprimer "${track.name}" ?`)) return;

    try {
      await deleteObject(ref(storage, track.url));
      const updatedTracks = tracks.filter(t => t.id !== track.id);
      
      // Nettoyer les affectations si cette musique était utilisée
      const newAssignments = { ...assignments };
      if (newAssignments.bgm1 === track.id) newAssignments.bgm1 = null;
      if (newAssignments.bgm2 === track.id) newAssignments.bgm2 = null;
      if (newAssignments.bgm3 === track.id) newAssignments.bgm3 = null;

      await setDoc(doc(db, 'config', 'audio'), { 
        bgmList: updatedTracks, 
        assignments: newAssignments 
      }, { merge: true });
      
      setTracks(updatedTracks);
      setAssignments(newAssignments);
      setFeedback({ msg: 'Supprimé.', ok: true });
    } catch (err) {
      setFeedback({ msg: 'Erreur.', ok: false });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Configuration Audio de "L'Elite"</h1>
        <p className="text-gray-400 mt-2">Gérez les musiques par défaut et assignez vos propres pistes aux différents moments du jeu.</p>
      </div>

      {feedback && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${feedback.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <span>{feedback.ok ? '✓' : '✗'}</span>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Assignments & Upload */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Assignments Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-yellow-400">📍</span> Affectation par Contexte
            </h2>
            <div className="space-y-6">
              {(Object.entries(CONTEXT_LABELS) as [keyof AudioConfig['assignments'], typeof CONTEXT_LABELS['bgm1']][]).map(([slot, info]) => (
                <div key={slot} className="space-y-3 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <span className="text-sm font-semibold text-white">{info.label}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{info.desc}</p>
                  
                  <select
                    value={assignments[slot] || ''}
                    onChange={(e) => handleAssign(slot, e.target.value || null)}
                    className="w-full bg-gray-950 border border-gray-700 text-gray-300 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-yellow-400/50 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Musique de démarrage (Défaut)</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl sticky top-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-yellow-400">📤</span> Uploader une Piste
            </h2>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Nom de la musique..."
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:border-yellow-400/50 outline-none"
              />
              <div className="relative group">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full py-8 border-2 border-dashed border-gray-700 group-hover:border-yellow-400/30 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-800/20 transition-all">
                  <span className="text-2xl opacity-50">🎵</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {file ? file.name : 'Choisir un fichier (MP3/WebM)'}
                  </span>
                </div>
              </div>

              {uploading && (
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !newTrackName}
                className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-400/10"
              >
                {uploading ? 'Envoi...' : 'Ajouter à la bibliothèque'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Library */}
        <div className="xl:col-span-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl min-h-[600px] flex flex-col">
            <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Bibliothèque Musicale</h2>
              <span className="bg-gray-800 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-700">
                {tracks.length} Pistes
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tracks.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-30 px-20">
                  <span className="text-6xl mb-4">🎹</span>
                  <p className="text-sm italic">Votre bibliothèque est vide. Utilisez le formulaire à gauche pour ajouter des musiques.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tracks.map((track) => {
                    const isUsed = assignments.bgm1 === track.id || assignments.bgm2 === track.id || assignments.bgm3 === track.id;
                    return (
                      <div key={track.id} className={`group bg-gray-800/30 border p-5 rounded-2xl hover:border-yellow-400/30 transition-all ${isUsed ? 'border-yellow-400/20' : 'border-gray-700/50'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-white font-bold text-sm truncate pr-2">{track.name}</h3>
                            <p className="text-[10px] text-gray-500 mt-1">{new Date(track.addedAt).toLocaleDateString()}</p>
                          </div>
                          {isUsed && (
                             <span className="text-[9px] px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/20 font-bold uppercase tracking-wide">
                               Active
                             </span>
                          )}
                        </div>
                        
                        <div className="bg-gray-950/50 rounded-xl p-2 mb-4">
                          <audio src={track.url} controls className="w-full h-8 opacity-60 hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {(Object.keys(assignments) as (keyof AudioConfig['assignments'])[]).map(slot => (
                              assignments[slot] === track.id && (
                                <span key={slot} className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-lg text-[10px]" title={CONTEXT_LABELS[slot].label}>
                                  {CONTEXT_LABELS[slot].icon}
                                </span>
                              )
                            ))}
                          </div>
                          <button
                            onClick={() => handleDelete(track)}
                            className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-3 px-6 py-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
             <span className="text-lg">💡</span>
             <p className="text-[11px] text-blue-400/70 italic leading-relaxed">
               Les changements d&apos;affectation sont instantanés pour les joueurs. Si un contexte est positionné sur "Défaut", c&apos;est la musique locale du jeu qui sera jouée sans consommer de bande passante.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
