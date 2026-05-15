/**
 * economy.service.ts
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  ECONOMY SERVICE — Persistance & Application        ║
 * ║  • Lit/écrit le solde économique du joueur          ║
 * ║  • AsyncStorage (tous joueurs, incl. invités)       ║
 * ║  • Firestore (joueurs authentifiés uniquement)      ║
 * ║  • Applique un MatchReward sur le profil            ║
 * ║  • NE contient AUCUNE logique de calcul             ║
 * ╚══════════════════════════════════════════════════════╝
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from './firebase';
import { LogService } from './LogService';
import { PlayerEconomy, MatchReward, LeagueGrade, RewardCalculationInput, LeagueFrameId } from '../economy.types';
import { NEW_PLAYER_COINS, DAILY_REWARD_COINS, AD_REWARD_COINS } from '../economy.constants';
import { getLevelFromXP, getLeagueGrade } from '../RewardEngine';

/** Infos de profil minimales nécessaires pour les écrire dans Firestore avec l'économie */
export interface EconomyProfileInfo {
    displayName: string;
    avatarId: string;
}

const STORAGE_KEY_ECONOMY = '@player_economy';
const GUEST_STORAGE_SCOPE = 'guest';
const LOCAL_WEB_FUNCTIONS_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

// ─── Valeur par défaut pour nouveau joueur ───────────────────────────────────

const DEFAULT_ECONOMY: PlayerEconomy = {
    coins: NEW_PLAYER_COINS, // 🪙 Cadeau de bienvenue
    xp: 0,
    level: 1,
    diamonds: 0,
    leaguePoints: 0,
    leagueGrade: null,
    // ─── Ligue des Cochons ───
    // [TECH-DEBT-COCHONS] cochonsGiven n'est plus défini par défaut côté local —
    // Firestore reste source de vérité, le listener met la valeur à jour à chaque snapshot
    cochonsGiven: 0,
    unlockedFrames: [],
    activeFrame: null,
};

// ─────────────────────────────────────────────────────────────────────────────

class EconomyService {
    private cached: PlayerEconomy | null = null;
    private storageScope = GUEST_STORAGE_SCOPE;

    private get storageKey(): string {
        return `${STORAGE_KEY_ECONOMY}:${this.storageScope}`;
    }

    async useStorageScope(uid?: string | null): Promise<void> {
        const nextScope = uid && !uid.startsWith('guest_') ? uid : GUEST_STORAGE_SCOPE;
        if (this.storageScope === nextScope) return;
        this.storageScope = nextScope;
        this.cached = null;
    }

    private shouldUseWebLocalRewardHttpFallback(): boolean {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
        return LOCAL_WEB_FUNCTIONS_HOSTNAMES.has(window.location.hostname);
    }

    private async callProcessMatchRewardHttp(input: RewardCalculationInput): Promise<MatchReward> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('Utilisateur non authentifie pour le fallback HTTP processMatchReward.');
        }

        const idToken = await currentUser.getIdToken();
        const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
        if (!projectId) {
            throw new Error('EXPO_PUBLIC_FIREBASE_PROJECT_ID manquant pour le fallback HTTP processMatchReward.');
        }

        const response = await fetch(
            `https://us-central1-${projectId}.cloudfunctions.net/processMatchRewardHttp`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            }
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(payload?.message ?? `HTTP ${response.status} processMatchRewardHttp`);
        }

        return payload?.result as MatchReward;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Lecture
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Retourne l'économie courante du joueur.
     * Priorité : 1. Cache mémoire, 2. AsyncStorage, 3. Défaut (nouveau joueur)
     */
    async getEconomy(): Promise<PlayerEconomy> {
        if (this.cached) return { ...this.cached };

        try {
            const json = await AsyncStorage.getItem(this.storageKey);
            if (json) {
                const parsed = JSON.parse(json);
                // Migration : s'assurer que tous les champs sont présents
                this.cached = this.mergeWithDefaults(parsed);
            } else {
                // Nouveau joueur → cadeau de bienvenue
                this.cached = { ...DEFAULT_ECONOMY };
                await this.persistLocal();
                LogService.info('EconomyService', 'New player: welcome bonus applied.');
            }
        } catch (e) {
            LogService.error('EconomyService', 'getEconomy error:', e);
            this.cached = { ...DEFAULT_ECONOMY };
        }

        return { ...this.cached! };
    }

    /**
     * Charge l'économie depuis Firebase et fusionne avec le local.
     * À appeler après un login. Ignoré pour les invités.
     */
    async syncFromFirebase(uid: string): Promise<void> {
        if (uid.startsWith('guest_')) return;

        try {
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const data = snap.data();
                const remoteEconomy = data.economy as Partial<PlayerEconomy> | undefined;
                const remoteStats = data.stats as any; 

                if (remoteEconomy) {
                    const local = await this.getEconomy();

                    // 🛡️ MIGRATION / RESTAURATION COCHONS [2026-04-15]
                    // Si economy.cochonsGiven est désynchronisé par rapport à stats.totalCochonsInflicted,
                    // on aligne sur la valeur stats (toujours correcte) et on repousse vers Firestore.
                    let cochonsMigrated = false;
                    if (remoteStats && typeof remoteStats.totalCochonsInflicted === 'number') {
                        const statsCochons = remoteStats.totalCochonsInflicted;
                        const economyCochons = remoteEconomy.cochonsGiven ?? 0;
                        if (statsCochons > economyCochons) {
                            LogService.info('EconomyService',
                                `[R3-B10] Migration cochons: ${economyCochons} → ${statsCochons} (depuis stats.totalCochonsInflicted)`
                            );
                            remoteEconomy.cochonsGiven = statsCochons;
                            cochonsMigrated = true;
                        }
                    }

                    const merged = this.mergeEconomies(local, remoteEconomy);
                    this.cached = merged;
                    await this.persistLocal();

                    // [R3-B10] Si la migration a corrigé cochonsGiven, pousser vers Firestore
                    // pour que /ligue-cochons et /leaderboard soient synchronisés.
                    if (cochonsMigrated) {
                        await this.pushToFirebase(uid, merged);
                        LogService.info('EconomyService', '[R3-B10] economy.cochonsGiven corrigé et repoussé vers Firestore.');
                    }

                    LogService.info('EconomyService', 'Economy hydrated from Firebase.');
                    return;
                }
            }

            // Aucune donnée remote = nouveau compte → initialiser Firestore avec les valeurs par défaut
            const local = await this.getEconomy();
            await this.pushToFirebase(uid, local);
            LogService.info('EconomyService', 'New account: default economy pushed to Firebase.');
        } catch (e) {
            LogService.error('EconomyService', 'syncFromFirebase error:', e);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Application des Récompenses
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Applique un `MatchReward` calculé par le `RewardEngine` sur le profil du joueur.
     * Persiste en local (tous joueurs) et Firebase (joueurs authentifiés).
     *
     * @param reward  - Le résultat calculé par RewardEngine.calculate()
     * @param userId  - UID du joueur (pour Firebase sync)
     * @returns       - Le nouvel état économique complet
     */
    async applyReward(reward: MatchReward, userId?: string, profile?: EconomyProfileInfo): Promise<PlayerEconomy> {
        const current = await this.getEconomy();

        const updated: PlayerEconomy = {
            coins: current.coins + reward.coinsEarned,
            xp: reward.newXP,
            level: reward.newLevel,
            diamonds: current.diamonds + reward.diamondsEarned,
            leaguePoints: reward.newLeaguePoints,
            leagueGrade: reward.newGrade,
            // ─── Ligue des Cochons ───
            cochonsGiven: reward.newCochonsGiven,
            unlockedFrames: [
                ...new Set([
                    ...(current.unlockedFrames ?? []),
                    ...reward.newlyUnlockedFrames.map(e => e.frameId),
                ])
            ] as LeagueFrameId[],
            activeFrame: current.activeFrame ?? null,
            lastDailyRewardTimestamp: current.lastDailyRewardTimestamp,
        };

        this.cached = updated;
        await this.persistLocal();

        LogService.debug('EconomyService', 'Reward applied locally:', { coinsAdded: reward.coinsEarned, newCoins: updated.coins });

        // Sync Firebase pour les joueurs authentifiés (Fallback)
        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated, profile);
        }

        return { ...updated };
    }

    /**
     * Appelle le Serveur (Cloud Functions) pour générer la récompense de façon sécurisée.
     */
    async processServerReward(input: RewardCalculationInput, userId?: string, profile?: EconomyProfileInfo): Promise<MatchReward> {
        if (!userId || userId.startsWith('guest_')) {
            // Mode hors-ligne ou invité : on exécute en local
            LogService.info('EconomyService', 'Invité ou mode Solo: Calcul des récompenses en local.');
            const { RewardEngine } = require('../RewardEngine');
            const reward = RewardEngine.calculate(input);
            await this.applyReward(reward, userId, profile);
            return reward;
        }

        try {
            LogService.info('EconomyService', 'Appel du Banquier Serveur pour le calcul de récompense...');
            const functions = getFunctions();
            const processMatchRewardHook = httpsCallable<{ input: Partial<RewardCalculationInput> }, MatchReward>(functions, 'processMatchReward');

            const result = await processMatchRewardHook({ input });
            const reward = result.data;

            LogService.info('EconomyService', 'Réponse sécurisée du serveur :', reward);

            // Mise à jour de l'UI localement sans forcer un push Firebase qui écraserait la DB
            const current = await this.getEconomy();
            const updated: PlayerEconomy = {
                coins: current.coins + reward.coinsEarned,
                xp: reward.newXP,
                level: reward.newLevel,
                diamonds: current.diamonds + reward.diamondsEarned,
                leaguePoints: reward.newLeaguePoints,
                leagueGrade: reward.newGrade,
                // ─── Ligue des Cochons ───
                cochonsGiven: reward.newCochonsGiven,
                unlockedFrames: [
                    ...new Set([
                        ...(current.unlockedFrames ?? []),
                        ...reward.newlyUnlockedFrames.map(e => e.frameId),
                    ])
                ] as LeagueFrameId[],
                activeFrame: current.activeFrame ?? null,
                lastDailyRewardTimestamp: current.lastDailyRewardTimestamp,
            };
            this.cached = updated;
            await this.persistLocal(); // On sauvegarde juste dans le AsyncStorage pour l'application fluide

            // Sécurise la cohérence Firestore côté client après un calcul serveur réussi.
            // Si la Cloud Function n'écrit pas (ou pas complètement) economy.xp / economy.coins,
            // le leaderboard lirait des valeurs obsolètes.
            if (userId && !userId.startsWith('guest_')) {
                await this.pushToFirebase(userId, updated, profile);
            }

            return reward;

        } catch (e) {
            LogService.error('EconomyService', 'Erreur avec le Banquier Serveur, tentative de fallback :', e);

            if (this.shouldUseWebLocalRewardHttpFallback()) {
                try {
                    LogService.warn('EconomyService', 'Retry via processMatchRewardHttp pour Web local...');
                    const reward = await this.callProcessMatchRewardHttp(input);
                    if (userId && !userId.startsWith('guest_')) {
                        await this.syncFromFirebase(userId);
                        if (profile) {
                            await this.syncProfileMetadata(userId, profile.displayName, profile.avatarId);
                        }
                    }
                    return reward;
                } catch (httpFallbackError) {
                    LogService.error(
                        'EconomyService',
                        'Echec du fallback HTTP local processMatchReward, retour au calcul local :',
                        httpFallbackError
                    );
                }
            }

            const { RewardEngine } = require('../RewardEngine');
            const reward = RewardEngine.calculate(input);
            await this.applyReward(reward, userId, profile);
            return reward;
        }
    }


    /**
     * Déduit le buy-in avant le début d'une partie.
     * Retourne `false` si le joueur n'a pas assez de coins.
     */
    async deductBuyIn(buyIn: number, userId?: string, profile?: EconomyProfileInfo): Promise<boolean> {
        const current = await this.getEconomy();

        if (current.coins < buyIn) {
            LogService.warn('EconomyService', `Not enough coins. Have: ${current.coins}, Need: ${buyIn}`);
            return false;
        }

        const updated: PlayerEconomy = { ...current, coins: current.coins - buyIn };
        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated, profile);
        }

        LogService.debug('EconomyService', `Buy-in of ${buyIn} coins deducted. Remaining: ${updated.coins}`);
        return true;
    }

    /**
     * Vérifie si le joueur peut réclamer sa récompense quotidienne sans la créditer.
     * @returns true si la récompense est disponible (24h écoulées ou jamais réclamée)
     */
    async isDailyRewardAvailable(): Promise<boolean> {
        const current = await this.getEconomy();
        if (!current.lastDailyRewardTimestamp) return true;
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        return (Date.now() - current.lastDailyRewardTimestamp) >= TWENTY_FOUR_HOURS_MS;
    }

    /**
     * Équipe un cadre pour le joueur.
     * Met à jour localement et sur Firebase si authentifié.
     */
    async equipLeagueFrame(userId: string, frameId: LeagueFrameId | null): Promise<void> {
        const current = await this.getEconomy();
        
        // Vérification de sécurité (bien que l'UI empêche de cliquer)
        if (frameId && !(current.unlockedFrames || []).includes(frameId)) {
            LogService.warn('EconomyService', `Tentative d'équipement d'un cadre non débloqué: ${frameId}`);
            return;
        }

        const updated: PlayerEconomy = { ...current, activeFrame: frameId };
        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated);
        }

        LogService.debug('EconomyService', `Cadre équipé avec succès : ${frameId}`);
    }

    /**
     * Vérifie si le joueur peut réclamer sa récompense quotidienne (200 coins).
     * @returns Le montant gagné (200) ou null si déjà réclamé dans les 24h.
     */
    async checkAndClaimDailyReward(userId?: string, profile?: EconomyProfileInfo): Promise<number | null> {
        const current = await this.getEconomy();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

        const shouldReward = !current.lastDailyRewardTimestamp ||
            (Date.now() - current.lastDailyRewardTimestamp) >= TWENTY_FOUR_HOURS_MS;

        if (shouldReward) {
            const rewardAmount = DAILY_REWARD_COINS;

            const updated: PlayerEconomy = {
                ...current,
                coins: current.coins + rewardAmount,
                lastDailyRewardTimestamp: Date.now()
            };

            this.cached = updated;
            await this.persistLocal();

            if (userId && !userId.startsWith('guest_')) {
                await this.pushToFirebase(userId, updated, profile);
            }

            LogService.info('EconomyService', `Daily reward of ${rewardAmount} coins claimed!`);
            return rewardAmount;
        }

        return null;
    }

    /**
     * [R3-B9] Crédite la récompense quotidienne directement, sans re-vérifier les 24h.
     * À appeler UNIQUEMENT après confirmation que isDailyRewardAvailable() === true.
     * Evite la race condition entre l'affichage du modal et le clic sur "Réclamer".
     */
    async claimDailyRewardNow(userId?: string, profile?: EconomyProfileInfo): Promise<number> {
        const current = await this.getEconomy();
        const rewardAmount = DAILY_REWARD_COINS;

        const updated: PlayerEconomy = {
            ...current,
            coins: current.coins + rewardAmount,
            lastDailyRewardTimestamp: Date.now(),
        };

        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated, profile);
        }

        LogService.info('EconomyService', `[R3-B9] Daily reward of ${rewardAmount} coins claimed (force).`);
        return rewardAmount;
    }

    /**
     * [ADS-REWARD] Crédite le gain fixe post-match après visionnage volontaire d'une pub.
     * Montant fixe : AD_REWARD_COINS (100 coins).
     * Ne passe PAS par la Cloud Function — montant non critique, non manipulable via le jeu.
     * À appeler UNE seule fois par match (la guard est gérée côté UI via l'état adWatched).
     */
    async creditAdReward(userId?: string, profile?: EconomyProfileInfo): Promise<number> {
        const current = await this.getEconomy();
        const rewardAmount = AD_REWARD_COINS;

        const updated: PlayerEconomy = {
            ...current,
            coins: current.coins + rewardAmount,
        };

        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated, profile);
        }

        LogService.info('EconomyService', `[ADS-REWARD] +${rewardAmount} coins credited after ad view.`);
        return rewardAmount;
    }

    /**
     * Force une mise à jour directe de l'économie (utile pour les tests ou migrations).
     */
    async setEconomy(economy: Partial<PlayerEconomy>, userId?: string, profile?: EconomyProfileInfo): Promise<void> {
        const current = await this.getEconomy();
        const updated = this.mergeWithDefaults({ ...current, ...economy });
        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated, profile);
        }
    }

    /**
     * Écrit displayName et avatarId dans Firestore pour que le leaderboard
     * puisse afficher le vrai nom et l'avatar du joueur.
     * À appeler après signIn() ou signUp().
     * ⚠️ N'écrit JAMAIS les données économiques — Firestore est la source de vérité.
     */
    async syncProfileMetadata(uid: string, displayName: string, avatarId: string): Promise<void> {
        if (uid.startsWith('guest_')) return;
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, { displayName, avatarId }, { merge: true });
            LogService.info('EconomyService', 'Profile metadata synced.', displayName);
        } catch (e) {
            LogService.error('EconomyService', 'syncProfileMetadata error:', e);
        }
    }

    /**
     * Ouvre un écouteur temps réel sur l'économie du joueur dans Firestore.
     * Met à jour le cache local et notifie le callback à chaque changement.
     * Retourne la fonction d'unsubscribe — à appeler au logout ou unmount.
     *
     * ⚠️ Cet écouteur est STRICTEMENT en lecture. Il n'écrit jamais dans Firestore.
     *    Toute écriture depuis ici recréerait la race condition qu'on vient de corriger.
     */
    listenToEconomy(uid: string, onUpdate: (economy: PlayerEconomy) => void): () => void {
        if (uid.startsWith('guest_')) return () => {};

        const userRef = doc(db, 'users', uid);
        const unsubscribe = onSnapshot(
            userRef,
            async (snap) => {
                if (!snap.exists()) return;
                const remoteEconomy = snap.data().economy as Partial<PlayerEconomy> | undefined;
                if (!remoteEconomy) return;

                // [R3-B9] FIX : fusionner remote + local pour ne pas perdre lastDailyRewardTimestamp
                // mergeWithDefaults(remote) seul écrasait le timestamp local si Firestore était en retard.
                const local = await this.getEconomy();
                const merged = this.mergeEconomies(local, remoteEconomy);
                this.cached = merged;
                this.persistLocal();
                onUpdate({ ...merged });
                LogService.info('EconomyService', 'onSnapshot: economy updated in real-time.');
            },
            (error) => {
                LogService.error('EconomyService', 'listenToEconomy error:', error);
            }
        );

        return unsubscribe;
    }

    /**
     * Invalide le cache en mémoire (utile après déconnexion).
     */
    clearCache(): void {
        this.cached = null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ──────────────────────────────────────────────────────────────────────────

    private async persistLocal(): Promise<void> {
        if (!this.cached) return;
        try {
            await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.cached));
        } catch (e) {
            LogService.error('EconomyService', 'persistLocal error:', e);
        }
    }

    private async pushToFirebase(uid: string, economy: PlayerEconomy, profile?: EconomyProfileInfo): Promise<void> {
        try {
            const userRef = doc(db, 'users', uid);

            // Nettoyage des valeurs undefined pour éviter l'erreur Firestore
            const cleanEconomy = { ...economy };
            if (cleanEconomy.lastDailyRewardTimestamp === undefined) {
                delete cleanEconomy.lastDailyRewardTimestamp;
            }
            if (cleanEconomy.chatInventoryMigratedAt === undefined) {
                delete cleanEconomy.chatInventoryMigratedAt;
            }

            const payload: Record<string, any> = { economy: cleanEconomy };
            // Écrire displayName et avatarId si fournis, pour que le leaderboard
            // puisse afficher le vrai nom et l'avatar du joueur
            if (profile) {
                payload.displayName = profile.displayName;
                payload.avatarId = profile.avatarId;
            }
            await setDoc(userRef, payload, { merge: true });
            LogService.info('EconomyService', 'Economy pushed to Firebase.', profile ? `(with profile: ${profile.displayName})` : '');
        } catch (e) {
            LogService.error('EconomyService', 'pushToFirebase error:', e);
        }
    }

    /**
     * Fallback Firestore : si leagueGrade est un ancien grade (4 paliers) ou invalide,
     * on le recalcule depuis cochonsGiven.
     */
    private migrateGrade(raw: string | undefined, leaguePoints: number): LeagueGrade {
        const VALID: string[] = [
            'DEBUTANT',
            'APPRENTI_1', 'APPRENTI_2', 'APPRENTI_3',
            'MAITRE_1', 'MAITRE_2', 'MAITRE_3',
            'ROI', 'LEGENDE',
        ];
        if (raw && VALID.includes(raw)) return raw as LeagueGrade;
        return getLeagueGrade(leaguePoints); // peut retourner null
    }

    /**
     * Fusionne deux économies.
     * Pour les pièces/diamants, on fait confiance au serveur (SEC-3).
     * Pour l'XP/Points de ligue, on prend le maximum pour éviter la frustration.
     */
    private mergeEconomies(local: PlayerEconomy, remote: Partial<PlayerEconomy>): PlayerEconomy {
        const mergedXP = Math.max(local.xp, remote.xp ?? 0);
        const mergedLeaguePoints = Math.max(local.leaguePoints, remote.leaguePoints ?? 0);
        
        return {
            // SEC-3 : Ne pas utiliser Math.max sur les pièces/diamants pour éviter la triche côté client via AsyncStorage
            coins: remote.coins !== undefined ? remote.coins : local.coins,
            diamonds: remote.diamonds !== undefined ? remote.diamonds : local.diamonds,
            xp: mergedXP,
            level: getLevelFromXP(mergedXP),
            leaguePoints: mergedLeaguePoints,
            leagueGrade: getLeagueGrade(mergedLeaguePoints),
            // ─── Ligue des Cochons (conservation des champs) ───
            // [TECH-DEBT-COCHONS] Firestore = source de vérité unique. On NE prend PLUS le max
            // entre local et remote pour éviter qu'un cache obsolète fige une valeur ancienne
            // après une migration ou un fix admin.
            cochonsGiven: remote.cochonsGiven ?? local.cochonsGiven ?? 0,
            unlockedFrames: remote.unlockedFrames ?? local.unlockedFrames ?? [],
            activeFrame: remote.activeFrame !== undefined ? remote.activeFrame : local.activeFrame ?? null,
            lastDailyRewardTimestamp: Math.max(
                local.lastDailyRewardTimestamp ?? 0,
                remote.lastDailyRewardTimestamp ?? 0
            ) || undefined,
            // ─── Tchat (inventaire consommable) ───
            unlockedChatItems: remote.unlockedChatItems ?? local.unlockedChatItems ?? [],
            chatInventory: remote.chatInventory ?? local.chatInventory ?? {},
            chatInventoryMigratedAt: remote.chatInventoryMigratedAt ?? local.chatInventoryMigratedAt,
        };
    }

    /**
     * Assure que tous les champs sont présents (migration des anciens profils).
     */
    private mergeWithDefaults(partial: Partial<PlayerEconomy>): PlayerEconomy {
        const xp = partial.xp ?? DEFAULT_ECONOMY.xp;
        const leaguePoints = partial.leaguePoints ?? DEFAULT_ECONOMY.leaguePoints;
        return {
            coins: partial.coins ?? DEFAULT_ECONOMY.coins,
            xp,
            level: partial.level ?? getLevelFromXP(xp),
            diamonds: partial.diamonds ?? DEFAULT_ECONOMY.diamonds,
            leaguePoints,
            leagueGrade: this.migrateGrade(partial.leagueGrade, leaguePoints),
            // ─── Ligue des Cochons (migration: valeurs par défaut pour les anciens profils) ───
            cochonsGiven: partial.cochonsGiven ?? 0,
            unlockedFrames: (partial.unlockedFrames as LeagueFrameId[]) ?? [],
            activeFrame: (partial.activeFrame as LeagueFrameId | null) ?? null,
            lastDailyRewardTimestamp: partial.lastDailyRewardTimestamp,
            // ─── Tchat (inventaire consommable) ───
            unlockedChatItems: partial.unlockedChatItems ?? [],
            chatInventory: partial.chatInventory ?? {},
            chatInventoryMigratedAt: partial.chatInventoryMigratedAt,
        };
    }
}

export const economyService = new EconomyService();
