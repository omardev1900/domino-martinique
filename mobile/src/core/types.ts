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
    avatarId?: string; // NEW: To sync avatar
    hand: Domino[]; // En local pour le joueur, masqué pour les autres via API
    handSize: number; // Public pour les autres joueurs
    wins: number; // Nombre de parties gagnées dans la manche (max 3)
    totalPoints: number; // NEW: Cumulative points across all matches
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
    lastActionTimestamp: number; // Pour le timer
}


export enum GameDirection {
    ANTI_CLOCKWISE = -1,
    CLOCKWISE = 1
}

export enum RoomStatus {
    WAITING = 'WAITING',
    PLAYING = 'PLAYING',
    FINISHED = 'FINISHED'
}

export interface PlayerProfile {
    uid: string;
    displayName: string;
    email?: string; // NEW
    avatarUrl?: string; // Legacy?
    avatarId?: string; // NEW
    isHost?: boolean; // NEW: Identify host in player list
    gamesPlayed: number;
    gamesWon: number;
}

export interface GameRoom {
    roomId: string;
    createdAt: number;
    lastActivity: number; // Timestamp of last activity for cleanup
    status: RoomStatus;
    players: PlayerProfile[]; // Liste des joueurs connectés (max 3)
    gameState: GameState | null; // État complet de la partie une fois lancée
    createdBy: string; // UID du créateur
    isPrivate: boolean;
    passcode?: string; // Si privé
    roomName?: string; // Nom personnalisé ou généré
}
