import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, findActiveRoomForUser, setUserActiveRoom } from '../core/services/firebase';
import { authService } from '../core/services/auth.service';
import { LogService } from '../core/services/LogService';

export type MultiResumeInfo = {
    roomId: string;
    status: string;
};

export function useMultiResume(currentPath: string) {
    const [resumeInfo, setResumeInfo] = useState<MultiResumeInfo | null>(null);
    const isCheckingRef = useRef(false);

    const check = useCallback(async () => {
        // Ne pas déclencher si on est déjà en jeu
        if (currentPath.startsWith('/game') || currentPath.startsWith('/join')) {
            setResumeInfo(null);
            return;
        }
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;

        try {
            const user = await authService.getCurrentUser();
            if (!user?.uid || user.uid.startsWith('guest_')) {
                setResumeInfo(null);
                return;
            }

            let activeRoomId = await AsyncStorage.getItem('active_roomId');
            
            // Si pas en cache, on cherche dans la base
            if (!activeRoomId) {
                activeRoomId = await findActiveRoomForUser(user.uid);
                if (activeRoomId) {
                    await AsyncStorage.setItem('active_roomId', activeRoomId);
                }
            }

            if (!activeRoomId) {
                setResumeInfo(null);
                return;
            }

            const roomRef = doc(db, 'rooms', activeRoomId);
            const roomSnap = await getDoc(roomRef);
            
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                if (roomData && (roomData.status === 'PLAYING' || roomData.status === 'WAITING')) {
                    setResumeInfo({
                        roomId: activeRoomId,
                        status: roomData.status,
                    });
                } else {
                    // La table n'est plus active (MATCH_END ou autre)
                    await AsyncStorage.removeItem('active_roomId');
                    await setUserActiveRoom(user.uid, null);
                    setResumeInfo(null);
                }
            } else {
                await AsyncStorage.removeItem('active_roomId');
                await setUserActiveRoom(user.uid, null);
                setResumeInfo(null);
            }
        } catch (err) {
            LogService.warn('useMultiResume', 'Error checking multi state', err);
            setResumeInfo(null);
        } finally {
            isCheckingRef.current = false;
        }
    }, [currentPath]);

    // Vérification initiale
    useEffect(() => {
        check();
    }, [check]);

    // Vérification au retour en foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                check();
            }
        });
        return () => subscription.remove();
    }, [check]);

    const dismiss = useCallback(() => setResumeInfo(null), []);

    const abandon = useCallback(async () => {
        try {
            const user = await authService.getCurrentUser();
            if (!user?.uid) return;

            const activeRoomId = await AsyncStorage.getItem('active_roomId');
            if (activeRoomId) {
                // Nettoyage local et user.activeRoomId
                await AsyncStorage.removeItem('active_roomId');
                await setUserActiveRoom(user.uid, null);
                
                // On essaie aussi de retirer le joueur de la table si on peut
                // Attention, en plein milieu d'une partie PLAYING, ça pourrait nécessiter une Cloud Function
                // pour gérer la distribution des pénalités, mais pour la démo/V1, on retire juste le joueur de la table s'il était en attente
                try {
                    const roomRef = doc(db, 'rooms', activeRoomId);
                    const roomSnap = await getDoc(roomRef);
                    if (roomSnap.exists()) {
                        const roomData = roomSnap.data();
                        if (roomData.status === 'WAITING') {
                            await updateDoc(roomRef, {
                                players: arrayRemove(user.uid)
                            });
                        }
                        // Si PLAYING, la logique de déconnexion/timeout s'en chargera côté bots de remplacement ou l'admin
                    }
                } catch(e) {
                    // Ignore fail to remove from room
                }
            }
        } catch { /* non-critique */ }
        setResumeInfo(null);
    }, []);

    return { resumeInfo, dismiss, abandon };
}
