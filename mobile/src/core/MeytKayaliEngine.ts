import { Domino, DominoSide, GameState } from './types';
import { getValidMoves } from './DominoEngine';
import { ValidMove } from './DominoEngine';
import {
    TileTracker,
    initTileTracker,
    onOpponentPlayed,
    onOpponentPassed,
    onTilePlayed,
} from './ai/TileTracker';
import {
    OpponentProfiles,
    initOpponentProfiles,
    updateOnPlay,
    updateOnPass,
    wouldHelpCritical,
} from './ai/OpponentModeler';
import {
    calculateBoudeRisk,
    getStrategyMode,
    getMCWeights,
} from './ai/EndgameAnalyzer';
import { simulateCoup } from './ai/MonteCarlo';

export interface MeytKayaliDecision {
    tile: Domino;
    side: 'left' | 'right' | 'start';
    isReversed: boolean;
}

/**
 * État interne du moteur MÈTKAYALI pour une partie.
 * À conserver entre les tours via useRef dans useBotDecision.
 */
export interface MeytKayaliState {
    tracker: TileTracker;
    profiles: OpponentProfiles;
}

/**
 * Initialise le moteur pour une nouvelle partie.
 */
export function initMeytKayali(myHand: Domino[], opponentIds: string[]): MeytKayaliState {
    return {
        tracker: initTileTracker(myHand, opponentIds),
        profiles: initOpponentProfiles(opponentIds),
    };
}

/**
 * Met à jour l'état après un coup d'un adversaire.
 */
export function updateAfterOpponentPlay(
    state: MeytKayaliState,
    playerId: string,
    tile: Domino
): MeytKayaliState {
    const tracker = onOpponentPlayed(state.tracker, playerId, tile);
    const profiles = updateOnPlay(state.profiles, tracker, playerId, tile);
    return { tracker, profiles };
}

/**
 * Met à jour l'état après un passage d'un adversaire.
 */
export function updateAfterOpponentPass(
    state: MeytKayaliState,
    playerId: string,
    leftValue: DominoSide | null,
    rightValue: DominoSide | null
): MeytKayaliState {
    const tracker = onOpponentPassed(state.tracker, playerId, leftValue, rightValue);
    const profiles = updateOnPass(state.profiles, tracker, playerId, leftValue, rightValue);
    return { tracker, profiles };
}

/**
 * Point d'entrée principal : calcule le meilleur coup pour le bot MÈTKAYALI.
 * Retourne null si aucun coup n'est possible (passage).
 */
export function getMeytKayaliMove(
    engineState: MeytKayaliState,
    gameState: GameState,
    botId: string,
    simCount = 500
): { decision: MeytKayaliDecision | null; updatedState: MeytKayaliState } {
    const botPlayer = gameState.players.find(p => p.id === botId);
    if (!botPlayer) return { decision: null, updatedState: engineState };

    const hand = botPlayer.hand;
    const leftValue = gameState.table.leftValue;
    const rightValue = gameState.table.rightValue;

    const validMoves = getValidMoves(hand, { left: leftValue, right: rightValue });
    if (validMoves.length === 0) return { decision: null, updatedState: engineState };
    if (validMoves.length === 1) {
        return {
            decision: moveToDecision(validMoves[0]),
            updatedState: engineState,
        };
    }

    const opponentIds = gameState.players
        .filter(p => p.id !== botId && p.status !== 'DISCONNECTED')
        .map(p => p.id);

    const boudeRisk = calculateBoudeRisk(gameState, engineState.tracker);
    const mode = getStrategyMode(boudeRisk);
    const weights = getMCWeights(mode);

    // Réduire les simulations en fin de partie pour rester dans le budget temps
    const avgHandSize = hand.length;
    const adaptedN = avgHandSize <= 3 ? Math.min(simCount, 200) : simCount;

    let bestMove: ValidMove | null = null;
    let bestScore = -Infinity;

    for (const move of validMoves) {
        // Main du bot après ce coup
        const handAfter = hand.filter(t => t.id !== move.tile.id);

        // Nouvelles extrémités après ce coup
        let newLeft = leftValue;
        let newRight = rightValue;
        if (move.side === 'left') {
            newLeft = move.isReversed ? move.tile.right : move.tile.left;
        } else if (move.side === 'right') {
            newRight = move.isReversed ? move.tile.left : move.tile.right;
        } else {
            newLeft = move.tile.left;
            newRight = move.tile.right;
        }

        const mc = simulateCoup(
            handAfter,
            move.tile,
            move.side,
            newLeft,
            newRight,
            engineState.tracker,
            opponentIds,
            adaptedN
        );

        let score = weights.winRate * mc.winRate + weights.boudeSafety * mc.boudeSafetyScore;

        // Malus si ce coup donne une sortie à un adversaire CRITICAL
        if (wouldHelpCritical(engineState.profiles, newLeft ?? 0, newRight ?? 0)) {
            score -= 0.3;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    if (!bestMove) bestMove = validMoves[0];

    // Mettre à jour le tracker avec la tuile jouée par le bot
    const updatedTracker = onTilePlayed(engineState.tracker, bestMove.tile);

    return {
        decision: moveToDecision(bestMove),
        updatedState: { ...engineState, tracker: updatedTracker },
    };
}

function moveToDecision(move: ValidMove): MeytKayaliDecision {
    return { tile: move.tile, side: move.side, isReversed: move.isReversed };
}
