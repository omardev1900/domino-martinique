import { Domino, DominoSide } from './types';

/**
 * --- LOGIQUE DOMINO (MOTEUR ISSU DE LA VERSION WEB) ---
 */

export interface ValidMove {
    tile: Domino;
    side: 'left' | 'right' | 'start';
    isReversed: boolean;
}

/**
 * Calcule tous les coups possibles pour une main donnée
 */
export const getValidMoves = (hand: Domino[], ends: { left: DominoSide | null; right: DominoSide | null } | null): ValidMove[] => {
    // SÉCURITÉ : Si ends est null OU si on ne voit pas d'extrémités valides (bug serveur), on autorise tout.
    // Cela permet de débloquer le premier coup quoi qu'il arrive.
    if (!ends || (ends.left === null && ends.right === null)) {
        return hand.map(d => ({ tile: d, side: 'start' as const, isReversed: false }));
    }

    const moves: ValidMove[] = [];
    hand.forEach(d => {
        // On vérifie les correspondances standards
        // À gauche : 
        // Si d.left == ends.left, on doit inverser le domino (isReversed = true) pour que d.right devienne la nouvelle extrémité
        if (d.left === ends.left) moves.push({ tile: d, side: 'left', isReversed: true });
        // Si d.right === ends.left, pas d'inversion, d.left devient l'extrémité
        else if (d.right === ends.left) moves.push({ tile: d, side: 'left', isReversed: false });

        // À droite :
        // Si d.left === ends.right, pas d'inversion, d.right devient l'extrémité
        if (d.left === ends.right) moves.push({ tile: d, side: 'right', isReversed: false });
        // Si d.right === ends.right, on doit inverser le domino (isReversed = true) pour que d.left devienne la nouvelle extrémité
        else if (d.right === ends.right) moves.push({ tile: d, side: 'right', isReversed: true });
    });
    return moves;
};


/**
 * Calcule la somme des points d'une main
 */
export const calculateHandPoints = (hand: Domino[]): number => {
    return hand.reduce((sum, tile) => sum + tile.left + tile.right, 0);
};

// --- IA SPECIALE : VALOU LE REDOUTABLE (CONFIRMÉ : NIVEAU MAX) ---
export const getValouMove = (hand: Domino[], ends: { left: DominoSide | null; right: DominoSide | null } | null): ValidMove | null => {
    const validMoves = getValidMoves(hand, ends);
    if (validMoves.length === 0) return null;

    // Si c'est le début de la manche (ends est null ou les deux côtés sont null)
    if (!ends || (ends.left === null && ends.right === null)) {
        const sorted = [...validMoves].sort((a, b) => {
            const ta = a.tile;
            const tb = b.tile;

            // Priorité absolue aux doubles pour démarrer
            if (ta.isDouble && !tb.isDouble) return -1;
            if (!ta.isDouble && tb.isDouble) return 1;

            // Sinon on joue le plus lourd
            return (tb.left + tb.right) - (ta.left + ta.right);
        });
        return sorted[0];
    }

    // Analyse de la main pour connaître ses forces (fréquence des valeurs)
    const counts: Record<number, number> = {};
    hand.forEach(t => {
        counts[t.left] = (counts[t.left] || 0) + 1;
        counts[t.right] = (counts[t.right] || 0) + 1;
    });

    const scoredMoves = validMoves.map(move => {
        let score = 0;
        const t = move.tile;
        const tilePoints = t.left + t.right;

        // PRINCIPE 1 : "Tuer les Cochons" (Les gros doubles doivent sortir vite)
        if (t.isDouble) {
            score += tilePoints * 3.0;
        } else {
            score += tilePoints * 0.5;
        }

        // PRINCIPE 2 : "Garder la Main" (Poser une valeur qu'on domine)
        const nextOpenValue = move.side === 'left'
            ? (t.left === ends.left ? t.right : t.left)
            : (t.left === ends.right ? t.right : t.left);

        const myCountOfOpenValue = (counts[nextOpenValue] || 0) - 1;
        score += myCountOfOpenValue * 25;

        // PRINCIPE 3 : FINISSEUR
        if (hand.length === 1) score += 10000;

        return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
};

// --- LOGIQUE MAN'X (STRATEGIE AVANCEE) ---
export const getManXMove = (hand: Domino[], ends: { left: DominoSide | null; right: DominoSide | null } | null): ValidMove | null => {
    const counts: Record<number, number> = {};
    hand.forEach(t => {
        counts[t.left] = (counts[t.left] || 0) + 1;
        counts[t.right] = (counts[t.right] || 0) + 1;
    });

    let key = -1;
    let maxCount = -1;
    Object.entries(counts).forEach(([k, v]) => {
        const val = parseInt(k);
        if (v > maxCount) {
            maxCount = v;
            key = val;
        }
    });

    const isStrongKey = maxCount >= 4;
    const validMoves = getValidMoves(hand, ends);
    if (validMoves.length === 0) return null;

    const scoredMoves = validMoves.map(move => {
        let score = 0;
        const t = move.tile;

        if (t.left === key || t.right === key) {
            score += 25;
        }

        if (t.isDouble) {
            if (t.left === key && isStrongKey && maxCount >= 5) {
                // Règle : Ne jamais commencer par un double si tu as une clé de 5 (tu te coupes)
                score -= 100;
            } else {
                score += 35;
            }
        }
        score += Math.random() * 5;
        return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
};

/**
 * Point d'entrée pour la logique des bots
 */
export const getBotMove = (
    hand: Domino[],
    ends: { left: DominoSide | null; right: DominoSide | null } | null,
    difficulty: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend'
): ValidMove | null => {
    const validMoves = getValidMoves(hand, ends);
    if (validMoves.length === 0) return null;

    if (difficulty === 'easy') return validMoves[Math.floor(Math.random() * validMoves.length)];

    if (difficulty === 'medium') {
        return [...validMoves].sort((a, b) => (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right))[0];
    }

    if (difficulty === 'expert') {
        const scoredMoves = validMoves.map(move => {
            let score = 0;
            const tile = move.tile;
            const points = tile.left + tile.right;

            score += points * 0.5;
            if (tile.isDouble) score += 25;

            if (ends && (ends.left !== null || ends.right !== null)) {
                const newValue = move.side === 'left' ? (tile.left === ends.left ? tile.right : tile.left) : (tile.left === ends.right ? tile.right : tile.left);
                const remainingHand = hand.filter(t => t.id !== tile.id);
                const matchingRemaining = remainingHand.filter(t => t.left === newValue || t.right === newValue).length;
                if (matchingRemaining > 0) score += 15 * matchingRemaining;
                else score -= 10;
            } else {
                const remainingHand = hand.filter(t => t.id !== tile.id);
                const matchesV1 = remainingHand.filter(t => t.left === tile.left || t.right === tile.left).length;
                const matchesV2 = remainingHand.filter(t => t.left === tile.right || t.right === tile.right).length;
                score += 5 * (matchesV1 + matchesV2);
            }
            score += Math.random() * 2;
            return { move, score };
        });
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
    }

    if (difficulty === 'valou_legend') {
        return getValouMove(hand, ends);
    }

    if (difficulty === 'legend') {
        return getManXMove(hand, ends);
    }

    return validMoves[0];
};
