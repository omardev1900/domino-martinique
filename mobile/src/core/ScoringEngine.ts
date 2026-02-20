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
    newState.players = newState.players.map(p => {
        if (p.id === winnerId) {
            return {
                ...p,
                currentMancheStars: p.currentMancheStars + 1, // Étoile (+1 currentMancheStars)
                totalRoundWins: (p.totalRoundWins || 0) + 1, // Point de Round permanent
                totalPoints: (p.totalPoints || 0) + 1 // Le Camion (totalMatchPoints) avance aussi de 1 par victoire de round (selon lexique "Point de Round = +1 score général")
            };
        }
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
        return newState;
    }

    // --- ETAPE 3 : DÉTECTION VICTOIRE MANCHE (PRIORITÉ 2) ---
    // Si un joueur atteint 3 Étoiles.
    // Note : Comme la Chirée est checkée AVANT, on est sûr qu'il y a des zéros si on arrive ici avec 3 étoiles.
    const mancheWinner = newState.players.find(p => p.currentMancheStars >= MANCHE_WIN_THRESHOLD);

    if (mancheWinner) {
        console.log(`MANCHE WINNER: ${mancheWinner.id}`);
        // C'est une fin de manche.

        // 3.1 Incrémenter Victoire de Manche
        newState.players = newState.players.map(p => {
            if (p.id === mancheWinner.id) {
                return { ...p, mancheWins: p.mancheWins + 1 };
            }
            return p;
        });

        // 3.2 Calcul Bonus/Malus Cochon
        const losersAtZero = newState.players.filter(p => p.currentMancheStars === 0);
        const cochonCount = losersAtZero.length;

        if (cochonCount > 0) {
            console.log(`COCHON DETECTED! Count: ${cochonCount}`);
            newState.mancheResult = 'COCHON';

            newState.players = newState.players.map(p => {
                if (p.id === mancheWinner.id) {
                    // Winner : +1 Trophée/Cochon, +1 Point Camion/Cochon
                    return {
                        ...p,
                        totalCochons: p.totalCochons + cochonCount,
                        totalPoints: p.totalPoints + cochonCount
                    };
                } else if (p.currentMancheStars === 0) {
                    // Loser (Cochon) : -1 Point Camion
                    // Attention : totalPoints peut être négatif ? "Subit -1" -> Oui.
                    return {
                        ...p,
                        isCochon: true, // Marqueur pour l'UI de fin
                        totalPoints: p.totalPoints - 1
                    };
                }
                return p;
            });
        } else {
            console.log("Manche finished normally.");
            newState.mancheResult = 'NORMAL';
        }

    } else {
        // Pas de Chirée, pas de Victoire Manche -> Juste fin de round
        newState.phase = 'PARTIE_END';
        newState.mancheResult = null;
        newState.firstPlayerOfRound = winnerId;
    }

    // 3.3 Check Match End (GLOBAL CHECK - Must run even if no manche winner yet)
    // Au DOMINO Martiniquais, on peut gagner le MATCH sur un simple score (mode SCORE)
    // ou sur Cochon, sans forcément gagner la manche actuelle.
    let isMatchOver = false;
    if (newState.gameMode === 'MANCHE') {
        isMatchOver = newState.players.some(p => p.mancheWins >= newState.winningCondition);
    } else if (newState.gameMode === 'SCORE') {
        isMatchOver = newState.players.some(p => p.totalPoints >= newState.winningCondition);
    } else if (newState.gameMode === 'COCHON') {
        isMatchOver = newState.players.some(p => p.totalCochons >= newState.winningCondition);
    }

    if (isMatchOver) {
        newState.phase = 'MATCH_END';
    } else if (mancheWinner) {
        // Si pas de Match End mais Manche Winner -> Fin de manche
        newState.phase = 'MANCHE_END';
        newState.firstPlayerOfRound = mancheWinner.id;
    }
    // Sinon, on garde le phase défini plus haut (PARTIE_END ou CHIRE qui est aussi PARTIE_END de fait)

    return newState;
};
