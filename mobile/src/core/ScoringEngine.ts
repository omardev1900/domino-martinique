import { GameState, Player, PlayerId, GameMode, MancheResult } from './types';
import { MANCHE_WIN_THRESHOLD, WINS_TO_WIN_MATCH } from './constants';

/**
 * calculateHandPoints : Somme des points d'une main
 */
export const calculateHandPoints = (hand: any[]): number => {
    return hand.reduce((sum, d) => sum + d.left + d.right, 0);
};

export const determineWinnerOnBoudé = (players: Player[]): PlayerId | 'TIE' => {
    const scores = players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand), hand: p.hand }));
    const minScore = Math.min(...scores.map(s => s.score));
    const candidates = scores.filter(s => s.score === minScore);

    if (candidates.length === 1) return candidates[0].id;

    // RULE: If more than one player has the same minimum score, it's a TIE.
    // No tie-breaker. The round is ignored and restarted.
    return 'TIE';
};

/**
 * finalizeRound : Logique stricte de fin de round.
 * Ordre des Priorités :
 * 1. Attribution : Gagnant +1 Étoile, +1 Point de Round.
 * 2. Détection CHIRÉE (Priorité 1) : Si TOUS les joueurs ont >= 1 Étoile -> Reset Étoiles, Fin de Round (pas de manche).
 * 3. Détection VICTOIRE MANCHE (Priorité 2) : Si un joueur a 3 Étoiles -> Fin de Manche + Bonus Cochon.
 */
export const finalizeRound = (
    gameState: GameState,
    winnerId: PlayerId | 'TIE'
): GameState => {
    // 0. Clone state
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;

    if (winnerId === 'TIE') {
        newState.phase = 'BOUDE';
        return newState;
    }

    // --- ETAPE 1 : ATTRIBUTION ---
    // Le gagnant reçoit +1 Étoile (currentMancheStars) et +1 Point de Round (totalRoundWins)
    const pointsGainedInRound: { [playerId: string]: number } = {};
    newState.players = newState.players.map(p => {
        if (p.id === winnerId) {
            pointsGainedInRound[p.id] = 1;
            return {
                ...p,
                currentMancheStars: p.currentMancheStars + 1, // Étoile (+1 currentMancheStars)
                totalRoundWins: (p.totalRoundWins || 0) + 1, // Point de Round permanent
                totalPoints: (p.totalPoints || 0) + 1 // Le Camion (totalMatchPoints) avance aussi de 1 par victoire de round
            };
        }
        pointsGainedInRound[p.id] = 0;
        return p;
    });

    // --- ETAPE 2 : DÉTECTION CHIRÉE (PRIORITÉ 1) ---
    // Si TOUS les joueurs ont au moins 1 étoile.
    const isChire = newState.players.every(p => p.currentMancheStars >= 1);

    if (isChire) {
        console.log("CHIRÉE DETECTED! Resetting stars.");
        // ACTION : Reset immédiat de TOUTES les Étoiles à 0.
        newState.players = newState.players.map(p => ({
            ...p,
            currentMancheStars: 0 // Reset Étoiles
        }));

        newState.mancheResult = 'CHIRE';
        newState.phase = 'PARTIE_END'; // La manche continue (repart à zéro), mais le round est fini.
        newState.firstPlayerOfRound = winnerId; // Le gagnant de la "chirée" relance

        // Record as a "special" history entry if needed, but usually Chiré just continues the manche
        return newState;
    }

    // --- ETAPE 3 : DÉTECTION VICTOIRE MANCHE (PRIORITÉ 2) ---
    const mancheWinner = newState.players.find(p => p.currentMancheStars >= MANCHE_WIN_THRESHOLD);

    if (mancheWinner) {
        console.log(`MANCHE WINNER: ${mancheWinner.id}`);
        // 3.2 Calcul Bonus/Malus Cochon
        const losersAtZero = newState.players.filter(p => p.currentMancheStars === 0);
        const cochonCount = losersAtZero.length;

        if (cochonCount > 0) {
            console.log(`COCHON DETECTED! Count: ${cochonCount}`);
            newState.mancheResult = 'COCHON';
        } else {
            console.log("Manche finished normally.");
            newState.mancheResult = 'NORMAL';
        }

        // --- CALCULATION OF FINAL MANCHE POINTS (Rule of +5) ---
        // Winner gets 3 + opponents at zero stars.
        // Losers with stars > 0 get their stars as points.
        // Losers at 0 stars get -1.
        newState.players = newState.players.map(p => {
            let finalManchePoints = 0;
            let updatedPlayer = { ...p };

            if (p.id === mancheWinner.id) {
                finalManchePoints = 3 + cochonCount;
                updatedPlayer = {
                    ...p,
                    mancheWins: p.mancheWins + 1,
                    totalPoints: p.totalPoints + cochonCount, // Bonus cochons (+1 round point already added previously)
                    totalCochons: p.totalCochons + cochonCount
                };
            } else if (p.currentMancheStars === 0) {
                finalManchePoints = -1;
                updatedPlayer = {
                    ...p,
                    isCochon: true,
                    totalPoints: p.totalPoints - 1
                };
            } else {
                finalManchePoints = p.currentMancheStars;
            }

            // Update the points record used for History and Overlay
            pointsGainedInRound[p.id] = finalManchePoints;
            return updatedPlayer;
        });

        // Record Manche History
        if (!newState.mancheHistory) newState.mancheHistory = [];
        newState.mancheHistory.push({
            mancheNumber: newState.mancheHistory.length + 1,
            points: pointsGainedInRound,
            winnerId: mancheWinner.id,
            resultType: newState.mancheResult || 'NORMAL',
            cochonCount: cochonCount
        });
    }

    // Ensure firstPlayerOfRound is ALWAYS updated to the round winner
    // This is used for animations and avatar display in overlays
    newState.firstPlayerOfRound = winnerId;

    if (!isChire && !mancheWinner) {
        // Pas de Chirée, pas de Victoire Manche -> Juste fin de round
        newState.phase = 'PARTIE_END';
        newState.mancheResult = null;
    }

    // 3.3 Check Match End
    let isMatchOver = false;
    if (newState.gameMode === 'MANCHE') {
        // NEW RULE: Match ends ONLY when fixed number of manches played
        isMatchOver = newState.mancheHistory && newState.mancheHistory.length >= newState.winningCondition;
    } else if (newState.gameMode === 'SCORE') {
        isMatchOver = newState.players.some(p => p.totalPoints >= newState.winningCondition);
    } else if (newState.gameMode === 'COCHON') {
        isMatchOver = newState.players.some(p => p.totalCochons >= newState.winningCondition);
    }

    if (isMatchOver) {
        newState.phase = 'MATCH_END';
    } else if (mancheWinner) {
        newState.phase = 'MANCHE_END';
        newState.firstPlayerOfRound = mancheWinner.id;
    }

    return newState;
};
