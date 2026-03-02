import { useState, useEffect, useCallback } from 'react';
import { db } from '../../core/services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { GameRoom } from '../../core/types';

export interface UseConnectionStatusProps {
    gameId: string | undefined;
    localPlayerId: string;
    isSoloMode: boolean;
}

export interface UseConnectionStatusResult {
    isRejoining: boolean;
    signalPlayerOnline: () => Promise<void>;
    signalPlayerOffline: () => Promise<void>;
}

export const useConnectionStatus = ({
    gameId,
    localPlayerId,
    isSoloMode
}: UseConnectionStatusProps): UseConnectionStatusResult => {
    // ✅ FIX ANTI-ZOMBIE: signal visible pour l'UI quand un joueur reprend sa connexion
    const [isRejoining, setIsRejoining] = useState(false);

    // Anti-Zombie / Reconnection logic
    const signalPlayerOnline = useCallback(async () => {
        if (!gameId || isSoloMode) return;

        const roomRef = doc(db, 'rooms', gameId);
        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) return;

                const roomData = roomDoc.data() as GameRoom;
                const state = roomData.gameState;
                if (!state || !state.players) return;

                // Remove zombie status
                let stateUpdated = false;
                const updatedPlayers = state.players.map((p) => {
                    if (p.id === localPlayerId && (p.isBot || p.isDisconnected)) {
                        stateUpdated = true;
                        return { ...p, isBot: false, isDisconnected: false };
                    }
                    return p;
                });

                if (stateUpdated) {

                    transaction.update(roomRef, {
                        'gameState.players': updatedPlayers
                    });
                    // Signal la reprise à l'UI
                    setIsRejoining(true);
                    setTimeout(() => setIsRejoining(false), 3000);
                }
            });
        } catch (error) {
            console.error('[useConnectionStatus] Error signalPlayerOnline:', error);
        }
    }, [gameId, isSoloMode, localPlayerId]);

    // Disconnect logic for Rage Quit / Tab Close
    const signalPlayerOffline = useCallback(async () => {
        if (!gameId || isSoloMode) {

            return;
        }

        // This transaction must run quickly (beforeunload)
        const roomRef = doc(db, 'rooms', gameId);
        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) return;

                const roomData = roomDoc.data() as GameRoom;
                const state = roomData.gameState;
                if (!state || !state.players) return;

                const updatedPlayers = state.players.map((p) => {
                    if (p.id === localPlayerId) {
                        return { ...p, isBot: true, isDisconnected: true };
                    }
                    return p;
                });

                transaction.update(roomRef, {
                    'gameState.players': updatedPlayers
                });

            });
        } catch (error) {
            console.error('[useConnectionStatus] Error signalPlayerOffline:', error);
        }
    }, [gameId, isSoloMode, localPlayerId]);

    return {
        isRejoining,
        signalPlayerOnline,
        signalPlayerOffline
    };
};
