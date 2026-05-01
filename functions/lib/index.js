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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.closeTournament = exports.migrateCochonsGiven = exports.processMatchReward = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const RewardEngine_1 = require("./core/RewardEngine");
admin.initializeApp();
const db = admin.firestore();
exports.processMatchReward = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    // 1. Vérifier l'authentification
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Il faut être connecté pour traiter une récompense.');
    }
    const uid = context.auth.uid;
    const clientInput = data.input;
    // 2. Récupérer l'économie serveur (la vraie source de vérité)
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
            // cochonsGiven doit être synchronisé depuis le serveur pour éviter la dérive
            // avec leaguePoints. Fallback sur leaguePoints si cochonsGiven absent.
            currentCochonsGiven = (_b = (_a = existingEconomy.cochonsGiven) !== null && _a !== void 0 ? _a : existingEconomy.leaguePoints) !== null && _b !== void 0 ? _b : 0;
            currentCoins = existingEconomy.coins || 0;
            currentDiamonds = existingEconomy.diamonds || 0;
        }
    }
    // 3. Forcer les valeurs de l'input avec la réalité serveur
    // Le client ne peut pas tricher sur son niveau de départ
    const secureInput = Object.assign(Object.assign({}, clientInput), { currentXP,
        currentLevel,
        currentLeaguePoints,
        currentCochonsGiven });
    // 4. Exécuter le moteur purement mathématique sur le serveur
    const reward = RewardEngine_1.RewardEngine.calculate(secureInput);
    // 5. Appliquer les gains à l'économie
    // On garde l'argent local (currentCoins) + le gain (reward.coinsEarned)
    const newCoins = currentCoins + reward.coinsEarned;
    const newDiamonds = currentDiamonds + reward.diamondsEarned;
    const newEconomy = Object.assign(Object.assign({}, existingEconomy), { coins: newCoins, xp: reward.newXP, level: reward.newLevel, diamonds: newDiamonds, leaguePoints: reward.newLeaguePoints, leagueGrade: reward.newGrade, cochonsGiven: reward.newCochonsGiven, unlockedFrames: [...new Set([
                ...(existingEconomy.unlockedFrames || []),
                ...reward.newlyUnlockedFrames.map((f) => f.frameId),
            ])] });
    // 6. Sauvegarder l'économie du joueur
    await userRef.set({
        economy: newEconomy
    }, { merge: true });
    // 7. Mise à jour des points de Tournoi (le cas échéant)
    if (clientInput.tournamentId) {
        try {
            const tournamentId = clientInput.tournamentId;
            const tRef = db.collection('tournaments').doc(tournamentId);
            const partRef = tRef.collection('participants').doc(uid);
            // On calcule le score à donner:
            // Exemple : les totalPoints + un bonus si vainqueur, ou bien uniquement l'XP accumulé.
            // Utilisons la somme des points de la partie (totalPoints) + bonus victoire
            // Ou plus simplement, on se base sur les events du clientInput s'il y a un totalPoints
            const pointsToAdd = ((_c = clientInput.playerFinalStats) === null || _c === void 0 ? void 0 : _c.totalPoints) || reward.xpEarned;
            await db.runTransaction(async (t) => {
                var _a;
                const partSnap = await t.get(partRef);
                const tourSnap = await t.get(tRef);
                // Ne mettre à jour que si le tournoi est ACTIVE et le joueur est bien participant
                if (tourSnap.exists && ((_a = tourSnap.data()) === null || _a === void 0 ? void 0 : _a.status) === 'ACTIVE' && partSnap.exists) {
                    const data = partSnap.data();
                    const currentScore = (data === null || data === void 0 ? void 0 : data.score) || 0;
                    const gamesPlayed = (data === null || data === void 0 ? void 0 : data.gamesPlayed) || 0;
                    t.update(partRef, {
                        score: currentScore + pointsToAdd,
                        gamesPlayed: gamesPlayed + 1,
                        lastPlayedAt: Date.now()
                    });
                }
            });
            console.log(`[processMatchReward] Joueur ${uid} crédité: +${pointsToAdd} pts au tournoi ${tournamentId}.`);
        }
        catch (e) {
            console.error(`Erreur maj tournoi ${clientInput.tournamentId} pour user ${uid}:`, e);
        }
    }
    console.log(`[processMatchReward] Joueur ${uid} crédité: +${reward.coinsEarned} pièces.`);
    // On retourne le résultat au client pour déclencher ses propres animations
    return reward;
});
/**
 * Migration one-shot : copie stats.totalCochonsInflicted → economy.cochonsGiven
 * pour tous les utilisateurs dont economy.cochonsGiven < stats.totalCochonsInflicted.
 * À appeler UNE SEULE FOIS depuis l'admin, puis désactiver.
 * Réservé aux admins (vérifié via collection admins/).
 */
exports.migrateCochonsGiven = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Accès refusé.');
    }
    // Vérifier que l'appelant est admin
    const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminSnap.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Réservé aux admins.');
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
    return { migrated, skipped };
});
exports.closeTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Accès refusé.');
    // Vérifier si l'utilisateur est admin serait idéal. On suppose ici que la fonction est appelée de manière sécurisée
    const { tournamentId } = data;
    if (!tournamentId)
        throw new functions.https.HttpsError('invalid-argument', 'id de tournoi manquant.');
    const tRef = db.collection('tournaments').doc(tournamentId);
    return db.runTransaction(async (t) => {
        var _a, _b;
        const tSnap = await t.get(tRef);
        if (!tSnap.exists)
            throw new functions.https.HttpsError('not-found', 'Tournoi introuvable');
        const tData = tSnap.data();
        if (tData.status === 'ENDED')
            throw new functions.https.HttpsError('failed-precondition', 'Tournoi déjà cloturé');
        // Récupérer tous les participants triés par score
        const participantsSnap = await t.get(tRef.collection('participants').orderBy('score', 'desc').limit(3));
        const winners = participantsSnap.docs;
        // Distribuer les récompenses
        const rewards = [
            { coins: tData.reward1st || 0, diamonds: tData.rewardDiamonds1st || 0 }, // 1er
            { coins: tData.reward2nd || 0, diamonds: 0 }, // 2ème
            { coins: tData.reward3rd || 0, diamonds: 0 }, // 3ème
        ];
        for (let i = 0; i < winners.length; i++) {
            if (i >= rewards.length)
                break;
            const reward = rewards[i];
            const userId = winners[i].id;
            // Mise à jour de l'économie
            const userRef = db.collection('users').doc(userId);
            const userSnap = await t.get(userRef);
            if (userSnap.exists) {
                const uData = userSnap.data();
                const currentCoins = ((_a = uData.economy) === null || _a === void 0 ? void 0 : _a.coins) || 0;
                const currentDiamonds = ((_b = uData.economy) === null || _b === void 0 ? void 0 : _b.diamonds) || 0;
                t.update(userRef, {
                    'economy.coins': currentCoins + reward.coins,
                    'economy.diamonds': currentDiamonds + reward.diamonds
                });
            }
        }
        // Marquer le tournoi comme ENDED
        t.update(tRef, { status: 'ENDED' });
        return { success: true, winnersCount: winners.length };
    });
});
/**
 * Suppression de compte — exigée par Google Play depuis 2024.
 * Supprime toutes les données Firestore du joueur puis son compte Firebase Auth.
 * Seul l'utilisateur authentifié peut supprimer son propre compte.
 */
exports.deleteUserAccount = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté.');
    }
    const uid = context.auth.uid;
    try {
        const batch = db.batch();
        // Supprimer les collections principales du joueur
        const collectionsToDelete = ['users', 'stats', 'economy'];
        for (const col of collectionsToDelete) {
            const ref = db.collection(col).doc(uid);
            const snap = await ref.get();
            if (snap.exists)
                batch.delete(ref);
        }
        await batch.commit();
        // Supprimer le compte Firebase Auth en dernier
        await admin.auth().deleteUser(uid);
        console.log(`[deleteUserAccount] Compte supprimé : ${uid}`);
        return { success: true };
    }
    catch (error) {
        console.error(`[deleteUserAccount] Erreur pour ${uid}:`, error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la suppression du compte.');
    }
});
//# sourceMappingURL=index.js.map