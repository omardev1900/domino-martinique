"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMonthlyLeague = exports.deleteUserAccount = exports.closeTournament = exports.migrateCochonsGiven = exports.processMatchRewardHttp = exports.processMatchReward = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const RewardEngine_1 = require("./core/RewardEngine");
const systemLog_1 = require("./systemLog");
admin.initializeApp();
const db = admin.firestore();
const LOCAL_WEB_ALLOWED_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
function applyCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && LOCAL_WEB_ALLOWED_ORIGIN.test(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Vary', 'Origin');
    }
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}
function sendCorsPreflight(req, res) {
    applyCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
}
async function processMatchRewardInternal(data, uid) {
    var _a, _b, _c, _d;
    const clientInput = data.input;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    let currentXP = 0;
    let currentLevel = 1;
    let currentLeaguePoints = 0;
    let currentCochonsGiven = 0;
    let currentCoins = 0;
    let currentDiamonds = 0;
    let existingEconomy = {};
    if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData === null || userData === void 0 ? void 0 : userData.economy) {
            existingEconomy = userData.economy;
            currentXP = existingEconomy.xp || 0;
            currentLevel = existingEconomy.level || 1;
            currentLeaguePoints = existingEconomy.leaguePoints || 0;
            currentCochonsGiven = (_b = (_a = existingEconomy.cochonsGiven) !== null && _a !== void 0 ? _a : existingEconomy.leaguePoints) !== null && _b !== void 0 ? _b : 0;
            currentCoins = existingEconomy.coins || 0;
            currentDiamonds = existingEconomy.diamonds || 0;
        }
    }
    const secureInput = Object.assign(Object.assign({}, clientInput), { currentXP,
        currentLevel,
        currentLeaguePoints,
        currentCochonsGiven });
    const reward = RewardEngine_1.RewardEngine.calculate(secureInput);
    const newEconomy = Object.assign(Object.assign({}, existingEconomy), { coins: currentCoins + reward.coinsEarned, xp: reward.newXP, level: reward.newLevel, diamonds: currentDiamonds + reward.diamondsEarned, leaguePoints: reward.newLeaguePoints, leagueGrade: reward.newGrade, cochonsGiven: reward.newCochonsGiven, unlockedFrames: [...new Set([
                ...(existingEconomy.unlockedFrames || []),
                ...reward.newlyUnlockedFrames.map((frame) => frame.frameId),
            ])] });
    await userRef.set({ economy: newEconomy }, { merge: true });
    if (clientInput.tournamentId) {
        try {
            const tournamentId = clientInput.tournamentId;
            const tournamentRef = db.collection('tournaments').doc(tournamentId);
            const participantRef = tournamentRef.collection('participants').doc(uid);
            const pointsToAdd = ((_c = clientInput.playerFinalStats) === null || _c === void 0 ? void 0 : _c.totalPoints) || reward.xpEarned;
            await db.runTransaction(async (transaction) => {
                var _a;
                const participantSnap = await transaction.get(participantRef);
                const tournamentSnap = await transaction.get(tournamentRef);
                if (tournamentSnap.exists && ((_a = tournamentSnap.data()) === null || _a === void 0 ? void 0 : _a.status) === 'ACTIVE' && participantSnap.exists) {
                    const participantData = participantSnap.data();
                    const currentScore = (participantData === null || participantData === void 0 ? void 0 : participantData.score) || 0;
                    const gamesPlayed = (participantData === null || participantData === void 0 ? void 0 : participantData.gamesPlayed) || 0;
                    transaction.update(participantRef, {
                        score: currentScore + pointsToAdd,
                        gamesPlayed: gamesPlayed + 1,
                        lastPlayedAt: Date.now(),
                    });
                }
            });
            console.log(`[processMatchReward] Joueur ${uid} credite: +${pointsToAdd} pts au tournoi ${tournamentId}.`);
            await (0, systemLog_1.logSystemEvent)({
                event: 'tournament_score_update',
                level: 'info',
                functionName: 'processMatchReward',
                uid,
                message: `+${pointsToAdd} pts ajoutes au tournoi ${tournamentId}`,
                metadata: { tournamentId, pointsToAdd },
            });
        }
        catch (error) {
            console.error(`Erreur maj tournoi ${clientInput.tournamentId} pour user ${uid}:`, error);
            await (0, systemLog_1.logSystemEvent)({
                event: 'function_error',
                level: 'error',
                functionName: 'processMatchReward',
                uid,
                message: `Erreur maj tournoi ${clientInput.tournamentId}: ${(_d = error === null || error === void 0 ? void 0 : error.message) !== null && _d !== void 0 ? _d : error}`,
                metadata: { tournamentId: clientInput.tournamentId },
            });
        }
    }
    console.log(`[processMatchReward] Joueur ${uid} credite: +${reward.coinsEarned} pieces.`);
    await (0, systemLog_1.logSystemEvent)({
        event: 'match_reward',
        level: 'info',
        functionName: 'processMatchReward',
        uid,
        message: `+${reward.coinsEarned} coins credites apres match`,
        metadata: { coinsEarned: reward.coinsEarned, xpEarned: reward.xpEarned },
    });
    return reward;
}
exports.processMatchReward = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Il faut etre connecte pour traiter une recompense.');
    }
    return processMatchRewardInternal(data, context.auth.uid);
});
exports.processMatchRewardHttp = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    if (sendCorsPreflight(req, res))
        return;
    applyCorsHeaders(req, res);
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method-not-allowed' });
        return;
    }
    try {
        const authHeader = req.headers.authorization;
        const idToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : null;
        if (!idToken) {
            res.status(401).json({ error: 'unauthenticated', message: 'Token manquant.' });
            return;
        }
        const decoded = await admin.auth().verifyIdToken(idToken);
        const reward = await processMatchRewardInternal(req.body, decoded.uid);
        res.status(200).json({ result: reward });
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            const statusByCode = {
                'invalid-argument': 400,
                unauthenticated: 401,
                'permission-denied': 403,
                'not-found': 404,
                'failed-precondition': 412,
            };
            res.status((_a = statusByCode[error.code]) !== null && _a !== void 0 ? _a : 500).json({
                error: error.code,
                message: error.message,
            });
            return;
        }
        console.error('[processMatchRewardHttp] Unexpected error:', error);
        res.status(500).json({
            error: 'internal',
            message: (_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : 'Erreur interne.',
        });
    }
});
/**
 * Migration one-shot : copie stats.totalCochonsInflicted -> economy.cochonsGiven
 * pour tous les utilisateurs dont economy.cochonsGiven < stats.totalCochonsInflicted.
 * A appeler une seule fois depuis l'admin, puis desactiver.
 */
exports.migrateCochonsGiven = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Acces refuse.');
    }
    const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminSnap.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Reserve aux admins.');
    }
    const usersSnap = await db.collection('users').get();
    let migrated = 0;
    let skipped = 0;
    const batch = db.batch();
    usersSnap.forEach((userDoc) => {
        var _a, _b, _c, _d;
        const data = userDoc.data();
        const statsTotal = (_b = (_a = data === null || data === void 0 ? void 0 : data.stats) === null || _a === void 0 ? void 0 : _a.totalCochonsInflicted) !== null && _b !== void 0 ? _b : 0;
        const economyCochons = (_d = (_c = data === null || data === void 0 ? void 0 : data.economy) === null || _c === void 0 ? void 0 : _c.cochonsGiven) !== null && _d !== void 0 ? _d : 0;
        if (statsTotal > economyCochons) {
            batch.update(userDoc.ref, {
                'economy.cochonsGiven': statsTotal,
            });
            migrated++;
        }
        else {
            skipped++;
        }
    });
    await batch.commit();
    console.log(`[migrateCochonsGiven] Migrated: ${migrated}, Skipped: ${skipped}`);
    await (0, systemLog_1.logSystemEvent)({
        event: 'cochons_migrated',
        level: 'info',
        functionName: 'migrateCochonsGiven',
        uid: context.auth.uid,
        message: `Migration cochons terminee : ${migrated} migres, ${skipped} ignores`,
        metadata: { migrated, skipped },
    });
    return { migrated, skipped };
});
exports.closeTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Acces refuse.');
    }
    const { tournamentId } = data;
    if (!tournamentId) {
        throw new functions.https.HttpsError('invalid-argument', 'id de tournoi manquant.');
    }
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    return db.runTransaction(async (transaction) => {
        var _a, _b;
        const tournamentSnap = await transaction.get(tournamentRef);
        if (!tournamentSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Tournoi introuvable');
        }
        const tournamentData = tournamentSnap.data();
        if (tournamentData.status === 'ENDED') {
            throw new functions.https.HttpsError('failed-precondition', 'Tournoi deja cloture');
        }
        const participantsSnap = await transaction.get(tournamentRef.collection('participants').orderBy('score', 'desc').limit(3));
        const winners = participantsSnap.docs;
        const rewards = [
            { coins: tournamentData.reward1st || 0, diamonds: tournamentData.rewardDiamonds1st || 0 },
            { coins: tournamentData.reward2nd || 0, diamonds: 0 },
            { coins: tournamentData.reward3rd || 0, diamonds: 0 },
        ];
        for (let i = 0; i < winners.length; i++) {
            if (i >= rewards.length)
                break;
            const reward = rewards[i];
            const userId = winners[i].id;
            const userRef = db.collection('users').doc(userId);
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists) {
                const userData = userSnap.data();
                const currentCoins = ((_a = userData.economy) === null || _a === void 0 ? void 0 : _a.coins) || 0;
                const currentDiamonds = ((_b = userData.economy) === null || _b === void 0 ? void 0 : _b.diamonds) || 0;
                transaction.update(userRef, {
                    'economy.coins': currentCoins + reward.coins,
                    'economy.diamonds': currentDiamonds + reward.diamonds,
                });
            }
        }
        transaction.update(tournamentRef, { status: 'ENDED' });
        setTimeout(() => {
            var _a;
            (0, systemLog_1.logSystemEvent)({
                event: 'tournament_closed',
                level: 'info',
                functionName: 'closeTournament',
                uid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
                message: `Tournoi ${tournamentId} cloture avec ${winners.length} gagnants`,
                metadata: { tournamentId, winnersCount: winners.length },
            });
        }, 0);
        return { success: true, winnersCount: winners.length };
    });
});
/**
 * Suppression de compte - exigee par Google Play depuis 2024.
 * Supprime les donnees Firestore du joueur puis son compte Firebase Auth.
 */
exports.deleteUserAccount = functions.https.onCall(async (_data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Vous devez etre connecte.');
    }
    const uid = context.auth.uid;
    try {
        const batch = db.batch();
        const collectionsToDelete = ['users', 'stats', 'economy'];
        for (const collectionName of collectionsToDelete) {
            const ref = db.collection(collectionName).doc(uid);
            const snap = await ref.get();
            if (snap.exists) {
                batch.delete(ref);
            }
        }
        await batch.commit();
        await admin.auth().deleteUser(uid);
        console.log(`[deleteUserAccount] Compte supprime : ${uid}`);
        await (0, systemLog_1.logSystemEvent)({
            event: 'account_deleted',
            level: 'info',
            functionName: 'deleteUserAccount',
            uid,
            message: 'Compte supprime',
        });
        return { success: true };
    }
    catch (error) {
        console.error(`[deleteUserAccount] Erreur pour ${uid}:`, error);
        await (0, systemLog_1.logSystemEvent)({
            event: 'function_error',
            level: 'error',
            functionName: 'deleteUserAccount',
            uid,
            message: `Erreur suppression compte: ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error}`,
        });
        throw new functions.https.HttpsError('internal', 'Erreur lors de la suppression du compte.');
    }
});
/**
 * Remise à zéro mensuelle de la Ligue des Cochons.
 * S'exécute automatiquement le 1er de chaque mois à minuit (00:00 UTC).
 *
 * Actions :
 *  1. Sauvegarde les scores du mois écoulé dans `league_history/{YYYY-MM}/players/{uid}`
 *  2. Remet `leaguePoints` et `cochonsGiven` à 0 dans l'économie de chaque joueur
 *  3. Remet `leagueGrade` à null (grade rechargé depuis 0 au prochain gain)
 */
exports.resetMonthlyLeague = functions.pubsub
    .schedule('0 0 1 * *') // Premier du mois à minuit UTC
    .timeZone('America/Martinique')
    .onRun(async (_context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const now = new Date();
    // Mois précédent (car on exécute le 1er du mois courant)
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    console.log(`[resetMonthlyLeague] Début du reset pour le mois ${monthKey}`);
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
        console.log('[resetMonthlyLeague] Aucun utilisateur trouvé.');
        return null;
    }
    const historyRef = db.collection('league_history').doc(monthKey);
    const BATCH_SIZE = 400;
    let batchCount = 0;
    let batch = db.batch();
    let historyBatch = db.batch();
    let processed = 0;
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const data = userDoc.data();
        const economy = (_a = data === null || data === void 0 ? void 0 : data.economy) !== null && _a !== void 0 ? _a : {};
        const leaguePoints = (_b = economy.leaguePoints) !== null && _b !== void 0 ? _b : 0;
        const cochonsGiven = (_c = economy.cochonsGiven) !== null && _c !== void 0 ? _c : 0;
        const leagueGrade = (_d = economy.leagueGrade) !== null && _d !== void 0 ? _d : null;
        // 1. Archiver le score du mois
        const playerHistoryRef = historyRef.collection('players').doc(uid);
        historyBatch.set(playerHistoryRef, {
            uid,
            displayName: (_g = (_e = data === null || data === void 0 ? void 0 : data.displayName) !== null && _e !== void 0 ? _e : (_f = data === null || data === void 0 ? void 0 : data.profile) === null || _f === void 0 ? void 0 : _f.displayName) !== null && _g !== void 0 ? _g : 'Inconnu',
            leaguePoints,
            cochonsGiven,
            leagueGrade,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 2. Remettre à zéro
        batch.update(userDoc.ref, {
            'economy.leaguePoints': 0,
            'economy.cochonsGiven': 0,
            'economy.leagueGrade': null,
        });
        batchCount++;
        processed++;
        // Firestore : limite de 500 opérations par batch
        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            await historyBatch.commit();
            batch = db.batch();
            historyBatch = db.batch();
            batchCount = 0;
        }
    }
    if (batchCount > 0) {
        await batch.commit();
        await historyBatch.commit();
    }
    console.log(`[resetMonthlyLeague] Reset terminé : ${processed} joueurs remis à zéro pour ${monthKey}.`);
    await (0, systemLog_1.logSystemEvent)({
        event: 'monthly_league_reset',
        level: 'info',
        functionName: 'resetMonthlyLeague',
        uid: 'system',
        message: `Reset mensuel ligue terminé : ${processed} joueurs, mois ${monthKey}`,
        metadata: { monthKey, processed },
    });
    return null;
});
__exportStar(require("./cleanupRooms"), exports);
//# sourceMappingURL=index.js.map