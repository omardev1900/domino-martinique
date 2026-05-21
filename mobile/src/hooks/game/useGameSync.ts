import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, GameRoom } from '../../core/types';
import { db } from '../../core/services/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { LogService } from '../../core/services/LogService';

export interface UseGameSyncProps {
    gameId: string | undefined;
    localPlayerId: string;
    isSoloMode: boolean;
    signalPlayerOnline: () => Promise<void>;
}

export interface UseGameSyncResult {
    gameState: GameState | null;
    roomData: GameRoom | null;
    isStarting: boolean;
    safeUpdateGameState: (gameId: string, newState: GameState) => Promise<void>;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    setIsStarting: React.Dispatch<React.SetStateAction<boolean>>;
    setRoomData: React.Dispatch<React.SetStateAction<GameRoom | null>>;
}

export const useGameSync = ({
    gameId,
    localPlayerId,
    isSoloMode,
    signalPlayerOnline
}: UseGameSyncProps): UseGameSyncResult => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    // Store latest state for safety
    const gameStateRef = useRef<GameState | null>(null);

    useEffect(() => {
        gameStateRef.current = gameState;
        if (isSoloMode && gameId && gameState) {
            AsyncStorage.setItem(`@solo_game_state:${gameId}`, JSON.stringify(gameState))
                .catch(err => LogService.error('useGameSync', 'Error saving solo state', err));
        }
    }, [gameState, isSoloMode, gameId]);

    // Real-time synchronization
    useEffect(() => {
        if (isSoloMode || !gameId) {
            return;
        }

        setIsStarting(true);


        const roomRef = doc(db, 'rooms', gameId);

        // First, explicitly declare we are online
        signalPlayerOnline().then(() => setIsStarting(false));

        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as GameRoom;
                setRoomData(data);

                if (data.gameState) {
                    setGameState(data.gameState);
                } else {

                }
            } else {

                // Handle room destruction
            }
        }, (error) => {
            LogService.error('useGameSync', 'onSnapshot Error:', error);
            setIsStarting(false);
        });

        return () => {

            unsubscribe();
            // Note: In React Native, running async cleanup here on simple unmount can be tricky,
            // so we rely on beforeunload for actual hard closes.
        };
    }, [gameId, isSoloMode, signalPlayerOnline]);



    // Safe update method preventing stale data overwrites
    // retries: nombre de tentatives restantes en cas de conflit Firestore (pattern recommandé par Firebase)
    const safeUpdateGameState = useCallback(async (targetGameId: string, newState: GameState, retries = 2) => {
        if (!targetGameId || isSoloMode) {
            setGameState(newState);
            return;
        }

        const roomRef = doc(db, 'rooms', targetGameId);

        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error("Room doesn't exist");
                }

                const currentData = roomDoc.data() as GameRoom;
                const currentState = currentData.gameState;

                const cleanUndefineds = (obj: any): any => {
                    if (obj === undefined) return null;
                    if (obj === null || typeof obj !== 'object') return obj;
                    if (Array.isArray(obj)) return obj.map(cleanUndefineds);
                    const result: any = {};
                    for (const key of Object.keys(obj)) {
                        if (obj[key] !== undefined) {
                            result[key] = cleanUndefineds(obj[key]);
                        }
                    }
                    return result;
                };

                const cleanState = cleanUndefineds(newState);

                if (!currentState) {
                    transaction.update(roomRef, { gameState: cleanState });
                    return;
                }

                // Compare timestamps to avoid split-brain rewrites
                // Allow write if same phase AND new timestamp is higher, or if phase changed (e.g PLAYING -> END)
                if (newState.phase === currentState.phase && newState.lastActionTimestamp <= currentState.lastActionTimestamp) {
                    return; // Skip update — state déjà plus récent sur Firebase
                }

                transaction.update(roomRef, { gameState: cleanState });
            });
        } catch (error: any) {
            // ✅ FIX: Retry automatique sur les conflits de concurrence Firestore
            // 'failed-precondition' et 'aborted' sont des erreurs transitoires lors d'écritures simultanées.
            const isRetriable = error?.code === 'failed-precondition' || error?.code === 'aborted';
            if (isRetriable && retries > 0) {
                await new Promise(r => setTimeout(r, 150));
                return safeUpdateGameState(targetGameId, newState, retries - 1);
            }
            LogService.error('useGameSync', 'safeUpdateGameState failed (no retries left):', error);
            throw error;
        }
    }, [isSoloMode]);


    return {
        gameState,
        roomData,
        isStarting,
        safeUpdateGameState,
        setGameState,
        setIsStarting,
        setRoomData
    };
};
