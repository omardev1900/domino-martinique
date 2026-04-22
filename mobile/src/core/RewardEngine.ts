/**
 * RewardEngine.ts
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  REWARD ENGINE — Logique Métier Pure                 ║
 * ║  • Aucun I/O (pas de Firebase, pas d'AsyncStorage)  ║
 * ║  • Aucun composant UI                                ║
 * ║  • Aucun side-effect                                 ║
 * ║  • 100% testable & déterministe                      ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Point d'entrée unique : `RewardEngine.calculate(input)`
 * Retourne un `MatchReward` complet qui peut être:
 *   → Persisté par `EconomyService`
 *   → Affiché par `RewardOverlay`
 */

import {
    RewardCalculationInput,
    MatchReward,
    RewardBreakdown,
    LeagueGrade,
    MancheRewardEvent,
    PlayerMatchSnapshot,
    LevelUpChest,
    TableTier,
    FrameUnlockEvent,
    LeagueFrameId,
} from './economy.types';


import { GameState } from './types';
import { LogService } from './services/LogService';

import {
    BASE_REWARDS,
    TABLE_CONFIGS,
    RAKE_PERCENT,
    POT_DISTRIBUTION,
    SOLO_WIN_FLAT_REWARD,
    XP_PER_LEVEL_BASE,
    XP_GROWTH_RATE,
    COIN_MULTIPLIER_PER_LEVEL,
    MAX_LEVEL,
    LEAGUE_THRESHOLDS,
    LEAGUE_GRADE_ORDER,
    LEAGUE_FRAME_THRESHOLDS,
    LEAGUE_FRAME_REWARDS,
    LEVEL_UP_CHESTS,
    DEFAULT_LEVEL_UP_COINS,
} from './economy.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers Purs (fonctions mathématiques)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule l'XP total requis pour atteindre un niveau donné.
 * Formule exponentielle : xpForLevel(n) = XP_BASE × GROWTH^(n-1)
 * xpRequired(level) = Somme de xpForLevel(1) à xpForLevel(level-1)
 */
export function xpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
        total += Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH_RATE, l - 1));
    }
    return total;
}

/**
 * Détermine le niveau d'un joueur à partir de son XP total.
 */
export function getLevelFromXP(totalXP: number): number {
    let level = 1;
    while (level < MAX_LEVEL) {
        const xpNeeded = xpRequiredForLevel(level + 1);
        if (totalXP < xpNeeded) break;
        level++;
    }
    return level;
}

/**
 * XP restant pour atteindre le prochain niveau depuis un XP total.
 */
export function xpToNextLevel(totalXP: number, currentLevel: number): number {
    if (currentLevel >= MAX_LEVEL) return 0;
    return xpRequiredForLevel(currentLevel + 1) - totalXP;
}

/**
 * Détermine le grade de Ligue des Cochons selon le nombre de cochons.
 * Retourne null si le joueur est en dessous du premier seuil (< 10 cochons).
 */
export function getLeagueGrade(leaguePoints: number): LeagueGrade | null {
    let grade: LeagueGrade | null = null;
    for (const g of LEAGUE_GRADE_ORDER) {
        if (leaguePoints >= LEAGUE_THRESHOLDS[g]) {
            grade = g;
        }
    }
    return grade;
}

/**
 * Seuil du prochain grade de ligue, ou null si grade max.
 * Si grade est null (joueur sans grade), retourne le premier seuil.
 */
export function nextLeagueThreshold(grade: LeagueGrade | null): number | null {
    if (grade === null) return LEAGUE_THRESHOLDS[LEAGUE_GRADE_ORDER[0]];
    const idx = LEAGUE_GRADE_ORDER.indexOf(grade);
    const next = LEAGUE_GRADE_ORDER[idx + 1];
    if (!next) return null;
    return LEAGUE_THRESHOLDS[next];
}

/**
 * Applique le multiplicateur de niveau sur un montant de coins.
 */
export function applyLevelMultiplier(coins: number, level: number): number {
    const multiplier = 1 + (level - 1) * COIN_MULTIPLIER_PER_LEVEL;
    return Math.floor(coins * multiplier);
}

/**
 * Calcule le pot distribué pour une table multi.
 * pot = (buyIn × playerCount) × (1 - rake)
 */
export function calculatePot(buyIn: number, playerCount: number): number {
    return Math.floor(buyIn * playerCount * (1 - RAKE_PERCENT));
}

/**
 * Vérifie si le joueur reçoit un coffre à ce niveau exact.
 */
export function getLevelUpChest(level: number): LevelUpChest | null {
    return LEVEL_UP_CHESTS.find(c => c.level === level) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// RewardEngine — Point d'entrée public
// ─────────────────────────────────────────────────────────────────────────────

export const RewardEngine = {

    /**
     * Calcule l'intégralité des récompenses pour un joueur
     * à la fin d'un match (`MATCH_END`).
     *
     * @param input - Contexte de calcul (stats finales, historique des manches, niveau, etc.)
     * @returns `MatchReward` — objet complet avec totaux, progression XP, ligue et breakdown
     */
    calculate(input: RewardCalculationInput): MatchReward {
        const {
            playerFinalStats,
            finalRanking,
            mancheHistory,
            currentLevel,
            currentLeaguePoints,
            currentXP,
            gameMode,
            tableTier,
            playerCount,
        } = input;

        const breakdown: RewardBreakdown[] = [];
        let totalCoinsRaw = 0;
        let totalXP = 0;
        let totalDiamonds = 0;
        let totalLeaguePoints = 0;

        // ── 1. Gains par événement de manche ─────────────────────────────────
        for (const manche of mancheHistory) {
            if (manche.isWinner) {
                // Victoire de Manche (NORMAL ou COCHON)
                totalCoinsRaw += BASE_REWARDS.MANCHE_WIN.coins;
                totalXP += BASE_REWARDS.MANCHE_WIN.xp;
                breakdown.push({
                    id: `manche_win_${manche.mancheNumber}`,
                    label: `Victoire Manche #${manche.mancheNumber}`,
                    coins: BASE_REWARDS.MANCHE_WIN.coins,
                    xp: BASE_REWARDS.MANCHE_WIN.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });

                if (manche.resultType === 'COCHON' && manche.cochonCount > 0) {
                    if (manche.cochonCount >= 2) {
                        // Double Cochon (3-0-0)
                        totalCoinsRaw += BASE_REWARDS.DOUBLE_COCHON.coins;
                        totalXP += BASE_REWARDS.DOUBLE_COCHON.xp;
                        totalDiamonds += BASE_REWARDS.DOUBLE_COCHON.diamonds;
                        totalLeaguePoints += BASE_REWARDS.DOUBLE_COCHON.leaguePoints;
                        breakdown.push({
                            id: `double_cochon_${manche.mancheNumber}`,
                            label: `🐷🐷 Double Cochon (Manche #${manche.mancheNumber})`,
                            coins: BASE_REWARDS.DOUBLE_COCHON.coins,
                            xp: BASE_REWARDS.DOUBLE_COCHON.xp,
                            diamonds: BASE_REWARDS.DOUBLE_COCHON.diamonds,
                            leaguePoints: BASE_REWARDS.DOUBLE_COCHON.leaguePoints,
                        });
                    } else {
                        // Cochon Simple (3-1-0 ou équivalent)
                        totalCoinsRaw += BASE_REWARDS.COCHON_BONUS.coins;
                        totalXP += BASE_REWARDS.COCHON_BONUS.xp;
                        totalLeaguePoints += BASE_REWARDS.COCHON_BONUS.leaguePoints;
                        breakdown.push({
                            id: `cochon_${manche.mancheNumber}`,
                            label: `🐷 Bonus Cochon (Manche #${manche.mancheNumber})`,
                            coins: BASE_REWARDS.COCHON_BONUS.coins,
                            xp: BASE_REWARDS.COCHON_BONUS.xp,
                            diamonds: 0,
                            leaguePoints: BASE_REWARDS.COCHON_BONUS.leaguePoints,
                        });
                    }
                }
            } else if (manche.isCochonne) {
                // Le joueur a été cochonné — gain minimal
                totalXP += BASE_REWARDS.MATCH_COCHONNE.xp;
                breakdown.push({
                    id: `cochonne_${manche.mancheNumber}`,
                    label: `🥚 Cochonné (Manche #${manche.mancheNumber})`,
                    coins: 0,
                    xp: BASE_REWARDS.MATCH_COCHONNE.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });
            }
        }

        // ── 2. Gains de Rounds ────────────────────────────────────────────────
        const roundWins = playerFinalStats.totalRoundWins;
        if (roundWins > 0) {
            const roundCoins = BASE_REWARDS.ROUND_WIN.coins * roundWins;
            const roundXP = BASE_REWARDS.ROUND_WIN.xp * roundWins;
            totalCoinsRaw += roundCoins;
            totalXP += roundXP;
            breakdown.push({
                id: 'round_wins',
                label: `Victoires de Round (×${roundWins})`,
                coins: roundCoins,
                xp: roundXP,
                diamonds: 0,
                leaguePoints: 0,
            });
        }

        // ── 3. Gains de fin de Match (classement) ────────────────────────────
        const rank = playerFinalStats.rank;
        const isSolo = playerCount <= 1 || gameMode === 'SOLO';

        if (rank === 1) {
            // Vainqueur du match
            totalXP += BASE_REWARDS.MATCH_WIN.xp;
            totalDiamonds += BASE_REWARDS.MATCH_WIN.diamonds;

            let potCoins: number;
            if (isSolo) {
                potCoins = SOLO_WIN_FLAT_REWARD;
            } else {
                const tableConfig = TABLE_CONFIGS[tableTier];
                const pot = calculatePot(tableConfig.buyIn, playerCount);
                potCoins = Math.floor(pot * POT_DISTRIBUTION.FIRST);
            }

            totalCoinsRaw += potCoins;
            breakdown.push({
                id: 'match_win',
                label: `🏆 Victoire du Match`,
                coins: potCoins,
                xp: BASE_REWARDS.MATCH_WIN.xp,
                diamonds: BASE_REWARDS.MATCH_WIN.diamonds,
                leaguePoints: 0,
            });
        } else if (rank === 2 && !isSolo) {
            // 2ème — remboursement partiel du pot
            const tableConfig = TABLE_CONFIGS[tableTier];
            const pot = calculatePot(tableConfig.buyIn, playerCount);
            const secondCoins = Math.floor(pot * POT_DISTRIBUTION.SECOND);
            totalCoinsRaw += secondCoins;
            totalXP += BASE_REWARDS.MATCH_FINISH.xp;

            if (secondCoins > 0) {
                breakdown.push({
                    id: 'match_second',
                    label: `🥈 2ème Place`,
                    coins: secondCoins,
                    xp: BASE_REWARDS.MATCH_FINISH.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });
            }
        } else {
            // Participation (non vainqueur)
            totalXP += BASE_REWARDS.MATCH_FINISH.xp;
            breakdown.push({
                id: 'match_finish',
                label: `Participation`,
                coins: 0,
                xp: BASE_REWARDS.MATCH_FINISH.xp,
                diamonds: 0,
                leaguePoints: 0,
            });
        }

        // ── 4. Appliquer le multiplicateur de niveau ──────────────────────────
        const coinsEarned = applyLevelMultiplier(totalCoinsRaw, currentLevel);

        // Mise à jour du breakdown avec les coins réels (après multiplicateur)
        // On applique la même proportion à chaque ligne
        const multiplierRatio = totalCoinsRaw > 0 ? coinsEarned / totalCoinsRaw : 1;
        const adjustedBreakdown = breakdown.map(b => ({
            ...b,
            coins: Math.floor(b.coins * multiplierRatio),
        }));

        // Si un multiplicateur est actif, ajouter une ligne explicative
        if (currentLevel > 1 && totalCoinsRaw > 0) {
            const bonusCoins = coinsEarned - totalCoinsRaw;
            if (bonusCoins > 0) {
                adjustedBreakdown.push({
                    id: 'level_multiplier',
                    label: `⚡ Bonus Niveau ${currentLevel} (+${((currentLevel - 1) * COIN_MULTIPLIER_PER_LEVEL * 100).toFixed(0)}%)`,
                    coins: bonusCoins,
                    xp: 0,
                    diamonds: 0,
                    leaguePoints: 0,
                });
            }
        }

        // ── 5. Calcul de progression XP & Niveau ─────────────────────────────
        const previousLevel = currentLevel;
        const newXP = currentXP + totalXP;
        const newLevel = Math.min(getLevelFromXP(newXP), MAX_LEVEL);
        const leveledUp = newLevel > previousLevel;
        const xpLeft = xpToNextLevel(newXP, newLevel);

        // Coffres de niveau (si passage de niveau)
        let chestCoins = 0;
        let chestDiamonds = 0;
        if (leveledUp) {
            for (let l = previousLevel + 1; l <= newLevel; l++) {
                const chest = getLevelUpChest(l);
                chestCoins += chest?.coinsReward ?? DEFAULT_LEVEL_UP_COINS;
                chestDiamonds += chest?.diamondReward ?? 0;
            }
            if (chestCoins > 0 || chestDiamonds > 0) {
                adjustedBreakdown.push({
                    id: 'level_up_chest',
                    label: `📦 Coffre Niveau ${newLevel}`,
                    coins: chestCoins,
                    xp: 0,
                    diamonds: chestDiamonds,
                    leaguePoints: 0,
                });
            }
        }

        // ── 6. Calcul de Ligue ──────────────────────────────────────
        const previousLeaguePoints = currentLeaguePoints;
        const newLeaguePoints = currentLeaguePoints + totalLeaguePoints;
        const previousGrade = getLeagueGrade(previousLeaguePoints);
        const newGrade = getLeagueGrade(newLeaguePoints);
        const gradeUp = newGrade !== previousGrade;

        // ── 6b. Ligue des Cochons — Déblocage de cadres ────────────────
        // `totalLeaguePoints` = cochons INFLIGÉS dans ce match
        const cochonsGivenBefore = input.currentCochonsGiven ?? 0;
        const alreadyUnlocked = (input.unlockedFrames ?? []) as LeagueFrameId[];
        const newCochonsGiven = cochonsGivenBefore + totalLeaguePoints;

        const newlyUnlockedFrames: FrameUnlockEvent[] = [];
        let frameCoinsBonus = 0;

        for (const grade of LEAGUE_GRADE_ORDER) {
            const threshold = LEAGUE_FRAME_THRESHOLDS[grade];
            const frameReward = LEAGUE_FRAME_REWARDS[grade];
            const frameId = frameReward.frameId as LeagueFrameId;

            if (
                newCochonsGiven >= threshold &&
                cochonsGivenBefore < threshold &&
                !alreadyUnlocked.includes(frameId)
            ) {
                newlyUnlockedFrames.push({
                    grade: grade as import('./economy.types').LeagueGrade,
                    frameId,
                    coinsBonus: frameReward.coinsBonus,
                    cochonsAtUnlock: newCochonsGiven,
                });
                frameCoinsBonus += frameReward.coinsBonus;
            }
        }

        // Les coins des cadres s'ajoutent au détail
        if (frameCoinsBonus > 0) {
            adjustedBreakdown.push({
                id: 'league_frame_unlock',
                label: `👀 Palier Ligue débloqué (×${newlyUnlockedFrames.length})`,
                coins: frameCoinsBonus,
                xp: 0,
                diamonds: 0,
                leaguePoints: 0,
            });
        }

        // ── 7. Construction du MatchReward Final ──────────────────────
        const matchReward: MatchReward = {
            // Totaux
            coinsEarned: coinsEarned + chestCoins + frameCoinsBonus,
            xpEarned: totalXP,
            diamondsEarned: totalDiamonds + chestDiamonds,
            leaguePointsEarned: totalLeaguePoints,
            isWinner: rank === 1,

            // Progression XP
            previousLevel,
            newLevel,
            leveledUp,
            previousXP: currentXP,
            newXP,
            xpToNextLevel: xpLeft,

            // Ligue (grades)
            previousGrade,
            newGrade,
            gradeUp,
            previousLeaguePoints,
            newLeaguePoints,
            nextGradeThreshold: nextLeagueThreshold(newGrade),

            // Ligue des Cochons — Cadres
            newCochonsGiven,
            newlyUnlockedFrames,
            frameCoinsBonus,

            // Détail animable
            breakdown: adjustedBreakdown,
        };

        LogService.debug('RewardEngine', 'Rewards calculated:', {
            rank,
            coinsEarned: matchReward.coinsEarned,
            xpEarned: matchReward.xpEarned,
            leveledUp: matchReward.leveledUp,
            newLevel: matchReward.newLevel,
            gradeUp: matchReward.gradeUp,
            newGrade: matchReward.newGrade,
            newCochonsGiven: matchReward.newCochonsGiven,
            framesUnlocked: matchReward.newlyUnlockedFrames.length,
            lines: adjustedBreakdown.length,
        });

        return matchReward;
    },

    /**
     * Construit un `RewardCalculationInput` depuis le GameState finalisé.
     * Helper à utiliser dans GameScreen pour éviter le couplage direct.
     */
    buildInputFromGameState(params: {
        gameState: GameState;
        localPlayerId: string;
        currentLevel: number;
        currentXP: number;
        currentLeaguePoints: number;
        currentCochonsGiven?: number;
        unlockedFrames?: LeagueFrameId[];
        tableTier: TableTier;
        isSoloMode: boolean;
    }): RewardCalculationInput {
        const { gameState, localPlayerId, currentLevel, currentXP, currentLeaguePoints, currentCochonsGiven, unlockedFrames, tableTier, isSoloMode } = params;

        // Classement final
        const sortedPlayers = [...gameState.players].sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.totalCochons !== a.totalCochons) return b.totalCochons - a.totalCochons;
            return b.mancheWins - a.mancheWins;
        });

        const finalRanking: PlayerMatchSnapshot[] = sortedPlayers.map((p, i) => ({
            playerId: p.id,
            totalPoints: p.totalPoints,
            totalCochons: p.totalCochons,
            mancheWins: p.mancheWins,
            totalRoundWins: p.totalRoundWins || 0,
            rank: i + 1,
        }));

        const playerSnapshot = finalRanking.find(p => p.playerId === localPlayerId)!;

        // Construire les événements de manche pour ce joueur
        const mancheHistory: MancheRewardEvent[] = (gameState.mancheHistory || []).map(record => ({
            mancheNumber: record.mancheNumber,
            resultType: record.resultType,
            cochonCount: record.cochonCount || 0,
            isWinner: record.winnerId === localPlayerId,
            isCochonne: record.resultType === 'COCHON' && (record.points[localPlayerId] || 0) < 0,
            pointsEarned: record.points[localPlayerId] || 0,
        }));

        return {
            playerFinalStats: playerSnapshot,
            finalRanking,
            mancheHistory,
            currentLevel,
            currentLeaguePoints,
            currentXP,
            currentCochonsGiven,
            unlockedFrames,
            gameMode: isSoloMode ? 'SOLO' : gameState.gameMode,
            tableTier,
            playerCount: isSoloMode ? 1 : gameState.players.length,
        };
    },
};
