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

    const decision = getEngineBotMove(hand, { left: leftValue, right: rightValue }, difficulty);

    if (!decision) return null;

    return {
        tile: decision.tile,
        side: decision.side
    };
};
