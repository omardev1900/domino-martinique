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
        console.log("CHIRÉE DETECTED! Manche ends, stars reset, manche increments.");

        // Reset all stars to 0 - new manche starts clean
        newState.players = newState.players.map(p => ({
            ...p,
            currentMancheStars: 0,
            isCochon: false, // Reset cochon flag for new manche
        }));

        newState.mancheResult = 'CHIRE';
        newState.firstPlayerOfRound = winnerId; // Round winner restarts

        // ✅ FIX 1: Create mancheHistory entry so cumulative points are tracked
        if (!newState.mancheHistory) newState.mancheHistory = [];
        newState.mancheHistory.push({
            mancheNumber: newState.mancheHistory.length + 1,
            points: pointsGainedInRound,
            winnerId: winnerId as string,
            resultType: 'CHIRE',
            cochonCount: 0
        });

        // ✅ FIX 2: Use MANCHE_END so handleNextRound increments mancheNumber
        newState.phase = 'MANCHE_END';

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
    // NEW RULE: Match ends ONLY at the end of a Manche (mancheWinner OR isChire)
    let isMatchOver = false;
    if (mancheWinner || isChire) {
        if (newState.gameMode === 'MANCHE') {
            // Match ends ONLY when fixed number of manches played
            isMatchOver = newState.mancheHistory && newState.mancheHistory.length >= newState.winningCondition;
        } else if (newState.gameMode === 'SCORE') {
            const maxPoints = Math.max(...newState.players.map(p => p.totalPoints));
            if (maxPoints >= newState.winningCondition) {
                // TIE BREAKER: Only end if there is a unique winner with the maximum points
                const leaders = newState.players.filter(p => p.totalPoints === maxPoints);
                isMatchOver = leaders.length === 1;
                if (leaders.length > 1) {
                    console.log(`TIE AT THRESHOLD (${maxPoints})! Continuing for another manche...`);
                }
            }
        } else if (newState.gameMode === 'COCHON') {
            const maxCochons = Math.max(...newState.players.map(p => p.totalCochons));
            if (maxCochons >= newState.winningCondition) {
                // TIE BREAKER: Only end if there is a unique winner with the maximum cochons
                const leaders = newState.players.filter(p => p.totalCochons === maxCochons);
                isMatchOver = leaders.length === 1;
                if (leaders.length > 1) {
                    console.log(`TIE AT COCHON THRESHOLD (${maxCochons})! Continuing for another manche...`);
                }
            }
        }
    }

    if (isMatchOver) {
        newState.phase = 'MATCH_END';
    } else if (mancheWinner || isChire) {
        newState.phase = 'MANCHE_END';
        if (mancheWinner) newState.firstPlayerOfRound = mancheWinner.id;
    }

    return newState;
};
