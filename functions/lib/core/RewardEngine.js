"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardEngine = void 0;
exports.xpRequiredForLevel = xpRequiredForLevel;
exports.getLevelFromXP = getLevelFromXP;
exports.xpToNextLevel = xpToNextLevel;
exports.getLeagueGrade = getLeagueGrade;
exports.nextLeagueThreshold = nextLeagueThreshold;
exports.applyLevelMultiplier = applyLevelMultiplier;
exports.calculatePot = calculatePot;
exports.getLevelUpChest = getLevelUpChest;
const LogService_1 = require("./services/LogService");
const economy_constants_1 = require("./economy.constants");
// ─────────────────────────────────────────────────────────────────────────────
// Helpers Purs (fonctions mathématiques)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calcule l'XP total requis pour atteindre un niveau donné.
 * Formule exponentielle : xpForLevel(n) = XP_BASE × GROWTH^(n-1)
 * xpRequired(level) = Somme de xpForLevel(1) à xpForLevel(level-1)
 */
function xpRequiredForLevel(level) {
    if (level <= 1)
        return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
        total += Math.floor(economy_constants_1.XP_PER_LEVEL_BASE * Math.pow(economy_constants_1.XP_GROWTH_RATE, l - 1));
    }
    return total;
}
/**
 * Détermine le niveau d'un joueur à partir de son XP total.
 */
function getLevelFromXP(totalXP) {
    let level = 1;
    while (level < economy_constants_1.MAX_LEVEL) {
        const xpNeeded = xpRequiredForLevel(level + 1);
        if (totalXP < xpNeeded)
            break;
        level++;
    }
    return level;
}
/**
 * XP restant pour atteindre le prochain niveau depuis un XP total.
 */
function xpToNextLevel(totalXP, currentLevel) {
    if (currentLevel >= economy_constants_1.MAX_LEVEL)
        return 0;
    return xpRequiredForLevel(currentLevel + 1) - totalXP;
}
/**
 * Détermine le grade de Ligue des Cochons selon le nombre de cochons.
 * Retourne null si le joueur n'a encore inflige aucun cochon.
 */
function getLeagueGrade(leaguePoints) {
    let grade = null;
    for (const g of economy_constants_1.LEAGUE_GRADE_ORDER) {
        if (leaguePoints >= economy_constants_1.LEAGUE_THRESHOLDS[g]) {
            grade = g;
        }
    }
    return grade;
}
/**
 * Seuil du prochain grade de ligue, ou null si grade max.
 * Si grade est null (joueur sans grade), retourne le premier seuil.
 */
function nextLeagueThreshold(grade) {
    if (grade === null)
        return economy_constants_1.LEAGUE_THRESHOLDS[economy_constants_1.LEAGUE_GRADE_ORDER[0]];
    const idx = economy_constants_1.LEAGUE_GRADE_ORDER.indexOf(grade);
    const next = economy_constants_1.LEAGUE_GRADE_ORDER[idx + 1];
    if (!next)
        return null;
    return economy_constants_1.LEAGUE_THRESHOLDS[next];
}
/**
 * Applique le multiplicateur de niveau sur un montant de coins.
 */
function applyLevelMultiplier(coins, level) {
    const multiplier = 1 + (level - 1) * economy_constants_1.COIN_MULTIPLIER_PER_LEVEL;
    return Math.floor(coins * multiplier);
}
/**
 * Calcule le pot distribué pour une table multi.
 * pot = (buyIn × playerCount) × (1 - rake)
 */
function calculatePot(buyIn, playerCount) {
    return Math.floor(buyIn * playerCount * (1 - economy_constants_1.RAKE_PERCENT));
}
/**
 * Vérifie si le joueur reçoit un coffre à ce niveau exact.
 */
function getLevelUpChest(level) {
    var _a;
    return (_a = economy_constants_1.LEVEL_UP_CHESTS.find(c => c.level === level)) !== null && _a !== void 0 ? _a : null;
}
// ─────────────────────────────────────────────────────────────────────────────
// RewardEngine — Point d'entrée public
// ─────────────────────────────────────────────────────────────────────────────
exports.RewardEngine = {
    /**
     * Calcule l'intégralité des récompenses pour un joueur
     * à la fin d'un match (`MATCH_END`).
     *
     * @param input - Contexte de calcul (stats finales, historique des manches, niveau, etc.)
     * @returns `MatchReward` — objet complet avec totaux, progression XP, ligue et breakdown
     */
    calculate(input) {
        var _a, _b, _c, _d;
        const { playerFinalStats, finalRanking, mancheHistory, currentLevel, currentLeaguePoints, currentXP, gameMode, tableTier, playerCount, } = input;
        const breakdown = [];
        let totalCoinsRaw = 0; // Coins de performance (manches, rounds) — soumis au multiplicateur
        let potCoins = 0; // Coins du pot — jamais multipliés par le niveau
        let totalXP = 0;
        let totalDiamonds = 0;
        let totalLeaguePoints = 0;
        // Calculé ici car nécessaire dès la section 1
        const isSolo = playerCount <= 1 || gameMode === 'SOLO';
        // ── 1. Gains par événement de manche ──────────────────────────────────────
        // En multi, les manches n'apportent que de l'XP (pas de coins — le pot suffit)
        for (const manche of mancheHistory) {
            if (manche.isWinner) {
                // Victoire de Manche : coins uniquement en Solo
                // ECO-GAINS FIX: 0 coins for manches. Flat 300 for match win.
                if (isSolo)
                    totalCoinsRaw += 0;
                totalXP += economy_constants_1.BASE_REWARDS.MANCHE_WIN.xp;
                breakdown.push({
                    id: `manche_win_${manche.mancheNumber}`,
                    label: `Victoire Manche #${manche.mancheNumber}`,
                    coins: 0,
                    xp: economy_constants_1.BASE_REWARDS.MANCHE_WIN.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });
                if (manche.resultType === 'COCHON' && manche.cochonCount > 0) {
                    if (manche.cochonCount >= 2) {
                        // Double Cochon (3-0-0)
                        if (isSolo)
                            totalCoinsRaw += 0;
                        totalXP += economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.xp;
                        totalDiamonds += economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.diamonds;
                        totalLeaguePoints += economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.leaguePoints;
                        breakdown.push({
                            id: `double_cochon_${manche.mancheNumber}`,
                            label: `🐷🐷 Double Cochon (Manche #${manche.mancheNumber})`,
                            coins: 0,
                            xp: economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.xp,
                            diamonds: economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.diamonds,
                            leaguePoints: economy_constants_1.BASE_REWARDS.DOUBLE_COCHON.leaguePoints,
                        });
                    }
                    else {
                        // Cochon Simple (3-1-0)
                        if (isSolo)
                            totalCoinsRaw += 0;
                        totalXP += economy_constants_1.BASE_REWARDS.COCHON_BONUS.xp;
                        totalLeaguePoints += economy_constants_1.BASE_REWARDS.COCHON_BONUS.leaguePoints;
                        breakdown.push({
                            id: `cochon_${manche.mancheNumber}`,
                            label: `🐷 Bonus Cochon (Manche #${manche.mancheNumber})`,
                            coins: 0,
                            xp: economy_constants_1.BASE_REWARDS.COCHON_BONUS.xp,
                            diamonds: 0,
                            leaguePoints: economy_constants_1.BASE_REWARDS.COCHON_BONUS.leaguePoints,
                        });
                    }
                }
            }
            else if (manche.isCochonne) {
                totalXP += economy_constants_1.BASE_REWARDS.MATCH_COCHONNE.xp;
                breakdown.push({
                    id: `cochonne_${manche.mancheNumber}`,
                    label: `🥚 Cochonné (Manche #${manche.mancheNumber})`,
                    coins: 0,
                    xp: economy_constants_1.BASE_REWARDS.MATCH_COCHONNE.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });
            }
        }
        // ── 2. Gains de Rounds ──────────────────────────────────────────
        // En multi, les rounds n'apportent que de l'XP
        const roundWins = playerFinalStats.totalRoundWins;
        if (roundWins > 0) {
            const roundCoins = 0; // ECO-GAINS FIX: 0 coins for rounds
            const roundXP = economy_constants_1.BASE_REWARDS.ROUND_WIN.xp * roundWins;
            if (isSolo)
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
        // ── 3. Gains de fin de Match (classement) ──────────────────────────
        const rank = playerFinalStats.rank;
        // Note : isSolo est calculé en amont (avant section 1)
        if (rank === 1) {
            // Vainqueur du match
            totalXP += economy_constants_1.BASE_REWARDS.MATCH_WIN.xp;
            totalDiamonds += economy_constants_1.BASE_REWARDS.MATCH_WIN.diamonds;
            // ECO-GAINS FIX: Flat 300 coins for winner in all modes
            potCoins = 300;
            breakdown.push({
                id: 'match_win',
                label: `🏆 Victoire du Match`,
                coins: potCoins,
                xp: economy_constants_1.BASE_REWARDS.MATCH_WIN.xp,
                diamonds: economy_constants_1.BASE_REWARDS.MATCH_WIN.diamonds,
                leaguePoints: 0,
            });
        }
        else if (rank === 2 && !isSolo) {
            // 2ème — ECO-GAINS FIX: 0 coins for 2nd place
            potCoins = 0;
            totalXP += economy_constants_1.BASE_REWARDS.MATCH_FINISH.xp;
            if (potCoins > 0) {
                breakdown.push({
                    id: 'match_second',
                    label: `🥈 2ème Place`,
                    coins: potCoins,
                    xp: economy_constants_1.BASE_REWARDS.MATCH_FINISH.xp,
                    diamonds: 0,
                    leaguePoints: 0,
                });
            }
        }
        else {
            // Participation (non vainqueur)
            totalXP += economy_constants_1.BASE_REWARDS.MATCH_FINISH.xp;
            breakdown.push({
                id: 'match_finish',
                label: `Participation`,
                coins: 0,
                xp: economy_constants_1.BASE_REWARDS.MATCH_FINISH.xp,
                diamonds: 0,
                leaguePoints: 0,
            });
        }
        // ── 4. Appliquer le multiplicateur de niveau (performance coins uniquement) ───
        // potCoins (= pot du match en multi, flat reward en solo) N'est PAS multiplié.
        // Le multiplicateur de niveau s'applique UNIQUEMENT aux coins de performance
        // (manches, rounds en solo — en multi totalCoinsRaw = 0 donc pas d'effet).
        const performanceCoinsMultiplied = applyLevelMultiplier(totalCoinsRaw, currentLevel);
        const coinsEarned = performanceCoinsMultiplied + potCoins;
        // Ratio pour ajuster le breakdown (ne s'applique qu'aux lignes performance)
        const multiplierRatio = totalCoinsRaw > 0 ? performanceCoinsMultiplied / totalCoinsRaw : 1;
        const adjustedBreakdown = breakdown.map(b => (Object.assign(Object.assign({}, b), { coins: Math.floor(b.coins * multiplierRatio) })));
        // Si un multiplicateur est actif, ajouter une ligne explicative (solo uniquement)
        if (isSolo && currentLevel > 1 && totalCoinsRaw > 0) {
            const bonusCoins = performanceCoinsMultiplied - totalCoinsRaw;
            if (bonusCoins > 0) {
                adjustedBreakdown.push({
                    id: 'level_multiplier',
                    label: `⚡ Bonus Niveau ${currentLevel} (+${((currentLevel - 1) * economy_constants_1.COIN_MULTIPLIER_PER_LEVEL * 100).toFixed(0)}%)`,
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
        const newLevel = Math.min(getLevelFromXP(newXP), economy_constants_1.MAX_LEVEL);
        const leveledUp = newLevel > previousLevel;
        const xpLeft = xpToNextLevel(newXP, newLevel);
        // Coffres de niveau (si passage de niveau)
        let chestCoins = 0;
        let chestDiamonds = 0;
        if (leveledUp) {
            for (let l = previousLevel + 1; l <= newLevel; l++) {
                const chest = getLevelUpChest(l);
                chestCoins += (_a = chest === null || chest === void 0 ? void 0 : chest.coinsReward) !== null && _a !== void 0 ? _a : economy_constants_1.DEFAULT_LEVEL_UP_COINS;
                chestDiamonds += (_b = chest === null || chest === void 0 ? void 0 : chest.diamondReward) !== null && _b !== void 0 ? _b : 0;
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
        const cochonsGivenBefore = (_c = input.currentCochonsGiven) !== null && _c !== void 0 ? _c : 0;
        const alreadyUnlocked = ((_d = input.unlockedFrames) !== null && _d !== void 0 ? _d : []);
        const newCochonsGiven = cochonsGivenBefore + totalLeaguePoints;
        const newlyUnlockedFrames = [];
        let frameCoinsBonus = 0;
        let unlockedPalierCount = 0;
        for (const grade of economy_constants_1.LEAGUE_FRAME_GRADE_ORDER) {
            const threshold = economy_constants_1.LEAGUE_FRAME_THRESHOLDS[grade];
            const frameReward = economy_constants_1.LEAGUE_FRAME_REWARDS[grade];
            const frameId = frameReward.frameId;
            if (newCochonsGiven >= threshold &&
                cochonsGivenBefore < threshold &&
                !alreadyUnlocked.includes(frameId)) {
                unlockedPalierCount += 1;
                // Les coins de palier sont TOUJOURS attribués, que les cadres visuels
                // soient activés ou non (LEAGUE_FRAMES_ENABLED ne contrôle que le
                // déblocage cosmétique, pas la récompense économique).
                frameCoinsBonus += frameReward.coinsBonus;
                if (economy_constants_1.LEAGUE_FRAMES_ENABLED) {
                    newlyUnlockedFrames.push({
                        grade,
                        frameId,
                        coinsBonus: frameReward.coinsBonus,
                        cochonsAtUnlock: newCochonsGiven,
                    });
                }
            }
        }
        // Les coins des cadres s'ajoutent au détail
        if (frameCoinsBonus > 0) {
            adjustedBreakdown.push({
                id: 'league_frame_unlock',
                label: `🐷 Bonus palier Ligue (×${unlockedPalierCount})`,
                coins: frameCoinsBonus,
                xp: 0,
                diamonds: 0,
                leaguePoints: 0,
            });
        }
        // ── 7. Construction du MatchReward Final ──────────────────────
        const matchReward = {
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
        LogService_1.LogService.debug('RewardEngine', 'Rewards calculated:', {
            rank,
            coinsEarned: matchReward.coinsEarned,
            xpEarned: matchReward.xpEarned,
            leveledUp: matchReward.leveledUp,
            newLevel: matchReward.newLevel,
            gradeUp: matchReward.gradeUp,
            newGrade: matchReward.newGrade,
            newCochonsGiven: matchReward.newCochonsGiven,
            framesUnlocked: unlockedPalierCount,
            lines: adjustedBreakdown.length,
        });
        return matchReward;
    },
    /**
     * Construit un `RewardCalculationInput` depuis le GameState finalisé.
     * Helper à utiliser dans GameScreen pour éviter le couplage direct.
     */
    buildInputFromGameState(params) {
        const { gameState, localPlayerId, currentLevel, currentXP, currentLeaguePoints, currentCochonsGiven, unlockedFrames, tableTier, isSoloMode } = params;
        const getCochonRankingValue = (player) => gameState.gameMode === 'COCHON'
            ? (player.totalCochonsInfliges || 0)
            : (player.totalCochons || 0);
        // Classement final
        const sortedPlayers = [...gameState.players].sort((a, b) => {
            if (gameState.gameMode === 'COCHON') {
                if (getCochonRankingValue(b) !== getCochonRankingValue(a)) {
                    return getCochonRankingValue(b) - getCochonRankingValue(a);
                }
                return b.totalPoints - a.totalPoints;
            }
            if (b.totalPoints !== a.totalPoints)
                return b.totalPoints - a.totalPoints;
            if (b.totalCochons !== a.totalCochons)
                return b.totalCochons - a.totalCochons;
            return b.mancheWins - a.mancheWins;
        });
        const finalRanking = sortedPlayers.map((p, i) => ({
            playerId: p.id,
            totalPoints: p.totalPoints,
            totalCochons: getCochonRankingValue(p),
            mancheWins: p.mancheWins,
            totalRoundWins: p.totalRoundWins || 0,
            rank: i + 1,
        }));
        const playerSnapshot = finalRanking.find(p => p.playerId === localPlayerId);
        // Construire les événements de manche pour ce joueur
        const mancheHistory = (gameState.mancheHistory || []).map(record => ({
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
//# sourceMappingURL=RewardEngine.js.map