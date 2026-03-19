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
exports.processMatchReward = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const RewardEngine_1 = require("./core/RewardEngine");
admin.initializeApp();
const db = admin.firestore();
exports.processMatchReward = functions.https.onCall(async (data, context) => {
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
    let currentCoins = 0;
    let currentDiamonds = 0;
    if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData === null || userData === void 0 ? void 0 : userData.economy) {
            currentXP = userData.economy.xp || 0;
            currentLevel = userData.economy.level || 1;
            currentLeaguePoints = userData.economy.leaguePoints || 0;
            currentCoins = userData.economy.coins || 0;
            currentDiamonds = userData.economy.diamonds || 0;
        }
    }
    // 3. Forcer les valeurs de l'input avec la réalité serveur
    // Le client ne peut pas tricher sur son niveau de départ
    const secureInput = Object.assign(Object.assign({}, clientInput), { currentXP,
        currentLevel,
        currentLeaguePoints });
    // 4. Exécuter le moteur purement mathématique sur le serveur
    const reward = RewardEngine_1.RewardEngine.calculate(secureInput);
    // 5. Appliquer les gains à l'économie
    // On garde l'argent local (currentCoins) + le gain (reward.coinsEarned)
    const newCoins = currentCoins + reward.coinsEarned;
    const newDiamonds = currentDiamonds + reward.diamondsEarned;
    const newEconomy = {
        coins: newCoins,
        xp: reward.newXP,
        level: reward.newLevel,
        diamonds: newDiamonds,
        leaguePoints: reward.newLeaguePoints,
        leagueGrade: reward.newGrade,
        // On ne touche pas au lastDailyRewardTimestamp ici
    };
    // 6. Sauvegarder fiablement
    await userRef.set({
        economy: newEconomy
    }, { merge: true });
    console.log(`[processMatchReward] Joueur ${uid} crédité: +${reward.coinsEarned} pièces.`);
    // On retourne le résultat au client pour déclencher ses propres animations
    return reward;
});
//# sourceMappingURL=index.js.map