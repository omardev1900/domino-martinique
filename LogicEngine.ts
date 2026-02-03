
import { Domino, DominoSide, Player, PlayerId, GameState, GamePhase } from './types';
import { ALL_DOMINOS, HAND_SIZE, TALON_MORT_SIZE, WINS_TO_WIN_MATCH } from './constants';

/**
 * Mélange des dominos avec l'algorithme de Fisher-Yates
 */
export const shuffleDeck = (): Domino[] => {
  const deck: Domino[] = ALL_DOMINOS.map((d, index) => ({
    id: `d-${index}`,
    left: d.left,
    right: d.right,
    isDouble: d.left === d.right,
    sum: d.left + d.right,
  }));

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

/**
 * Distribution initiale : 3 joueurs x 7 dominos + 7 talon mort
 */
export const dealGame = (playerNames: string[]): Partial<GameState> => {
  const deck = shuffleDeck();
  const players: Player[] = playerNames.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    hand: deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE),
    handSize: HAND_SIZE,
    wins: 0,
    isCochon: false,
    isBot: false,
  }));

  const talonMort = deck.slice(MAX_PLAYERS_COUNT * HAND_SIZE);

  return {
    players,
    talonMort,
    phase: 'PLAYING',
    table: {
      sequence: [],
      leftValue: null,
      rightValue: null,
    },
  };
};

const MAX_PLAYERS_COUNT = 3;

/**
 * checkValidMove : Vérifie si un domino peut être posé
 */
export const checkValidMove = (
  domino: Domino,
  leftValue: DominoSide | null,
  rightValue: DominoSide | null
): { canPlay: boolean; side?: 'left' | 'right'; isReversed?: boolean } => {
  // Premier coup de la partie
  if (leftValue === null || rightValue === null) {
    return { canPlay: true, side: 'left', isReversed: false };
  }

  // Vérification à gauche
  if (domino.left === leftValue) return { canPlay: true, side: 'left', isReversed: true };
  if (domino.right === leftValue) return { canPlay: true, side: 'left', isReversed: false };

  // Vérification à droite
  if (domino.left === rightValue) return { canPlay: true, side: 'right', isReversed: false };
  if (domino.right === rightValue) return { canPlay: true, side: 'right', isReversed: true };

  return { canPlay: false };
};

/**
 * calculateHandPoints : Somme des points d'une main
 */
export const calculateHandPoints = (hand: Domino[]): number => {
  return hand.reduce((sum, d) => sum + d.left + d.right, 0);
};

/**
 * determineWinnerOnBoudé : Logique en cas de blocage
 * Le gagnant est celui avec le moins de points. 
 * Si égalité parfaite entre les scores les plus bas, la partie est nulle.
 */
export const determineWinnerOnBoudé = (players: Player[]): PlayerId | 'TIE' => {
  const scores = players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand) }));
  const minScore = Math.min(...scores.map(s => s.score));
  const winners = scores.filter(s => s.score === minScore);

  if (winners.length > 1) return 'TIE';
  return winners[0].id;
};

/**
 * determineFirstPlayer : Trouve qui doit commencer la manche
 * Règle : Plus gros double, ou plus grosse somme si aucun double.
 */
export const determineFirstPlayer = (players: Player[]): PlayerId => {
  let bestPlayerId = players[0].id;
  let maxDouble = -1;
  let maxSum = -1;

  players.forEach(p => {
    p.hand.forEach(d => {
      if (d.isDouble) {
        if (d.left > maxDouble) {
          maxDouble = d.left;
          bestPlayerId = p.id;
        }
      } else if (maxDouble === -1) {
        if (d.sum > maxSum) {
          maxSum = d.sum;
          bestPlayerId = p.id;
        }
      }
    });
  });

  return bestPlayerId;
};

/**
 * handleEndOfRound : Met à jour les scores et vérifie la fin du match
 */
export const handleEndOfRound = (
  gameState: GameState,
  winnerId: PlayerId | 'TIE'
): GameState => {
  const newState = { ...gameState };

  if (winnerId === 'TIE') {
    newState.phase = 'BOUDE';
    // Dans la règle Martiniquaise, une égalité en boudé annule souvent la partie
    return newState;
  }

  // Incrémenter la victoire
  const winnerIndex = newState.players.findIndex(p => p.id === winnerId);
  newState.players[winnerIndex].wins += 1;

  // Vérifier si quelqu'un a atteint 3 victoires
  const matchWinner = newState.players.find(p => p.wins >= WINS_TO_WIN_MATCH);

  if (matchWinner) {
    newState.phase = 'MATCH_END';
    // Marquer les "Cochons"
    newState.players = newState.players.map(p => ({
      ...p,
      isCochon: p.wins === 0
    }));
  } else {
    newState.phase = 'ROUND_END';
    newState.firstPlayerOfRound = winnerId; // Le gagnant commence la suivante
  }

  return newState;
};
