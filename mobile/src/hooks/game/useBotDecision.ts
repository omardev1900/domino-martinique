import { useEffect, useRef } from 'react';
import { GameState, GameRoom } from '../../core/types';
import { computeBotDecision } from '../../core/BotEngine';
import { ActionCommand } from './useActionDispatcher';

export interface UseBotDecisionProps {
    gameState: GameState | null;
    roomData: GameRoom | null;
    localPlayerId: string;
    isSoloMode: boolean;
    isPaused: boolean;
    canAction: (playerId: string, isTimeoutAction?: boolean) => boolean;
    dispatch: (command: ActionCommand) => Promise<void>;
}

export const useBotDecision = ({
    gameState,
    roomData,
    localPlayerId,
    isSoloMode,
    isPaused,
    canAction,
    dispatch
}: UseBotDecisionProps) => {

    const dispatchRef = useRef(dispatch);
    useEffect(() => {
        dispatchRef.current = dispatch;
    });

    const canActionRef = useRef(canAction);
    useEffect(() => {
        canActionRef.current = canAction;
    });

    // Garder le state frais
    const gameStateRef = useRef(gameState);
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) {
            return;
        }

        const currentPlayerId = gameState.currentPlayerId;
        if (!currentPlayerId) return;

        const activePlayer = gameState.players?.find(p => p.id === currentPlayerId);

        // Uniquement pour les bots / déconnectés
        if (!activePlayer || (!activePlayer.isBot && !activePlayer.isDisconnected)) {
            return;
        }

        // Anti-split-brain en multi : Seul le host calcule et envoie le coup du bot
        if (!isSoloMode && roomData && roomData.createdBy !== localPlayerId) {
            return;
        }

        const capturedTurnId = gameState.turnId;

        // Délai de réflexion : court pour un joueur subitement déco, naturel pour un bot
        const delayMs = activePlayer.isDisconnected
            ? 100
            : Math.floor(Math.random() * 500) + 1000;

        const timerId = setTimeout(() => {
            const freshState = gameStateRef.current;
            if (!freshState) return;

            // 1. A-t-on changé de tour pendant le délai ?
            if (freshState.turnId !== capturedTurnId) {

                return;
            }

            // 2. Le Dispatcher autorise-t-il l'action ?
            // Les bots ne subissent pas l'immunité timeout car c'est une action organique
            if (!canActionRef.current(currentPlayerId, false)) {

                return;
            }

            // Calcul de la décision
            const decision = computeBotDecision(freshState, currentPlayerId);

            if (decision) {

                dispatchRef.current({
                    type: 'PLAY_TILE',
                    playerId: currentPlayerId,
                    tile: decision.tile,
                    side: decision.side
                });
            } else {

                dispatchRef.current({
                    type: 'PASS_TURN',
                    playerId: currentPlayerId
                });
            }

        }, delayMs);

        return () => clearTimeout(timerId);

    }, [
        gameState?.turnId,
        gameState?.currentPlayerId,
        gameState?.phase,
        isPaused,
        localPlayerId,
        isSoloMode,
        roomData?.createdBy
    ]);
};
