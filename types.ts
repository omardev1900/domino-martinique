
export type DominoSide = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Domino {
  id: string;
  left: DominoSide;
  right: DominoSide;
  isDouble: boolean;
  sum: number;
}

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  hand: Domino[]; // En local pour le joueur, masqué pour les autres via API
  handSize: number; // Public pour les autres joueurs
  wins: number; // Nombre de parties gagnées dans la manche (max 3)
  isCochon: boolean;
  isBot: boolean;
}

export type GamePhase = 'LOBBY' | 'DEALING' | 'PLAYING' | 'BOUDE' | 'ROUND_END' | 'MATCH_END';

export interface GameState {
  gameId: string;
  players: Player[];
  talonMort: Domino[]; // 7 dominos écartés (jamais en main)
  table: {
    sequence: { domino: Domino; sideAtTable: 'left' | 'right'; isReversed: boolean }[];
    leftValue: DominoSide | null;
    rightValue: DominoSide | null;
  };
  currentPlayerId: PlayerId;
  phase: GamePhase;
  firstPlayerOfRound: PlayerId | null;
  history: {
    playerId: PlayerId;
    action: 'PLAY' | 'PASS';
    domino?: Domino;
    timestamp: number;
  }[];
  winningCondition: number; // Par défaut 3
}

export enum GameDirection {
  ANTI_CLOCKWISE = -1,
  CLOCKWISE = 1
}
