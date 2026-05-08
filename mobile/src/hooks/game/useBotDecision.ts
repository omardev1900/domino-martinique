import { useEffect, useRef } from 'react';
import { GameState, GameRoom } from '../../core/types';
import { computeBotDecision } from '../../core/BotEngine';
import { ActionCommand } from './useActionDispatcher';
import {
    MeytKayaliState,
    initMeytKayali,
    getMeytKayaliMove,
    updateAfterOpponentPlay,
    updateAfterOpponentPass,
} from '../../core/MeytKayaliEngine';

export interface UseBotDecisionProps {
    gameState: GameState | null;
    roomData: GameRoom | null;
    localPlayerId: string;
    isSoloMode: boolean;
    isPaused: boolean;
    canAction: (playerId: string, options?: { isAuto?: boolean; minAgeMs?: number }) => boolean;
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
    useEffect(() => { dispatchRef.current = dispatch; });

    const canActionRef = useRef(canAction);
    useEffect(() => { canActionRef.current = canAction; });

    // Garder le state frais
    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // État interne du moteur MÈTKAYALI par bot (clé = playerId)
    const meytKayaliStates = useRef<Map<string, MeytKayaliState>>(new Map());

    // Initialiser / réinitialiser le moteur MÈTKAYALI quand une nouvelle partie commence
    const lastGameIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!gameState || gameState.phase === 'LOBBY') return;
        if (gameState.gameId === lastGameIdRef.current) return;
        lastGameIdRef.current = gameState.gameId;

        // Pour chaque bot METKAYALI, initialiser son état
        meytKayaliStates.current.clear();
        for (const player of gameState.players) {
            if (player.difficulty === 'METKAYALI' && player.status === 'BOT') {
                const opponentIds = gameState.players
                    .filter(p => p.id !== player.id)
                    .map(p => p.id);
                meytKayaliStates.current.set(
                    player.id,
                    initMeytKayali(player.hand, opponentIds)
                );
            }
        }
    }, [gameState?.gameId]);

    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused) {
            return;
        }

        const currentPlayerId = gameState.currentPlayerId;
        if (!currentPlayerId) return;

        const activePlayer = gameState.players?.find(p => p.id === currentPlayerId);

        // Uniquement pour les bots / déconnectés
        if (!activePlayer || activePlayer.status === 'HUMAN') {
            return;
        }

        // Anti-split-brain en multi : Seul le host calcule et envoie le coup du bot
        if (!isSoloMode && roomData && roomData.createdBy !== localPlayerId) {
            return;
        }

        const capturedTurnId = gameState.turnId;

        // Délai de réflexion : court pour un joueur subitement déco, naturel pour un bot
        const delayMs = activePlayer.status === 'DISCONNECTED'
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
            if (!canActionRef.current(currentPlayerId, { isAuto: false })) {

                return;
            }

            // Calcul de la décision
            let tileToPlay = null;
            let sideToPlay: 'left' | 'right' | 'start' = 'start';

            if (activePlayer.difficulty === 'METKAYALI') {
                // Moteur Monte-Carlo MÈTKAYALI
                const mkState = meytKayaliStates.current.get(currentPlayerId)
                    ?? initMeytKayali(activePlayer.hand, freshState.players.filter(p => p.id !== currentPlayerId).map(p => p.id));

                const { decision: mkDecision, updatedState } = getMeytKayaliMove(mkState, freshState, currentPlayerId);
                meytKayaliStates.current.set(currentPlayerId, updatedState);

                if (mkDecision) {
                    tileToPlay = mkDecision.tile;
                    sideToPlay = mkDecision.side;
                }
            } else {
                // Moteur classique (TI_MANMAY / MAPIPI / GRAN_MOUN)
                const decision = computeBotDecision(freshState, currentPlayerId);
                if (decision) {
                    tileToPlay = decision.tile;
                    sideToPlay = decision.side as 'left' | 'right' | 'start';
                }
            }

            if (tileToPlay) {
                dispatchRef.current({
                    type: 'PLAY_TILE',
                    playerId: currentPlayerId,
                    tile: tileToPlay,
                    side: sideToPlay
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
