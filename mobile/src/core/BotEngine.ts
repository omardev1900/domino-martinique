import { Domino, DominoSide, Player, PlayerId } from './types';
import { checkValidMove } from './LogicEngine';

/**
 * Level 1 Bot: Randomly picks a valid move.
 * Returns the domino to play, or null if no valid move is possible.
 */
export const getBotMove = (
    hand: Domino[],
    leftValue: DominoSide | null,
    rightValue: DominoSide | null
): Domino | null => {
    const validMoves = hand.filter(
        (d) => checkValidMove(d, leftValue, rightValue).canPlay
    );

    if (validMoves.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
};
