import { useState, useEffect, useRef } from 'react';
import { GameState, Domino } from '../../core/types';
import { getValidMoves } from '../../core/DominoEngine';
import SoundManager from '../../core/audio/SoundManager';
import { ActionCommand } from './useActionDispatcher';

export interface UseAutoPassProps {
    gameState: GameState | null;
    localPlayerId: string;
    isLocalHost: boolean;
    isPaused: boolean;
    dispatch: (command: ActionCommand) => Promise<void>;
}

export const useAutoPass = ({
    gameState,
    localPlayerId,
    isLocalHost,
    isPaused,
    dispatch
}: UseAutoPassProps) => {
    const [visualBoudePlayerId, setVisualBoudePlayerId] = useState<string | null>(null);

    // Garder une ref du dispatch et de l'état pour les timeouts
    const dispatchRef = useRef(dispatch);
    useEffect(() => { dispatchRef.current = dispatch; });

    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) {
            setVisualBoudePlayerId(null);
            return;
        }

        const currentPlayerId = gameState.currentPlayerId;
        const activePlayer = gameState.players?.find(p => p.id === currentPlayerId);

        if (!activePlayer) return;

        // 1. Détecter si le joueur n'a aucun coup possible
        const validMoves = getValidMoves(activePlayer.hand, {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (validMoves.length > 0) {
            setVisualBoudePlayerId(null);
            return;
        }

        // 2. Déterminer si cette instance doit piloter l'auto-pass
        // Cas A : C'est le tour physique du joueur local (Humain)
        const isLocalTurn = currentPlayerId === localPlayerId;

        // Cas B : C'est un Bot ou un Déconnecté, et nous sommes le Host
        const isBotOrDisco = activePlayer.status !== 'HUMAN';
        const shouldIDispatch = isLocalTurn || (isBotOrDisco && isLocalHost);

        if (!shouldIDispatch) return;

        const capturedTurnId = gameState.turnId;

        // 3. Séquence visuelle
        setVisualBoudePlayerId(currentPlayerId);
        try {
            SoundManager.playSound('toktok');
        } catch (e) {
            // Ignorer les erreurs sonores en test/background
        }

        const timer = setTimeout(() => {
            const freshState = gameStateRef.current;
            if (freshState && freshState.turnId === capturedTurnId) {
                dispatchRef.current({
                    type: 'PASS_TURN',
                    playerId: currentPlayerId
                });
            }
            setVisualBoudePlayerId(null);
        }, 1500);

        return () => {
            clearTimeout(timer);
            setVisualBoudePlayerId(null);
        };
    }, [gameState?.turnId, isPaused, localPlayerId, isLocalHost]);

    return { visualBoudePlayerId };
};
