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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PlayerEconomy, MatchReward, LeagueGrade } from '../economy.types';
import { NEW_PLAYER_COINS, DAILY_REWARD_COINS } from '../economy.constants';
import { getLevelFromXP, getLeagueGrade } from '../RewardEngine';

const STORAGE_KEY_ECONOMY = '@player_economy';

// ─── Valeur par défaut pour nouveau joueur ───────────────────────────────────

const DEFAULT_ECONOMY: PlayerEconomy = {
    coins: NEW_PLAYER_COINS, // 🪙 Cadeau de bienvenue
    xp: 0,
    level: 1,
    diamonds: 0,
    leaguePoints: 0,
    leagueGrade: 'APPRENTI',
};

// ─────────────────────────────────────────────────────────────────────────────

class EconomyService {
    private cached: PlayerEconomy | null = null;

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
            const json = await AsyncStorage.getItem(STORAGE_KEY_ECONOMY);
            if (json) {
                const parsed = JSON.parse(json);
                // Migration : s'assurer que tous les champs sont présents
                this.cached = this.mergeWithDefaults(parsed);
            } else {
                // Nouveau joueur → cadeau de bienvenue
                this.cached = { ...DEFAULT_ECONOMY };
                await this.persistLocal();
                console.log('🎁 [EconomyService] New player: welcome bonus applied.');
            }
        } catch (e) {
            console.error('[EconomyService] getEconomy error:', e);
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
                const remoteEconomy = snap.data().economy as Partial<PlayerEconomy> | undefined;
                if (remoteEconomy) {
                    const local = await this.getEconomy();
                    // Prendre le maximum (évite la perte de données si offline)
                    const merged = this.mergeEconomies(local, remoteEconomy);
                    this.cached = merged;
                    await this.persistLocal();
                    console.log('🔄 [EconomyService] Economy synced from Firebase.');
                    return;
                }
            }

            // Aucune donnée remote → push les données locales
            const local = await this.getEconomy();
            await this.pushToFirebase(uid, local);
            console.log('⬆️ [EconomyService] Local economy pushed to Firebase.');
        } catch (e) {
            console.error('[EconomyService] syncFromFirebase error:', e);
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
    async applyReward(reward: MatchReward, userId?: string): Promise<PlayerEconomy> {
        const current = await this.getEconomy();

        const updated: PlayerEconomy = {
            coins: current.coins + reward.coinsEarned,
            xp: reward.newXP,
            level: reward.newLevel,
            diamonds: current.diamonds + reward.diamondsEarned,
            leaguePoints: reward.newLeaguePoints,
            leagueGrade: reward.newGrade,
        };

        this.cached = updated;
        await this.persistLocal();

        console.log('[EconomyService] Reward applied:', {
            coinsAdded: reward.coinsEarned,
            newCoins: updated.coins,
            xpAdded: reward.xpEarned,
            newLevel: updated.level,
            leveledUp: reward.leveledUp,
            newGrade: updated.leagueGrade,
            gradeUp: reward.gradeUp,
        });

        // Sync Firebase pour les joueurs authentifiés
        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated);
        }

        return { ...updated };
    }


    /**
     * Déduit le buy-in avant le début d'une partie.
     * Retourne `false` si le joueur n'a pas assez de coins.
     */
    async deductBuyIn(buyIn: number, userId?: string): Promise<boolean> {
        const current = await this.getEconomy();

        if (current.coins < buyIn) {
            console.warn(`[EconomyService] Not enough coins. Have: ${current.coins}, Need: ${buyIn}`);
            return false;
        }

        const updated: PlayerEconomy = { ...current, coins: current.coins - buyIn };
        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated);
        }

        console.log(`[EconomyService] Buy-in of ${buyIn} coins deducted. Remaining: ${updated.coins}`);
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
     * Vérifie si le joueur peut réclamer sa récompense quotidienne (300 coins).
     * @returns Le montant gagné (300) ou null si déjà réclamé dans les 24h.
     */
    async checkAndClaimDailyReward(userId?: string): Promise<number | null> {
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
                await this.pushToFirebase(userId, updated);
            }

            console.log(`🎁 [EconomyService] Daily reward of ${rewardAmount} coins claimed!`);
            return rewardAmount;
        }

        return null;
    }

    /**
     * Force une mise à jour directe de l'économie (utile pour les tests ou migrations).
     */
    async setEconomy(economy: Partial<PlayerEconomy>, userId?: string): Promise<void> {
        const current = await this.getEconomy();
        const updated = this.mergeWithDefaults({ ...current, ...economy });
        this.cached = updated;
        await this.persistLocal();

        if (userId && !userId.startsWith('guest_')) {
            await this.pushToFirebase(userId, updated);
        }
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
            await AsyncStorage.setItem(STORAGE_KEY_ECONOMY, JSON.stringify(this.cached));
        } catch (e) {
            console.error('[EconomyService] persistLocal error:', e);
        }
    }

    private async pushToFirebase(uid: string, economy: PlayerEconomy): Promise<void> {
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, { economy }, { merge: true });
            console.log('☁️ [EconomyService] Economy pushed to Firebase.');
        } catch (e) {
            console.error('[EconomyService] pushToFirebase error:', e);
        }
    }

    /**
     * Fusionne deux économies en prenant le maximum de chaque champ numérique.
     * Stratégie "optimiste" : le joueur garde toujours le meilleur score.
     */
    private mergeEconomies(local: PlayerEconomy, remote: Partial<PlayerEconomy>): PlayerEconomy {
        const mergedXP = Math.max(local.xp, remote.xp ?? 0);
        const mergedLeaguePoints = Math.max(local.leaguePoints, remote.leaguePoints ?? 0);
        // Conserver le timestamp le plus récent pour éviter de re-déclencher la récompense
        const mergedTimestamp = Math.max(
            local.lastDailyRewardTimestamp ?? 0,
            remote.lastDailyRewardTimestamp ?? 0
        ) || undefined;
        return {
            coins: Math.max(local.coins, remote.coins ?? 0),
            xp: mergedXP,
            level: getLevelFromXP(mergedXP),
            diamonds: Math.max(local.diamonds, remote.diamonds ?? 0),
            leaguePoints: mergedLeaguePoints,
            leagueGrade: getLeagueGrade(mergedLeaguePoints),
            lastDailyRewardTimestamp: mergedTimestamp,
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
            leagueGrade: (partial.leagueGrade as LeagueGrade) ?? getLeagueGrade(leaguePoints),
            lastDailyRewardTimestamp: partial.lastDailyRewardTimestamp,
        };
    }
}

export const economyService = new EconomyService();
