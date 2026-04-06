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
            const pointsToAdd = clientInput.playerFinalStats?.totalPoints || reward.xpEarned;
            
            await db.runTransaction(async (t) => {
                const partSnap = await t.get(partRef);
                const tourSnap = await t.get(tRef);
                
                // Ne mettre à jour que si le tournoi est ACTIVE et le joueur est bien participant
                if (tourSnap.exists && tourSnap.data()?.status === 'ACTIVE' && partSnap.exists) {
                    const data = partSnap.data();
                    const currentScore = data?.score || 0;
                    const gamesPlayed = data?.gamesPlayed || 0;
                    t.update(partRef, {
                        score: currentScore + pointsToAdd,
                        gamesPlayed: gamesPlayed + 1,
                        lastPlayedAt: Date.now()
                    });
                }
            });
            console.log(`[processMatchReward] Joueur ${uid} crédité: +${pointsToAdd} pts au tournoi ${tournamentId}.`);
        } catch (e: any) {
            console.error(`Erreur maj tournoi ${clientInput.tournamentId} pour user ${uid}:`, e);
        }
    }

    console.log(`[processMatchReward] Joueur ${uid} crédité: +${reward.coinsEarned} pièces.`);

    // On retourne le résultat au client pour déclencher ses propres animations
    return reward;
});

export const closeTournament = functions.https.onCall(async (data: { tournamentId: string }, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Accès refusé.');
    
    // Vérifier si l'utilisateur est admin serait idéal. On suppose ici que la fonction est appelée de manière sécurisée
    const { tournamentId } = data;
    if (!tournamentId) throw new functions.https.HttpsError('invalid-argument', 'id de tournoi manquant.');

    const tRef = db.collection('tournaments').doc(tournamentId);
    
    return db.runTransaction(async (t) => {
        const tSnap = await t.get(tRef);
        if (!tSnap.exists) throw new functions.https.HttpsError('not-found', 'Tournoi introuvable');
        const tData = tSnap.data()!;
        if (tData.status === 'ENDED') throw new functions.https.HttpsError('failed-precondition', 'Tournoi déjà cloturé');

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
            if (i >= rewards.length) break;
            const reward = rewards[i];
            const userId = winners[i].id;
            
            // Mise à jour de l'économie
            const userRef = db.collection('users').doc(userId);
            const userSnap = await t.get(userRef);
            if (userSnap.exists) {
                const uData = userSnap.data()!;
                const currentCoins = uData.economy?.coins || 0;
                const currentDiamonds = uData.economy?.diamonds || 0;
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
