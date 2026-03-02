import { useState } from 'react';
import { GameState, Domino, GameRoom } from '../../core/types';
import { useTurnManager } from './useTurnManager';
import { useActionDispatcher } from './useActionDispatcher';
import { useBotDecision } from './useBotDecision';

export interface UseGameEngineProps {
    gameState: GameState | null;
    localPlayerId: string;
    isSoloMode: boolean;
    gameId: string | undefined;
    isPaused: boolean;
    isLocalHost: boolean;
    roomData?: GameRoom | null;
    userId?: string;
    startingHandSize?: number;
    safeUpdateGameState: (gameId: string, newState: GameState) => Promise<void>;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    clearAllTurnTimers: () => void;
    setOvertime: React.Dispatch<React.SetStateAction<number | null>>;
    setTimeLeft: React.Dispatch<React.SetStateAction<number | null>>;
    onTilePlayed?: (tile: Domino) => void;
    onRestartMatch?: () => void;
    onReplay?: () => void;
}

export const useGameEngine = ({
    gameState,
    localPlayerId,
    isSoloMode,
    gameId,
    isPaused,
    isLocalHost,
    roomData,
    startingHandSize,
    safeUpdateGameState,
    setGameState,
    clearAllTurnTimers,
    setOvertime,
    setTimeLeft,
    onTilePlayed,
    onRestartMatch,
    onReplay
}: UseGameEngineProps) => {
    const [pendingDomino, setPendingDomino] = useState<Domino | null>(null);

    // 1. Initialiser le TurnManager pour le contrôle des verrous
    const turnManager = useTurnManager({ gameState });

    // 2. Initialiser le Dispatcher pour canaliser les mutations
    const { dispatch } = useActionDispatcher({
        gameState,
        localPlayerId,
        isSoloMode,
        gameId,
        isLocalHost,
        roomData: roomData || null,
        startingHandSize,
        acquireLock: turnManager.acquireLock,
        releaseLock: turnManager.releaseLock,
        canAction: turnManager.canAction,
        safeUpdateGameState,
        setGameState: setGameState as any,
        clearAllTurnTimers,
        setOvertime,
        onTilePlayed
    });

    // 3. Activer la réflexion autonome des bots
    useBotDecision({
        gameState,
        roomData: roomData || null,
        localPlayerId,
        isSoloMode,
        isPaused,
        canAction: turnManager.canAction,
        dispatch
    });

    const handlePlayDomino = async (domino: Domino) => {
        if (!gameState || isPaused) return;

        const player = gameState.players.find(p => p.id === localPlayerId);
        if (!player) return;

        // Auto-sélection du côté si un seul coup valide est disponible
        import('../../core/DominoEngine').then(({ getValidMoves }) => {
            const validMoves = getValidMoves([domino], {
                left: gameState.table.leftValue,
                right: gameState.table.rightValue
            });

            if (validMoves.length === 0) return;

            if (validMoves.length > 1) {
                import('../../core/audio/SoundManager').then((SoundManager) => {
                    try {
                        if ((SoundManager.default as any).playSound) (SoundManager.default as any).playSound('notify');
                    } catch (e) { }
                });
                setPendingDomino(domino);
            } else {
                setTimeLeft(null);
                setOvertime(null);
                clearAllTurnTimers();
                const side = validMoves[0].side === 'start' ? undefined : validMoves[0].side;
                dispatch({ type: 'PLAY_TILE', playerId: localPlayerId, tile: domino, side });
            }
        });
    };

    const confirmSidePlay = (side: 'left' | 'right') => {
        if (!pendingDomino || !gameState) return;
        setTimeLeft(null);
        setOvertime(null);
        clearAllTurnTimers();
        dispatch({ type: 'PLAY_TILE', playerId: localPlayerId, tile: pendingDomino, side });
        setPendingDomino(null);
    };

    const handlePassTurn = (forcedPlayerId?: string) => {
        if (!gameState) return;
        const targetId = forcedPlayerId || localPlayerId;
        setTimeLeft(null);
        setOvertime(null);
        clearAllTurnTimers();
        dispatch({ type: 'PASS_TURN', playerId: targetId });
    };

    const handleTimeout = (playerId?: string) => {
        if (!gameState) return;
        const targetId = playerId || gameState.currentPlayerId;
        if (!targetId) return;
        dispatch({ type: 'TIMEOUT', playerId: targetId });
    };

    const handleNextRound = () => {
        dispatch({ type: 'NEXT_ROUND' });
    };

    const handleOverlayContinue = () => {
        if (!gameState) return;

        if (gameState.phase === 'MATCH_END') {
            if (isSoloMode) {
                if (onRestartMatch) onRestartMatch();
            } else {
                if (onReplay) onReplay();
            }
        } else if (gameState.phase === 'BOUDE') {
            dispatch({ type: 'RESOLVE_BOUDE' });
        } else {
            dispatch({ type: 'NEXT_ROUND' });
        }
    };

    return {
        dispatch,
        handlePlayDomino,
        confirmSidePlay,
        handlePassTurn,
        handleTimeout,
        handleOverlayContinue,
        handleNextRound,
        pendingDomino,
        setPendingDomino,
        isProcessingMove: turnManager.isProcessingMove.current,
        turnManager
    };
};
