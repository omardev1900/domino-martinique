import { Domino, DominoSide } from '../types';
import { TileTracker, allTiles, tileId } from './TileTracker';
import { getValidMoves, calculateHandPoints } from '../DominoEngine';
import { handBoudeSafetyScore } from './EndgameAnalyzer';

export interface MCResult {
    winRate: number;
    boudeSafetyScore: number;
    simulations: number;
}

interface SimPlayer {
    id: string;
    hand: Domino[];
}

interface SimState {
    players: SimPlayer[];
    leftValue: DominoSide | null;
    rightValue: DominoSide | null;
    currentIdx: number;
    passCount: number;
}

/**
 * Simule N parties pour évaluer un coup candidat.
 * Retourne win_rate et boudeSafetyScore entre 0 et 1.
 */
export function simulateCoup(
    myHand: Domino[],              // Main du bot APRÈS avoir joué la tuile candidate
    candidateTile: Domino,         // Tuile que le bot envisage de jouer
    candidateSide: 'left' | 'right' | 'start',
    leftValue: DominoSide | null,  // Nouvelle extrémité gauche après le coup
    rightValue: DominoSide | null, // Nouvelle extrémité droite après le coup
    tracker: TileTracker,
    opponentIds: string[],
    N = 500,
    timeBudgetMs = 80
): MCResult {
    const start = Date.now();
    let wins = 0;
    let boudeSafetyTotal = 0;
    let simsDone = 0;

    // Tuiles inconnues (non jouées, non dans ma main)
    const unknownTiles = getUnknownTiles(tracker);

    for (let i = 0; i < N; i++) {
        if (Date.now() - start > timeBudgetMs) break;

        // Distribuer aléatoirement les tuiles inconnues aux adversaires
        const distributed = distributeUnknowns(unknownTiles, opponentIds, tracker);

        const simState: SimState = {
            players: [
                { id: 'bot', hand: [...myHand] },
                ...opponentIds.map(pid => ({ id: pid, hand: distributed.get(pid) ?? [] })),
            ],
            leftValue,
            rightValue,
            currentIdx: 1, // Les adversaires jouent d'abord après le coup du bot
            passCount: 0,
        };

        const result = runSimulation(simState, 'bot');
        if (result.winner === 'bot') wins++;
        boudeSafetyTotal += result.boudeSafety;
        simsDone++;
    }

    return {
        winRate: simsDone > 0 ? wins / simsDone : 0,
        boudeSafetyScore: simsDone > 0 ? boudeSafetyTotal / simsDone : 0,
        simulations: simsDone,
    };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function getUnknownTiles(tracker: TileTracker): Domino[] {
    const result: Domino[] = [];
    for (const [id, state] of tracker.tileStates.entries()) {
        if (state.status === 'UNKNOWN') {
            const [lo, hi] = id.split('-').map(Number);
            result.push({
                id,
                left: lo as DominoSide,
                right: hi as DominoSide,
                isDouble: lo === hi,
            });
        }
    }
    return result;
}

function distributeUnknowns(
    unknowns: Domino[],
    opponentIds: string[],
    tracker: TileTracker
): Map<string, Domino[]> {
    const result = new Map<string, Domino[]>();
    for (const pid of opponentIds) result.set(pid, []);

    const handSizes = tracker.handSizes;
    const shuffled = [...unknowns].sort(() => Math.random() - 0.5);

    let idx = 0;
    for (const pid of opponentIds) {
        const target = handSizes.get(pid) ?? 7;
        const tiles: Domino[] = [];
        for (let i = 0; i < target && idx < shuffled.length; i++, idx++) {
            tiles.push(shuffled[idx]);
        }
        result.set(pid, tiles);
    }

    return result;
}

interface SimResult {
    winner: string | 'boude';
    boudeSafety: number;
}

function runSimulation(state: SimState, botId: string): SimResult {
    const MAX_TURNS = 100;
    let turns = 0;
    const s = deepCloneSim(state);

    while (turns < MAX_TURNS) {
        turns++;
        const player = s.players[s.currentIdx % s.players.length];

        if (player.hand.length === 0) {
            return {
                winner: player.id,
                boudeSafety: player.id === botId ? 1 : 0,
            };
        }

        const moves = getValidMoves(player.hand, { left: s.leftValue, right: s.rightValue });

        if (moves.length === 0) {
            s.passCount++;
            if (s.passCount >= s.players.length) {
                // Partie bloquée : gagnant = main la plus légère
                const sorted = [...s.players].sort(
                    (a, b) => calculateHandPoints(a.hand) - calculateHandPoints(b.hand)
                );
                const winner = sorted[0].id;
                const botHand = s.players.find(p => p.id === botId)?.hand ?? [];
                return {
                    winner,
                    boudeSafety: handBoudeSafetyScore(botHand),
                };
            }
        } else {
            s.passCount = 0;
            // Heuristique GRAN_MOUN simplifiée pour les simulations
            const move = moves[Math.floor(Math.random() * moves.length)];
            player.hand = player.hand.filter(t => t.id !== move.tile.id);

            if (move.side === 'left') {
                s.leftValue = move.isReversed ? move.tile.right : move.tile.left;
            } else if (move.side === 'right') {
                s.rightValue = move.isReversed ? move.tile.left : move.tile.right;
            } else {
                s.leftValue = move.tile.left;
                s.rightValue = move.tile.right;
            }
        }

        s.currentIdx = (s.currentIdx + 1) % s.players.length;
    }

    // Timeout de sécurité : considérer comme nul
    const botHand = s.players.find(p => p.id === botId)?.hand ?? [];
    return { winner: 'boude', boudeSafety: handBoudeSafetyScore(botHand) };
}

function deepCloneSim(state: SimState): SimState {
    return {
        players: state.players.map(p => ({ id: p.id, hand: [...p.hand] })),
        leftValue: state.leftValue,
        rightValue: state.rightValue,
        currentIdx: state.currentIdx,
        passCount: state.passCount,
    };
}
