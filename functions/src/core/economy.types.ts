/**
 * economy.types.ts
 *
 * Tous les types du système d'économie et de progression.
 * Ce fichier est la source de vérité des structures de données économiques.
 * Il ne contient AUCUNE logique métier — uniquement des interfaces et types.
 */

// ─── Monnaies & Progression ───────────────────────────────────────────────────

/** État économique complet d'un joueur */
export interface PlayerEconomy {
    coins: number;         // 🪙 Monnaie de flux
    xp: number;            // ⭐ Expérience cumulée totale
    level: number;         // Niveau courant dérivé de l'XP
    diamonds: number;      // 💎 Monnaie premium
    leaguePoints: number;  // 🐷 Total cochons infligés (source de la ligue)
    leagueGrade: LeagueGrade;
    lastDailyRewardTimestamp?: number; // 📅 Dernier cadeau reçu (pour check quotidien)
}

export type LeagueGrade = 'APPRENTI' | 'MAITRE' | 'ROI' | 'LEGENDE';

// ─── Tables ───────────────────────────────────────────────────────────────────

export type TableTier = 'DEBUTANT' | 'EXPERT' | 'LEGENDE';

export interface TableConfig {
    tier: TableTier;
    buyIn: number;
    label: string;
    icon: string;
}

// ─── Calcul des Récompenses ───────────────────────────────────────────────────

/**
 * Entrée pour le calcul des récompenses.
 * Le RewardEngine consomme ce contexte et produit un MatchReward.
 */
export interface RewardCalculationInput {
    /** L'état du jeu finalisé (phase === 'MATCH_END') */
    playerFinalStats: PlayerMatchSnapshot;
    /** Classement final (du meilleur au pire) */
    finalRanking: PlayerMatchSnapshot[];
    /** Résumé des manches (source de vérité pour cochons/manches) */
    mancheHistory: MancheRewardEvent[];
    /** Niveau actuel du joueur (pour le multiplicateur de coins) */
    currentLevel: number;
    /** Points de ligue actuels du joueur (pour calcul du nouveau grade) */
    currentLeaguePoints: number;
    /** XP total actuel du joueur (pour calcul du nouveau niveau) */
    currentXP: number;
    /** Mode de jeu */
    gameMode: string;
    /** Configuration de la table (buy-in) */
    tableTier: TableTier;
    /** Nombre de joueurs dans la partie */
    playerCount: number;
}

/** Snapshot des stats finales d'un joueur pour le calcul des rewards */
export interface PlayerMatchSnapshot {
    playerId: string;
    totalPoints: number;
    totalCochons: number;
    mancheWins: number;
    totalRoundWins: number;
    rank: number; // 1 = vainqueur
}

/** Événement de manche extrait de mancheHistory pour le calcul des rewards */
export interface MancheRewardEvent {
    mancheNumber: number;
    resultType: 'NORMAL' | 'CHIRE' | 'COCHON';
    cochonCount: number;
    isWinner: boolean;
    isCochonne: boolean; // Le joueur était à 0 étoiles (cochonné)
    pointsEarned: number; // Points obtenus par le joueur dans cette manche
}

// ─── Résultat du Calcul ───────────────────────────────────────────────────────

/**
 * Résultat complet du calcul des récompenses pour un match.
 * Ce type est la "sortie" du RewardEngine et l'entrée de l'EconomyService et du RewardOverlay.
 */
export interface MatchReward {
    // ─ Totaux
    coinsEarned: number;
    xpEarned: number;
    diamondsEarned: number;
    leaguePointsEarned: number;
    isWinner: boolean;

    // ─ Progression
    previousLevel: number;
    newLevel: number;
    leveledUp: boolean;
    previousXP: number;
    newXP: number;
    xpToNextLevel: number;

    // ─ Ligue
    previousGrade: LeagueGrade;
    newGrade: LeagueGrade;
    gradeUp: boolean;
    previousLeaguePoints: number;
    newLeaguePoints: number;
    nextGradeThreshold: number | null; // null si grade max

    // ─ Détail animable ligne par ligne (pour le rolling counter)
    breakdown: RewardBreakdown[];
}

/** Ligne de détail d'une récompense — utilisée par le RewardOverlay pour l'animation */
export interface RewardBreakdown {
    id: string;           // Clé unique pour l'animation
    label: string;        // "Victoire de Manche", "Bonus Cochon x2", etc.
    coins: number;
    xp: number;
    diamonds: number;
    leaguePoints: number;
}

// ─── Coffres de Niveau ────────────────────────────────────────────────────────

/** Coffre obtenu lors d'un passage de niveau */
export interface LevelUpChest {
    level: number;
    coinsReward: number;
    diamondReward: number; // 0 si pas de diamond à ce niveau
}
