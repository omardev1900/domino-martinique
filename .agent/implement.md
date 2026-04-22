Plan de Résolution - Bug du Cadeau Quotidien et Synchronisation Firestore
Le problème provient d'une divergence entre le cache local (AsyncStorage) et la source de vérité (Firestore) concernant le champ lastDailyRewardTimestamp, exacerbée par un écrasement incomplet de l'économie sur le serveur.

Analyse des Raisons
Perte Locale du Timestamp : Dans economy.service.ts, lorsque le joueur termine une manche (que ce soit via applyReward ou processServerReward), l'objet updated (qui remplace le cache local) omet de conserver le lastDailyRewardTimestamp ! Résultat : dès la fin d'une partie, le cache local oublie que le joueur a réclamé son cadeau.
Conflit UI - Serveur :
Le cache local a oublié le timestamp.
Au focus de l'écran, l'app voit qu'il n'y a pas de timestamp local -> Affiche la modale.
En parallèle, le listener Firestore (listenToEconomy) se synchronise et remet le vrai timestamp du serveur dans le cache de l'app de manière invisible.
Le joueur clique sur "Réclamer". checkAndClaimDailyReward vérifie si les 24h sont écoulées. Puisque le listener Firestore a sournoisement restitué le vrai timestamp (qui date de moins de 24h), la fonction refuse secrètement de donner les coins (en renvoyant null).
Le joueur observe la fermeture de la modale, mais aucun gain ne s'affiche.
Bug Secondaire (Perte de progression Serveur) : Dans le Cloud Function processMatchReward (functions/src/index.ts), l'objet newEconomy omet complètement les nouveaux progrès de la Ligue des Cochons (cochonsGiven, unlockedFrames) !
Modifications Proposées
1. Correction de mobile/src/core/services/economy.service.ts
Ne plus supprimer le timestamp lors de la création manuelle d'objets PlayerEconomy.

[MODIFY] 
economy.service.ts
Ajout de la préservation explicite de lastDailyRewardTimestamp aux deux méthodes fautives. Dans applyReward() :

typescript
const updated: PlayerEconomy = {
            ...
            activeFrame: current.activeFrame ?? null,
            lastDailyRewardTimestamp: current.lastDailyRewardTimestamp, // <- PRÉSERVATION
        };
Dans processServerReward() :

typescript
const updated: PlayerEconomy = {
                ...
                activeFrame: current.activeFrame ?? null,
                lastDailyRewardTimestamp: current.lastDailyRewardTimestamp, // <- PRÉSERVATION
            };
2. Correction et Renforcement de la Firebase Cloud Function
Refactorisation de processMatchReward dans index.ts pour préserver correctement toutes les propriétés (timestamp, cadres actifs) et sauvegarder sur le serveur la progression en Ligue des Cochons :

[MODIFY] 
index.ts
typescript
const existingEconomy = userData?.economy || {};
    const newEconomy = {
        ...existingEconomy,
        coins: newCoins,
        xp: reward.newXP,
        level: reward.newLevel,
        diamonds: newDiamonds,
        leaguePoints: reward.newLeaguePoints,
        leagueGrade: reward.newGrade,
        cochonsGiven: reward.newCochonsGiven,
        unlockedFrames: [...new Set([
            ...(existingEconomy.unlockedFrames || []),
            ...reward.newlyUnlockedFrames.map(f => f.frameId)
        ])],
        // activeFrame et lastDailyRewardTimestamp sont préservés
        // grâce au destructing `...existingEconomy` au dessus.
    };
    // 6. Sauvegarder l'économie du joueur
    await userRef.set({
        economy: newEconomy
    }, { merge: true });
Open Questions
Le problème affectait aussi discrètement les cochons de Ligue. Voulez-vous que je corrige uniquement ces points ou y a-t-il d'autres mécaniques récentes qui se "réinitialisaient" en ligne ?
Verification Plan
Automated Tests
Vérification avec les scripts de tests existants sur getEconomy.
Vérification visuelle ou fonctionnelle hors-ligne simulant les étapes décrites dans l'analyse.
Manual Verification
Déployer l'application sur émulateur.
Ouvre l'app pour valider l'affichage de la modale de récompense.
Jouer une partie pour voir si le modal ré-apparait intempestivement au retour au lobby.