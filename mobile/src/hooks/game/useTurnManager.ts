import { useRef, useEffect, useCallback } from 'react';
import { GameState } from '../../core/types';

export interface UseTurnManagerProps {
    gameState: GameState | null;
}

export interface UseTurnManagerResult {
    isProcessingMove: React.MutableRefObject<boolean>;
    acquireLock: () => boolean;
    releaseLock: () => void;
    canAction: (playerId: string, isTimeoutAction?: boolean) => boolean;
}

const TURN_IMMUNITY_MS = 5000;

export const useTurnManager = ({ gameState }: UseTurnManagerProps): UseTurnManagerResult => {
    // ✅ RÈGLE DE SÉCURITÉ GLOBALE : Ce hook possède le verrou central.
    // Personne d'autre ne doit déclarer un `isProcessingMove`.
    const isProcessingMove = useRef<boolean>(false);

    // ✅ IMMUNITÉ DE TOUR : Enregistre le timestamp de montage du tour local.
    const turnMountedAtRef = useRef<number>(Date.now());

    // Auto-Release du verrou quand le tour change
    useEffect(() => {
        if (gameState?.turnId !== undefined) {
            turnMountedAtRef.current = Date.now();
            isProcessingMove.current = false;

        }
    }, [gameState?.turnId]);

    const acquireLock = useCallback((): boolean => {
        if (isProcessingMove.current) {

            return false; // Verrou déjà pris
        }
        isProcessingMove.current = true;
        return true;
    }, []);

    const releaseLock = useCallback(() => {
        isProcessingMove.current = false;
    }, []);

    const canAction = useCallback((playerId: string, isTimeoutAction: boolean = false): boolean => {
        if (!gameState) return false;

        // 1. C'est bien son tour ?
        if (gameState.currentPlayerId !== playerId) {
            return false;
        }

        // 2. Le verrou est-il libre ?
        if (isProcessingMove.current) {
            return false;
        }

        // 3. Immunité de tour (uniquement pour les timeouts auto)
        if (isTimeoutAction) {
            const turnAge = Date.now() - turnMountedAtRef.current;
            if (turnAge < TURN_IMMUNITY_MS) {

                return false;
            }
        }

        return true;
    }, [gameState]);

    return {
        isProcessingMove,
        acquireLock,
        releaseLock,
        canAction
    };
};
