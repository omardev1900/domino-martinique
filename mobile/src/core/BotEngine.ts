import { Domino, DominoSide } from './types';
import { getBotMove as getEngineBotMove, ValidMove } from './DominoEngine';

/**
 * Interface pour le retour du Bot
 */
export interface BotDecision {
    tile: Domino;
    side: 'left' | 'right' | 'start';
}

/**
 * Point d'entrée pour obtenir le coup d'un bot.
 * Utilise le nouveau DominoEngine pour calculer la meilleure stratégie.
 */
export const getBotMove = (
    hand: Domino[],
    leftValue: DominoSide | null,
    rightValue: DominoSide | null,
    difficulty: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend' = 'medium'
): BotDecision | null => {
    // SECURITY: Ensure we are passing actual values or null, not an object
    if (typeof leftValue === 'object' && leftValue !== null) {
        console.error("[BotEngine] ERROR: leftValue is an object! Check call site.");
        return null;
    }

    // Safety for opening turns: if the table is empty and the bot has doubles,
    // start with the highest double to stay compatible with strict opening rules.
    if (leftValue === null && rightValue === null) {
        const highestDouble = hand
            .filter(tile => tile.isDouble || tile.left === tile.right)
            .sort((a, b) => (b.left + b.right) - (a.left + a.right))[0];

        if (highestDouble) {
            return {
                tile: highestDouble,
                side: 'start'
            };
        }
    }

    const decision = getEngineBotMove(hand, { left: leftValue, right: rightValue }, difficulty);

    if (!decision) return null;

    // Map the internal decision to the expected return type
    return {
        tile: decision.tile,
        side: decision.side as 'left' | 'right' | 'start'
    };
};
