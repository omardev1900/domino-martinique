"use strict";
/**
 * economy.constants.ts
 *
 * Toutes les constantes numériques du système d'économie.
 * RÈGLE : Modifier ce fichier suffit pour rééquilibrer tout le système.
 * Aucune constante économique ne doit être hardcodée ailleurs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAGUE_ICONS = exports.LEAGUE_LABELS = exports.LEAGUE_GRADE_ORDER = exports.LEAGUE_THRESHOLDS = exports.DEFAULT_LEVEL_UP_COINS = exports.LEVEL_UP_CHESTS = exports.MAX_LEVEL = exports.COIN_MULTIPLIER_PER_LEVEL = exports.XP_GROWTH_RATE = exports.XP_PER_LEVEL_BASE = exports.DAILY_REWARD_COINS = exports.NEW_PLAYER_COINS = exports.SOLO_WIN_FLAT_REWARD = exports.POT_DISTRIBUTION = exports.RAKE_PERCENT = exports.TABLE_CONFIGS = exports.BASE_REWARDS = void 0;
// ─── Matrice des Gains ────────────────────────────────────────────────────────
/** Gains par événement de jeu (avant multiplicateur de niveau) */
exports.BASE_REWARDS = {
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
        coins: 0, // Déterminé par le Pot
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
};
// ─── Tables de jeu ───────────────────────────────────────────────────────────
exports.TABLE_CONFIGS = {
    DEBUTANT: { tier: 'DEBUTANT', buyIn: 100, label: 'Table Débutant', icon: '🌱' },
    EXPERT: { tier: 'EXPERT', buyIn: 1000, label: 'Table Expert', icon: '⚔️' },
    LEGENDE: { tier: 'LEGENDE', buyIn: 10000, label: 'Table Légende', icon: '👑' },
};
/** Taxe de table prélevée sur le pot total */
exports.RAKE_PERCENT = 0.10; // 10%
/** Distribution du pot (après rake) */
exports.POT_DISTRIBUTION = {
    FIRST: 0.80, // 80% au 1er
    SECOND: 0.20, // 20% au 2ème (remboursement partiel)
    THIRD: 0.00, // 3ème perd sa mise
};
/** Gain fixe en Solo (pas de pot car pas de buy-in PvP) */
exports.SOLO_WIN_FLAT_REWARD = 500; // 🪙
// ─── Cadeau de bienvenue ─────────────────────────────────────────────────────
exports.NEW_PLAYER_COINS = 1000; // 🪙 donné à la création du compte
/** Coins offerts chaque jour à la connexion */
exports.DAILY_REWARD_COINS = 300; // 🎁
// ─── XP et Niveaux ───────────────────────────────────────────────────────────
/** XP requis pour passer du niveau 1 au niveau 2 */
exports.XP_PER_LEVEL_BASE = 500;
/** Facteur de croissance exponentielle de l'XP par niveau */
exports.XP_GROWTH_RATE = 1.15;
/**
 * Bonus de Coins en % par niveau franchi.
 * Niveau 10 = +50% de coins sur tous les gains.
 */
exports.COIN_MULTIPLIER_PER_LEVEL = 0.05; // +5% par niveau
/** Niveau maximum jouable */
exports.MAX_LEVEL = 100;
/**
 * Coffres de niveau — doublons de paliers (niveau 5, 10, 15, …)
 * Les autres niveaux donnent uniquement des coins.
 */
exports.LEVEL_UP_CHESTS = [
    { level: 1, coinsReward: 200, diamondReward: 0 },
    { level: 5, coinsReward: 500, diamondReward: 1 },
    { level: 10, coinsReward: 1000, diamondReward: 2 },
    { level: 20, coinsReward: 2500, diamondReward: 3 },
    { level: 50, coinsReward: 10000, diamondReward: 5 },
    { level: 100, coinsReward: 50000, diamondReward: 10 },
];
/** Bonus de coins au passage de chaque niveau (si pas dans LEVEL_UP_CHESTS) */
exports.DEFAULT_LEVEL_UP_COINS = 100;
// ─── Ligue des Cochons ────────────────────────────────────────────────────────
/** Seuils de cochons pour chaque grade */
exports.LEAGUE_THRESHOLDS = {
    APPRENTI: 0,
    MAITRE: 31,
    ROI: 151,
    LEGENDE: 500,
};
/** Ordre des grades du plus faible au plus fort */
exports.LEAGUE_GRADE_ORDER = ['APPRENTI', 'MAITRE', 'ROI', 'LEGENDE'];
/** Labels affichés dans l'UI */
exports.LEAGUE_LABELS = {
    APPRENTI: 'Apprenti Boucher',
    MAITRE: 'Maître Saucissier',
    ROI: 'Roi du Boudin',
    LEGENDE: 'Légende du Groin',
};
/** Emojis des grades */
exports.LEAGUE_ICONS = {
    APPRENTI: '🔰',
    MAITRE: '🥈',
    ROI: '👑',
    LEGENDE: '🔥',
};
//# sourceMappingURL=economy.constants.js.map