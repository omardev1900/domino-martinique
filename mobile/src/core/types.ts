export type DominoSide = 0 | 1 | 2 | 3 | 4 | 5 | 6;
import { PlayerInventory } from './store.types';

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

export interface MancheHistoryRecord {
    mancheNumber: number;
    points: { [playerId: string]: number }; // Points scored in THIS manche
    winnerId: PlayerId | 'TIE';
    resultType: MancheResult;
    cochonCount?: number;
}

export interface Player {
    id: PlayerId;
    name: string;
    avatarId?: string;
    hand: Domino[];
    handSize: number;
    currentMancheStars: number; // ÉTOILES (currentMancheStars) : Victoires dans la manche en cours (0-3)
    wins: number;
    mancheWins: number; // COURONNES (mancheWins) : Manches gagnées dans le match
    totalRoundWins: number; // POINTS DE ROUND (totalRoundWins) : Total des parties gagnées (persistant)
    totalPoints: number; // LE CAMION (totalMatchPoints) : Score cumulé (RoundWins + Bonus/Malus Cochon)
    isCochon: boolean;
    totalCochons: number;
    isBot: boolean;
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend'; // NEW: Niveau spécifique du bot
    isDisconnected?: boolean; // NEW: Track if remote player is offline
}

export type GamePhase = 'LOBBY' | 'DEALING' | 'PLAYING' | 'BOUDE' | 'PARTIE_END' | 'MATCH_END' | 'MANCHE_END';

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
    mancheResult?: MancheResult | null; // NEW: Résultat de la manche (pour affichage Chiré)
    turnDuration: number; // NEW: Durée du tour en secondes
    lastActionTimestamp: number;
    turnId: number; // Incremental counter — bumped on every turn transition, used as invalidation key for timers
    mancheHistory: MancheHistoryRecord[];
    roundNumber: number; // NEW: Numéro du round/partie en cours dans la manche
    mancheNumber: number; // NEW: Numéro de la manche en cours
    startingHandSize: number;
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
    email?: string;
    avatarUrl?: string;
    avatarId?: string;
    isHost?: boolean;
    gamesPlayed: number;
    gamesWon: number;
    // ─── Economy & Progression (optional — defaults applied by EconomyService) ───
    coins?: number;          // 🪙 Monnaie de flux
    xp?: number;             // ⭐ Expérience cumulée
    level?: number;          // Niveau dérivé de l'XP
    diamonds?: number;       // 💎 Monnaie premium
    leaguePoints?: number;   // 🐷 Cochons totaux (alias de totalCochonsInflicted)
    leagueGrade?: string;    // Grade de ligue ('APPRENTI' | 'MAITRE' | 'ROI' | 'LEGENDE')
    inventory?: PlayerInventory; // Cosmétiques possédés et équipés
}

export interface GameRoom {
    roomId: string;
    createdAt: number;
    lastActivity: number; // Timestamp of last activity for cleanup
    status: RoomStatus;
    players: PlayerProfile[]; // Liste des joueurs connectés (max 3)
    gameState: GameState | null; // État complet de la partie une fois lancée
    createdBy: string; // UID du créateur
    //hostId: string;
    isPrivate: boolean;
    passcode?: string; // Si privé
    roomName?: string; // Nom personnalisé ou généré
    rematchVotes?: string[]; // IDs des joueurs qui veulent rejouer
    gameMode?: GameMode; // NEW: Mode de jeu choisi par l'hôte
    winningCondition?: number; // Condition de victoire
    turnDuration?: number; // NEW: Durée du tour
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend' | 'valou_legend'; // NEW: Difficulté des bots
    startingHandSize?: number;
    quickChats?: { [playerId: string]: { content: string; timestamp: number } | null }; // NEW: Decoupled chat
}
