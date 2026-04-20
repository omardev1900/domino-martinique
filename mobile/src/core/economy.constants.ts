/**
 * economy.constants.ts
 *
 * Toutes les constantes numériques du système d'économie.
 * RÈGLE : Modifier ce fichier suffit pour rééquilibrer tout le système.
 * Aucune constante économique ne doit être hardcodée ailleurs.
 */

import { TableConfig, LeagueGrade, LevelUpChest } from './economy.types';

// ─── Matrice des Gains ────────────────────────────────────────────────────────

/** Gains par événement de jeu (avant multiplicateur de niveau) */
export const BASE_REWARDS = {
    ROUND_WIN: {
        coins: 5,
        xp: 10,
        diamonds: 0,
        leaguePoints: 0,
    },
    MANCHE_WIN: {
        coins: 50,
        xp: 100,
        diamonds: 0,
        leaguePoints: 0,
    },
    /** Cochon infligé à 1 adversaire (3-étoiles vs 0 étoile) */
    COCHON_BONUS: {
        coins: 100,
        xp: 150,
        diamonds: 0,
        leaguePoints: 1,
    },
    /** Double Cochon : 2 adversaires à 0 étoile = 3-0-0 */
    DOUBLE_COCHON: {
        coins: 250,
        xp: 300,
        diamonds: 1,
        leaguePoints: 2,
    },
    /** Vainqueur du Match (Podium 1er) */
    MATCH_WIN: {
        coins: 0,     // Déterminé par le Pot
        xp: 500,
        diamonds: 2,
        leaguePoints: 0,
    },
    /** Participer au match (non vainqueur) */
    MATCH_FINISH: {
        coins: 0,
        xp: 100,
        diamonds: 0,
        leaguePoints: 0,
    },
    /** Le joueur a été cochonné (0 étoile) */
    MATCH_COCHONNE: {
        coins: 0,
        xp: 10,
        diamonds: 0,
        leaguePoints: 0,
    },
} as const;

// ─── Tables de jeu ───────────────────────────────────────────────────────────

export const TABLE_CONFIGS: Record<string, TableConfig> = {
    DEBUTANT: { tier: 'DEBUTANT', buyIn: 100, label: 'Table Débutant', icon: '🌱' },
    EXPERT: { tier: 'EXPERT', buyIn: 1000, label: 'Table Expert', icon: '⚔️' },
    LEGENDE: { tier: 'LEGENDE', buyIn: 10000, label: 'Table Légende', icon: '👑' },
};

/** Taxe de table prélevée sur le pot total */
export const RAKE_PERCENT = 0.10; // 10%

/** Distribution du pot (après rake) */
export const POT_DISTRIBUTION = {
    FIRST: 0.80, // 80% au 1er
    SECOND: 0.20, // 20% au 2ème (remboursement partiel)
    THIRD: 0.00, // 3ème perd sa mise
};

/** Gain fixe en Solo (pas de pot car pas de buy-in PvP) */
export const SOLO_WIN_FLAT_REWARD = 500; // 🪙

// ─── Cadeau de bienvenue ─────────────────────────────────────────────────────

export const NEW_PLAYER_COINS = 1000; // 🪙 donné à la création du compte

/** Coins offerts chaque jour à la connexion */
export const DAILY_REWARD_COINS = 300; // 🎁

// ─── XP et Niveaux ───────────────────────────────────────────────────────────

/** XP requis pour passer du niveau 1 au niveau 2 */
export const XP_PER_LEVEL_BASE = 500;

/** Facteur de croissance exponentielle de l'XP par niveau */
export const XP_GROWTH_RATE = 1.15;

/**
 * Bonus de Coins en % par niveau franchi.
 * Niveau 10 = +50% de coins sur tous les gains.
 */
export const COIN_MULTIPLIER_PER_LEVEL = 0.05; // +5% par niveau

/** Niveau maximum jouable */
export const MAX_LEVEL = 100;

/**
 * Coffres de niveau — doublons de paliers (niveau 5, 10, 15, …)
 * Les autres niveaux donnent uniquement des coins.
 */
export const LEVEL_UP_CHESTS: LevelUpChest[] = [
    { level: 1, coinsReward: 200, diamondReward: 0 },
    { level: 5, coinsReward: 500, diamondReward: 1 },
    { level: 10, coinsReward: 1000, diamondReward: 2 },
    { level: 20, coinsReward: 2500, diamondReward: 3 },
    { level: 50, coinsReward: 10000, diamondReward: 5 },
    { level: 100, coinsReward: 50000, diamondReward: 10 },
];

/** Bonus de coins au passage de chaque niveau (si pas dans LEVEL_UP_CHESTS) */
export const DEFAULT_LEVEL_UP_COINS = 100;

// ─── Ligue des Cochons ───────────────────────────────────────────────────

/**
 * Seuils de cochons DONNÉS pour débloquer chaque grade.
 * Correspond aux paliers officiels « Niveau Boucher ».
 */
export const LEAGUE_THRESHOLDS: Record<LeagueGrade, number> = {
    APPRENTI: 0,   // Grade de départ
    MAITRE: 30,    // 🥈 Apprenti Boucher (Seuil de déblocage)
    ROI: 150,      // 🥇 Maître Saucissier (Seuil de déblocage)
    LEGENDE: 250,  // 👑 Roi du Boudin (Seuil de déblocage)
                   // Note: 500 = Légende du Groin (Grade max)
};

// Note: les seuils de DÉBLOCAGE des cadres sont les 4 paliers du brief :
// 30, 150, 250, 500 — ils définissent les récompenses, pas les grades ci-dessus
// Les grades (4 niveaux) sont recalculés depuis cochonsGiven.

/** Seuils de cochons pour le déblocage des cadres (distinct des grades) */
export const LEAGUE_FRAME_THRESHOLDS: Record<string, number> = {
    APPRENTI: 30,   // 30 cochons → Cadre Argent
    MAITRE:   150,  // 150 cochons → Cadre Or
    ROI:      250,  // 250 cochons → Cadre Diamant Néon
    LEGENDE:  500,  // 500 cochons → Cadre Ultimate Fire
};

/** Récompenses associées à chaque palier de la Ligue des Cochons */
export const LEAGUE_FRAME_REWARDS: Record<LeagueGrade, { frameId: string; coinsBonus: number }> = {
    APPRENTI: { frameId: 'frame_argent',  coinsBonus: 500 },
    MAITRE:   { frameId: 'frame_or',      coinsBonus: 2000 },
    ROI:      { frameId: 'frame_diamant', coinsBonus: 5000 },
    LEGENDE:  { frameId: 'frame_feu',     coinsBonus: 10000 },
};

/** Ordre des grades du plus faible au plus fort */
export const LEAGUE_GRADE_ORDER: LeagueGrade[] = ['APPRENTI', 'MAITRE', 'ROI', 'LEGENDE'];

/** Labels affichés dans l'UI */
export const LEAGUE_LABELS: Record<LeagueGrade, string> = {
    APPRENTI: 'Apprenti Boucher',
    MAITRE: 'Maître Saucissier',
    ROI: 'Roi du Boudin',
    LEGENDE: 'Légende du Groin',
};

/** Emojis des grades */
export const LEAGUE_ICONS: Record<LeagueGrade, string> = {
    APPRENTI: '🥈',
    MAITRE: '🥇',
    ROI: '👑',
    LEGENDE: '🔥',
};
