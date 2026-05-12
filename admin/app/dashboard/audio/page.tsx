'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { logAdminAction } from '@/lib/adminLog';

interface BGMTrack {
  id: string;
  name: string;
  url: string;
  type: 'BGM';
  addedAt: number;
}

type AudioAssignmentKey = 'appActive' | 'inGame';

interface AudioConfig {
  bgmList: BGMTrack[];
  assignments: Record<AudioAssignmentKey, string | null>;
}

const DEFAULT_ASSIGNMENTS: Record<AudioAssignmentKey, string | null> = {
  appActive: null,
  inGame: null,
};

const CONTEXT_LABELS: Record<AudioAssignmentKey, { label: string; icon: string; desc: string }> = {
  appActive: { label: 'Hors partie', icon: 'APP', desc: 'Contexte local package dans le build mobile. Affectation distante desactivee.' },
  inGame: { label: 'En partie', icon: 'GAME', desc: 'Contexte local package dans le build mobile. Affectation distante desactivee.' },
};

function normalizeAssignments(
  assignments: Record<string, string | null | undefined> | undefined
): Record<AudioAssignmentKey, string | null> {
  return {
    appActive: assignments?.appActive ?? assignments?.mainMenu ?? assignments?.bgm3 ?? null,
    inGame: assignments?.inGame ?? assignments?.gameIntense ?? assignments?.gameNormal ?? assignments?.bgm2 ?? assignments?.bgm1 ?? null,
  };
}

export default function AudioManagementPage() {
  const [tracks, setTracks] = useState<BGMTrack[]>([]);
  const [assignments, setAssignments] = useState<Record<AudioAssignmentKey, string | null>>(DEFAULT_ASSIGNMENTS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
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
        const data = snap.data() as Partial<AudioConfig> & { assignments?: Record<string, string | null> };
        setTracks(data.bgmList || []);
        setAssignments(normalizeAssignments(data.assignments));
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

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        () => {
          setFeedback({ msg: 'Erreur d upload.', ok: false });
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newTrack: BGMTrack = {
            id: `track_${timestamp}`,
            name: newTrackName,
            url: downloadURL,
            type: 'BGM',
            addedAt: timestamp,
          };

          const updatedTracks = [...tracks, newTrack];
          await setDoc(doc(db, 'config', 'audio'), { bgmList: updatedTracks }, { merge: true });
          await logAdminAction('save_config', { details: `Nouvelle musique audio ajoutee : ${newTrackName}` });

          setTracks(updatedTracks);
          setFeedback({ msg: 'Musique ajoutee avec succes !', ok: true });
          setFile(null);
          setNewTrackName('');
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch {
      setFeedback({ msg: 'Erreur lors de la sauvegarde.', ok: false });
      setUploading(false);
    }
  };

  const handleAssign = async (slot: AudioAssignmentKey, trackId: string | null) => {
    try {
      const newAssignments = { ...assignments, [slot]: trackId };
      setAssignments(newAssignments);
      await setDoc(doc(db, 'config', 'audio'), { assignments: newAssignments }, { merge: true });
      await logAdminAction('save_config', { details: `Tentative de mise a jour audio pour ${slot}` });
      setFeedback({ msg: 'Affectation mise a jour.', ok: true });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ msg: 'Erreur d affectation.', ok: false });
    }
  };

  const handleDelete = async (track: BGMTrack) => {
    if (!confirm(`Supprimer "${track.name}" ?`)) return;

    try {
      await deleteObject(ref(storage, track.url));
      const updatedTracks = tracks.filter((t) => t.id !== track.id);
      const newAssignments = { ...assignments };
      (Object.keys(newAssignments) as AudioAssignmentKey[]).forEach((slot) => {
        if (newAssignments[slot] === track.id) newAssignments[slot] = null;
      });

      await setDoc(
        doc(db, 'config', 'audio'),
        {
          bgmList: updatedTracks,
          assignments: newAssignments,
        },
        { merge: true }
      );

      setTracks(updatedTracks);
      setAssignments(newAssignments);
      setFeedback({ msg: 'Supprime.', ok: true });
    } catch {
      setFeedback({ msg: 'Erreur.', ok: false });
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configuration Audio de "L&apos;Elite"</h1>
        <p className="mt-2 text-gray-400">
          La bibliotheque audio reste consultable ici, mais les BGM runtime sont maintenant verrouillees dans le build mobile.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-green-500/20 bg-green-500/10 text-green-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          <span>{feedback.ok ? 'OK' : 'KO'}</span>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-4">
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-yellow-400">📍</span> Affectation par contexte
            </h2>
            <div className="mb-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs leading-relaxed text-yellow-100">
              Les contextes BGM `appActive` et `inGame` utilisent maintenant uniquement les fichiers locaux du build mobile.
              L&apos;interface admin ne peut plus modifier leur selection ni impacter le choix de session.
            </div>
            <div className="space-y-6">
              {(Object.entries(CONTEXT_LABELS) as [AudioAssignmentKey, (typeof CONTEXT_LABELS)[AudioAssignmentKey]][]).map(
                ([slot, info]) => (
                  <div key={slot} className="space-y-3 rounded-2xl border border-gray-700/50 bg-gray-800/50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <span className="text-sm font-semibold text-white">{info.label}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-500">{info.desc}</p>
                    <select
                      value={assignments[slot] || ''}
                      onChange={() => {}}
                      disabled
                      className="w-full cursor-pointer rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-xs text-gray-300 outline-none transition-all focus:ring-1 focus:ring-yellow-400/50"
                    >
                      <option value="">Contexte verrouille au build</option>
                      {tracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="sticky top-8 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-yellow-400">📤</span> Uploader une piste
            </h2>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Nom de la musique..."
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
              />
              <div className="group relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800/20 py-8 transition-all group-hover:border-yellow-400/30">
                  <span className="text-2xl opacity-50">🎵</span>
                  <span className="text-xs font-medium text-gray-500">
                    {file ? file.name : 'Choisir un fichier (MP3/WebM)'}
                  </span>
                </div>
              </div>

              {uploading && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div className="h-full bg-yellow-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !newTrackName}
                className="w-full rounded-xl bg-yellow-400 py-3.5 font-bold text-gray-900 transition-all hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {uploading ? 'Envoi...' : 'Ajouter a la bibliotheque'}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="flex min-h-[600px] flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/50 px-8 py-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Bibliotheque musicale</h2>
              <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {tracks.length} pistes
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                </div>
              ) : tracks.length === 0 ? (
                <div className="flex h-[400px] flex-col items-center justify-center px-20 text-center opacity-30">
                  <span className="mb-4 text-6xl">🎹</span>
                  <p className="text-sm italic">
                    Votre bibliotheque est vide. Utilisez le formulaire a gauche pour ajouter des musiques.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {tracks.map((track) => {
                    const isUsed = (Object.keys(assignments) as AudioAssignmentKey[]).some(
                      (slot) => assignments[slot] === track.id
                    );

                    return (
                      <div
                        key={track.id}
                        className={`rounded-2xl border bg-gray-800/30 p-5 transition-all hover:border-yellow-400/30 ${
                          isUsed ? 'border-yellow-400/20' : 'border-gray-700/50'
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate pr-2 text-sm font-bold text-white">{track.name}</h3>
                            <p className="mt-1 text-[10px] text-gray-500">{new Date(track.addedAt).toLocaleDateString()}</p>
                          </div>
                          {isUsed && (
                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-400">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="mb-4 rounded-xl bg-gray-950/50 p-2">
                          <audio src={track.url} controls className="h-8 w-full opacity-60 transition-opacity hover:opacity-100" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {(Object.keys(assignments) as AudioAssignmentKey[]).map(
                              (slot) =>
                                assignments[slot] === track.id && (
                                  <span
                                    key={slot}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-[10px]"
                                    title={CONTEXT_LABELS[slot].label}
                                  >
                                    {CONTEXT_LABELS[slot].icon}
                                  </span>
                                )
                            )}
                          </div>
                          <button onClick={() => handleDelete(track)} className="p-2 text-gray-600 transition-colors hover:text-red-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
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

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-500/10 bg-blue-500/5 px-6 py-4">
            <span className="text-lg">💡</span>
            <p className="text-[11px] italic leading-relaxed text-blue-400/70">
              Les changements d affectation sont instantanes pour les joueurs. Si un contexte est sur "Musique locale de secours",
              le jeu utilise son fallback embarque sans dependre du reseau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
