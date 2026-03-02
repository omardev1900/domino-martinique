import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { GameState, GameRoom } from '../../core/types';
import { db } from '../../core/services/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';

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
    }, [gameState]);
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
            console.error('[useGameSync] onSnapshot Error:', error);
            setIsStarting(false);
        });

        return () => {

            unsubscribe();
            // Note: In React Native, running async cleanup here on simple unmount can be tricky,
            // so we rely on beforeunload for actual hard closes.
        };
    }, [gameId, isSoloMode, signalPlayerOnline]);



    // Safe update method preventing stale data overwrites
    const safeUpdateGameState = useCallback(async (targetGameId: string, newState: GameState) => {
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

                if (!currentState) {
                    transaction.update(roomRef, { gameState: newState });
                    return;
                }

                // Compare timestamps to avoid split-brain rewrites
                // Allow write if same phase AND new timestamp is higher, or if phase changed (e.g PLAYING -> END)
                if (newState.phase === currentState.phase && newState.lastActionTimestamp <= currentState.lastActionTimestamp) {

                    return; // Skip update
                }

                // If it's a valid move, stringify to remove undefined
                const cleanState = JSON.parse(JSON.stringify(newState));
                transaction.update(roomRef, { gameState: cleanState });
            });
        } catch (error) {
            console.error('[useGameSync] safeUpdateGameState failed:', error);
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
