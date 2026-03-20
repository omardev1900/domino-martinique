import { GameState, Player, PlayerId, GameMode, MancheResult } from './types';
import { MANCHE_WIN_THRESHOLD, WINS_TO_WIN_MATCH } from './constants';
import { LogService } from './services/LogService';

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
 * 
 * --- CLARIFICATION DES RÈGLES (Sprint 2) ---
 * 
 * C1 (Points) : La double attribution est évitée en ajoutant systématiquement 1 point
 * par round gagné au 'totalPoints'. Les bonus de "Cochon" (Manche) ne sont ajoutés
 * qu'à la fin de la manche (mancheWinner) en sus des points déjà acquis.
 * 
 * C2 (Winner) : 'firstPlayerOfRound' est mis à jour pour refléter le vainqueur du round
 * ou de la manche, garantissant une sémantique claire pour le prochain démarrage.
 * 
 * C3 (Reset) : Le reset des étoiles (currentMancheStars) et du statut Cochon (isCochon)
 * est centralisé dans 'preparePlayersForNextRound' pour être appelé par le LogicEngine.
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
                totalPoints: (p.totalPoints || 0) + 1 // Add 1 point per round win immediately
            };
        }
        pointsGainedInRound[p.id] = 0;
        return p;
    });

    // --- ETAPE 2 : DÉTECTION CHIRÉE (PRIORITÉ 1) ---
    // Si TOUS les joueurs ont au moins 1 étoile.
    const isChire = newState.players.every(p => p.currentMancheStars >= 1);

    if (isChire) {
        LogService.info('Scoring', "CHIRÉE DETECTED! Manche ends, manche increments.");

        // On ne remet PAS les étoiles à 0 ici.
        // L'écran de résultat (GameOverScreen / UnifiedResultOverlay) a besoin de lire les 'currentMancheStars' pour les afficher.
        // L'effacement des étoiles se fera via `handleNextRound` dans GameScreen.tsx lors du clic sur 'Manche suivante'.

        newState.mancheResult = 'CHIRE';
        newState.firstPlayerOfRound = winnerId; // Round winner restarts

        // ✅ FIX 1: Prendre un cliché des étoiles acquises pendant la manche chirée avant la remise à zéro
        const chirePointsGained: { [playerId: string]: number } = {};
        newState.players.forEach(p => {
            chirePointsGained[p.id] = p.currentMancheStars;
        });

        if (!newState.mancheHistory) newState.mancheHistory = [];
        newState.mancheHistory.push({
            mancheNumber: newState.mancheHistory.length + 1,
            points: chirePointsGained, // Affiche les étoiles collectées avant l'annulation
            winnerId: 'TIE', // Aucun vainqueur officiel sur une chirée
            resultType: 'CHIRE',
            cochonCount: 0
        });

        // ✅ FIX 2: Use MANCHE_END so handleNextRound increments mancheNumber
        newState.phase = 'MANCHE_END';
    }

    // --- ETAPE 3 : DÉTECTION VICTOIRE MANCHE (PRIORITÉ 2) ---
    const mancheWinner = !isChire ? newState.players.find(p => p.currentMancheStars >= MANCHE_WIN_THRESHOLD) : null;

    if (mancheWinner) {
        LogService.info('Scoring', `MANCHE WINNER: ${mancheWinner.id}`);
        // 3.2 Calcul Bonus/Malus Cochon
        const losersAtZero = newState.players.filter(p => p.currentMancheStars === 0);
        const cochonCount = losersAtZero.length;

        if (cochonCount > 0) {
            LogService.info('Scoring', `COCHON DETECTED! Count: ${cochonCount}`);
            newState.mancheResult = 'COCHON';
        } else {
            LogService.info('Scoring', "Manche finished normally.");
            newState.mancheResult = 'NORMAL';
        }

        // --- CALCULATION OF FINAL MANCHE POINTS (Rule of +5) ---
        newState.players = newState.players.map(p => {
            let historyPointsForManche = 0;
            let updatedPlayer = { ...p };

            if (p.id === mancheWinner.id) {
                // All rounds were already added to totalPoints in Step 1.
                // We only add the extra "cochon" bonus points here.
                const bonus = cochonCount;
                historyPointsForManche = p.currentMancheStars + bonus;

                updatedPlayer = {
                    ...p,
                    mancheWins: p.mancheWins + 1,
                    totalPoints: (p.totalPoints || 0) + bonus 
                };
            } else if (p.currentMancheStars === 0) {
                historyPointsForManche = -1;
                updatedPlayer = {
                    ...p,
                    isCochon: true,
                    totalPoints: (p.totalPoints || 0) - 1, // Receives -1 for being cochon
                    totalCochons: (p.totalCochons || 0) + 1
                };
            } else {
                historyPointsForManche = p.currentMancheStars;
            }

            pointsGainedInRound[p.id] = historyPointsForManche;
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
    // NEW RULE: Match ends at the end of a Manche (mancheWinner OR isChire)
    // OR immediately in SCORE/COCHON modes when a threshold is met.
    let isMatchOver = false;
    if (mancheWinner || isChire || newState.gameMode === 'SCORE' || newState.gameMode === 'COCHON') {
        if (newState.gameMode === 'MANCHE') {
            // Match ends ONLY when fixed number of manches played AND tie-breaker is resolved
            if (newState.mancheHistory && newState.mancheHistory.length >= newState.winningCondition) {
                const maxPoints = Math.max(...newState.players.map(p => p.totalPoints || 0));
                const leaders = newState.players.filter(p => (p.totalPoints || 0) === maxPoints);
                isMatchOver = leaders.length === 1;
                if (leaders.length > 1) {
                    console.log(`TIE AT MANCHE THRESHOLD (Points: ${maxPoints})! Continuing for another manche...`);
                }
            }
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

/**
 * preparePlayersForNextRound (C3) : Centralise le reset des compteurs temporaires.
 * Appelé par LogicEngine lors du passage au round/manche suivant.
 */
export const preparePlayersForNextRound = (
    nextRoundDistributedPlayers: Player[], 
    oldPlayers: Player[], 
    isMancheEnd: boolean
): Player[] => {
    return nextRoundDistributedPlayers.map((p, i) => {
        const originalPlayer = oldPlayers[i] as Player | undefined;
        return {
            ...p,
            id: originalPlayer?.id || p.id,
            // (C3) Reset uniquement si c'est une fin de manche
            currentMancheStars: isMancheEnd ? 0 : (originalPlayer?.currentMancheStars ?? 0),
            isCochon: isMancheEnd ? false : (originalPlayer?.isCochon ?? false),
            // Conservation des stats permanentes
            mancheWins: originalPlayer?.mancheWins ?? 0,
            totalPoints: originalPlayer?.totalPoints ?? 0,
            totalCochons: originalPlayer?.totalCochons ?? 0,
            totalRoundWins: originalPlayer?.totalRoundWins ?? 0,
            status: originalPlayer?.status ?? 'HUMAN',
            avatarId: originalPlayer?.avatarId ?? undefined,
            wins: originalPlayer?.wins ?? 0,
            difficulty: originalPlayer?.difficulty,
        } as Player;
    });
};

