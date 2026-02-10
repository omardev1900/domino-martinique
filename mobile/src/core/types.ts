export type DominoSide = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Domino {
    id: string;
    left: DominoSide;
    right: DominoSide;
    isDouble: boolean;
    sum: number;
}

export type PlayerId = string;

export type GameMode = 'MANCHE' | 'SCORE' | 'COCHON';
export type MancheResult = 'NORMAL' | 'CHIRE' | 'COCHON';

export interface Player {
    id: PlayerId;
    name: string;
    avatarId?: string;
    hand: Domino[];
    handSize: number;
    wins: number; // Nombre de parties (victoires) dans la manche en cours
    mancheWins: number; // Nombre de manches gagnées (pour le Mode Manche)
    totalPoints: number; // Score cumulé (pour le Mode Score)
    isCochon: boolean;
    totalCochons: number; // NEW: Total cochons infligés à ce joueur pendant le match
    isBot: boolean;
}

export type GamePhase = 'LOBBY' | 'DEALING' | 'PLAYING' | 'BOUDE' | 'ROUND_END' | 'MATCH_END' | 'MANCHE_END';

export interface GameState {
    gameId: string;
    players: Player[];
    talonMort: Domino[];
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
    winningCondition: number; // Seuil pour terminer (3 victoires, 100 pts, etc.)
    gameMode: GameMode; // NEW: Mode de jeu
    mancheResult?: MancheResult; // NEW: Résultat de la manche (pour affichage Chiré)
    lastActionTimestamp: number;
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
    rematchVotes?: string[]; // IDs des joueurs qui veulent rejouer
    gameMode?: GameMode; // NEW: Mode de jeu choisi par l'hôte
    winningCondition?: number; // Condition de victoire
}
