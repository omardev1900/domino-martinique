import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RewardEngine } from './core/RewardEngine';
import { RewardCalculationInput } from './core/economy.types';

admin.initializeApp();
const db = admin.firestore();

export const processMatchReward = functions.https.onCall(async (data: { input: Partial<RewardCalculationInput> }, context: functions.https.CallableContext) => {
    // 1. Vérifier l'authentification
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Il faut être connecté pour traiter une récompense.'
        );
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
        if (userData?.economy) {
            currentXP = userData.economy.xp || 0;
            currentLevel = userData.economy.level || 1;
            currentLeaguePoints = userData.economy.leaguePoints || 0;
            currentCoins = userData.economy.coins || 0;
            currentDiamonds = userData.economy.diamonds || 0;
        }
    }

    // 3. Forcer les valeurs de l'input avec la réalité serveur
    // Le client ne peut pas tricher sur son niveau de départ
    const secureInput: RewardCalculationInput = {
        ...clientInput as RewardCalculationInput,
        currentXP,
        currentLevel,
        currentLeaguePoints,
    };

    // 4. Exécuter le moteur purement mathématique sur le serveur
    const reward = RewardEngine.calculate(secureInput);

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
