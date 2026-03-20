import { Domino, DominoSide, GameState } from './types';
import { getBotMove as getEngineBotMove, ValidMove } from './DominoEngine';
import { getForcedOpeningDominoId } from './LogicEngine';
import { LogService } from './services/LogService';

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
    difficulty: 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN' = 'MAPIPI'
): BotDecision | null => {
    // SECURITY: Ensure we are passing actual values or null, not an object
    if (typeof leftValue === 'object' && leftValue !== null) {
        LogService.error('BotEngine', 'leftValue is an object! Check call site.');
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

/**
 * Calcule purement la décision d'un joueur (bot ou déconnecté).
 * Prend en charge l'obligation de rejouer le plus gros double au 1er tour.
 */
export const computeBotDecision = (gameState: GameState, playerId: string): BotDecision | null => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return null;

    const forcedOpeningId = getForcedOpeningDominoId(gameState, playerId);
    if (forcedOpeningId) {
        const forcedTile = player.hand.find(t => t.id === forcedOpeningId);
        if (forcedTile) {
            return { tile: forcedTile, side: 'start' };
        }
    }

    return getBotMove(
        player.hand,
        gameState.table.leftValue,
        gameState.table.rightValue,
        (player.difficulty as any) || 'MAPIPI'
    );
};
