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
export function initMeytKayali(myHand: Domino[], opponentIds: string[], initialHandSize = 7): MeytKayaliState {
    return {
        tracker: initTileTracker(myHand, opponentIds, initialHandSize),
        profiles: initOpponentProfiles(opponentIds, initialHandSize),
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

    const liveState = rebuildStateFromGame(gameState, botId);

    const hand = botPlayer.hand;
    const leftValue = gameState.table.leftValue;
    const rightValue = gameState.table.rightValue;

    const validMoves = getValidMoves(hand, { left: leftValue, right: rightValue });
    if (validMoves.length === 0) return { decision: null, updatedState: liveState };
    if (validMoves.length === 1) {
        return {
            decision: moveToDecision(validMoves[0]),
            updatedState: liveState,
        };
    }

    const opponentIds = gameState.players
        .filter(p => p.id !== botId && p.status !== 'DISCONNECTED')
        .map(p => p.id);

    const boudeRisk = calculateBoudeRisk(gameState, liveState.tracker);
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
            liveState.tracker,
            opponentIds,
            adaptedN
        );

        let score = weights.winRate * mc.winRate + weights.boudeSafety * mc.boudeSafetyScore;

        // Malus si ce coup donne une sortie à un adversaire CRITICAL
        if (wouldHelpCritical(liveState.profiles, newLeft ?? 0, newRight ?? 0)) {
            score -= 0.3;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    if (!bestMove) bestMove = validMoves[0];

    // Mettre à jour le tracker avec la tuile jouée par le bot
    const updatedTracker = onTilePlayed(liveState.tracker, bestMove.tile);

    return {
        decision: moveToDecision(bestMove),
        updatedState: { ...liveState, tracker: updatedTracker },
    };
}

function moveToDecision(move: ValidMove): MeytKayaliDecision {
    return { tile: move.tile, side: move.side, isReversed: move.isReversed };
}

function rebuildStateFromGame(gameState: GameState, botId: string): MeytKayaliState {
    const botPlayer = gameState.players.find(p => p.id === botId);
    if (!botPlayer) {
        return initMeytKayali([], []);
    }

    const opponentIds = gameState.players
        .filter(p => p.id !== botId)
        .map(p => p.id);

    let state = initMeytKayali(botPlayer.hand, opponentIds, gameState.startingHandSize || 7);

    const seqByDominoId = new Map<string, { sideAtTable: 'left' | 'right'; isReversed: boolean }>();
    for (const se of gameState.table.sequence) {
        seqByDominoId.set(se.domino.id, { sideAtTable: se.sideAtTable, isReversed: se.isReversed });
    }

    let currentLeft: number | null = null;
    let currentRight: number | null = null;
    let isFirstPlay = true;

    for (const entry of gameState.history) {
        if (entry.action === 'PLAY' && entry.domino) {
            if (entry.playerId === botId) {
                state = { ...state, tracker: onTilePlayed(state.tracker, entry.domino) };
            } else {
                state = updateAfterOpponentPlay(state, entry.playerId, entry.domino);
            }

            if (isFirstPlay) {
                currentLeft = entry.domino.left;
                currentRight = entry.domino.right;
                isFirstPlay = false;
            } else {
                const se = seqByDominoId.get(entry.domino.id);
                if (se) {
                    if (se.sideAtTable === 'left') {
                        currentLeft = se.isReversed ? entry.domino.right : entry.domino.left;
                    } else {
                        currentRight = se.isReversed ? entry.domino.left : entry.domino.right;
                    }
                }
            }
        } else if (entry.action === 'PASS' && entry.playerId !== botId) {
            state = updateAfterOpponentPass(state, entry.playerId, currentLeft, currentRight);
        }
    }

    return state;
}
