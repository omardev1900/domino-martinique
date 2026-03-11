import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PlayerInventory } from '../store.types';
import { DEFAULT_INVENTORY } from '../store.constants';
import { economyService } from './economy.service';

const STORAGE_KEY_PLAYER_STATS = '@player_stats';

export interface MatchRecord {
    id: string;
    timestamp: number;
    result: 'WIN' | 'LOSS' | 'DRAW';
    score: number;
    cochons: number;
    opponents: { name: string; avatarId: string }[];
    mode: string;
}

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalCochonsInflicted: number;
    totalPointsAccumulated: number;
    matchHistory: MatchRecord[];
    // ─── Economy & Progression ───
    coins: number;
    xp: number;
    level: number;
    diamonds: number;
    leaguePoints: number;
    leagueGrade: string;
    inventory: PlayerInventory;
}

const DEFAULT_STATS: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalCochonsInflicted: 0,
    totalPointsAccumulated: 0,
    matchHistory: [],
    // Economy defaults
    coins: 0,
    xp: 0,
    level: 1,
    diamonds: 0,
    leaguePoints: 0,
    leagueGrade: 'APPRENTI',
    inventory: DEFAULT_INVENTORY,
};

class StatsService {
    private cachedStats: PlayerStats | null = null;

    /**
     * Load stats from AsyncStorage (or return cached)
     */
    async getStats(): Promise<PlayerStats> {
        if (this.cachedStats) return { ...this.cachedStats };

        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY_PLAYER_STATS);
            if (json) {
                const parsed = JSON.parse(json);
                this.cachedStats = {
                    gamesPlayed: parsed.gamesPlayed ?? 0,
                    gamesWon: parsed.gamesWon ?? 0,
                    totalCochonsInflicted: parsed.totalCochonsInflicted ?? 0,
                    totalPointsAccumulated: parsed.totalPointsAccumulated ?? 0,
                    matchHistory: parsed.matchHistory ?? [],
                    // Economy fields — fallback to 0/defaults for old persisted data
                    coins: parsed.coins ?? 0,
                    xp: parsed.xp ?? 0,
                    level: parsed.level ?? 1,
                    diamonds: parsed.diamonds ?? 0,
                    leaguePoints: parsed.leaguePoints ?? 0,
                    leagueGrade: parsed.leagueGrade ?? 'APPRENTI',
                    inventory: parsed.inventory ?? DEFAULT_INVENTORY,
                };
            } else {
                this.cachedStats = { ...DEFAULT_STATS };
            }
        } catch (error) {
            console.error('📊 StatsService: Failed to load stats', error);
            this.cachedStats = { ...DEFAULT_STATS };
        }

        return { ...this.cachedStats };
    }

    /**
     * Save stats to AsyncStorage
     */
    private async persistStats(): Promise<void> {
        if (!this.cachedStats) return;
        try {
            await AsyncStorage.setItem(STORAGE_KEY_PLAYER_STATS, JSON.stringify(this.cachedStats));
        } catch (error) {
            console.error('📊 StatsService: Failed to save stats', error);
        }
    }

    /**
     * Record the result of a completed match.
     */
    async recordMatchResult(params: {
        result: 'WIN' | 'LOSS' | 'DRAW';
        cochons: number;
        points: number;
        opponents: { name: string; avatarId: string }[];
        mode: string;
        userId?: string; // Optional: sync immediately if provided
    }): Promise<void> {
        const stats = await this.getStats();
        const { result, cochons, points, opponents, mode, userId } = params;

        stats.gamesPlayed += 1;
        if (result === 'WIN') stats.gamesWon += 1;
        stats.totalCochonsInflicted += cochons;
        stats.totalPointsAccumulated += points;

        // Add to history (keep last 20)
        const newRecord: MatchRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            result,
            score: points,
            cochons: cochons,
            opponents,
            mode
        };

        stats.matchHistory = [newRecord, ...stats.matchHistory].slice(0, 20);

        this.cachedStats = stats;
        await this.persistStats();

        console.log('📊 Stats updated with history:', stats);

        // Synchroniser leaguePoints avec totalCochonsInflicted
        // pour que le leaderboard "Cochons" affiche la même valeur que la page stats
        await economyService.setEconomy(
            { leaguePoints: stats.totalCochonsInflicted },
            userId
        );

        // If logged in, sync to Firebase
        if (userId && !userId.startsWith('guest_')) {
            await this.pushStatsToFirebase(userId, stats);
        }
    }

    /**
     * Pushes current stats to Firestore
     */
    async pushStatsToFirebase(uid: string, stats: PlayerStats): Promise<void> {
        if (uid.startsWith('guest_')) return;

        try {
            const userRef = doc(db, 'users', uid);
            // Use setDoc with merge to handle both new and existing documents
            await setDoc(userRef, {
                stats: {
                    gamesPlayed: stats.gamesPlayed,
                    gamesWon: stats.gamesWon,
                    totalCochonsInflicted: stats.totalCochonsInflicted,
                    totalPointsAccumulated: stats.totalPointsAccumulated,
                    matchHistory: stats.matchHistory,
                    // Economy fields
                    coins: stats.coins,
                    xp: stats.xp,
                    level: stats.level,
                    diamonds: stats.diamonds,
                    leaguePoints: stats.leaguePoints,
                    leagueGrade: stats.leagueGrade,
                    lastSync: Date.now()
                }
            }, { merge: true });
            console.log('☁️ Stats synced to Firebase');
        } catch (error) {
            console.error('❌ Failed to push stats to Firebase:', error);
        }
    }

    /**
     * Syncs local stats with Firebase. 
     * Typically called after login/signup.
     */
    async syncWithFirebase(uid: string): Promise<void> {
        if (uid.startsWith('guest_')) return;

        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const localStats = await this.getStats();

            if (userSnap.exists()) {
                const remoteData = userSnap.data().stats;
                if (remoteData) {
                    // MIGRATION LOGIC: 
                    // We sum numerical stats and merge histories
                    const mergedStats: PlayerStats = {
                        gamesPlayed: Math.max(localStats.gamesPlayed, remoteData.gamesPlayed || 0),
                        gamesWon: Math.max(localStats.gamesWon, remoteData.gamesWon || 0),
                        totalCochonsInflicted: Math.max(localStats.totalCochonsInflicted, remoteData.totalCochonsInflicted || 0),
                        totalPointsAccumulated: Math.max(localStats.totalPointsAccumulated, remoteData.totalPointsAccumulated || 0),
                        matchHistory: this.mergeMatchHistories(localStats.matchHistory, remoteData.matchHistory || []),
                        // Economy — take the max (server is source of truth if higher)
                        coins: Math.max(localStats.coins, remoteData.coins || 0),
                        xp: Math.max(localStats.xp, remoteData.xp || 0),
                        level: Math.max(localStats.level, remoteData.level || 1),
                        diamonds: Math.max(localStats.diamonds, remoteData.diamonds || 0),
                        leaguePoints: Math.max(localStats.leaguePoints, remoteData.leaguePoints || 0),
                        leagueGrade: remoteData.leagueGrade || localStats.leagueGrade,
                        inventory: remoteData.inventory || localStats.inventory,
                    };

                    this.cachedStats = mergedStats;
                    await this.persistStats();
                    await this.pushStatsToFirebase(uid, mergedStats);
                    console.log('🔄 Stats synchronized and merged with Firebase');
                    return;
                }
            }

            // If no remote data, just push local stats
            await this.pushStatsToFirebase(uid, localStats);
            console.log('⬆️ Initial stats pushed to Firebase');

        } catch (error) {
            console.error('❌ StatsService: Sync failed', error);
        }
    }

    /**
     * Helper to merge match histories and remove duplicates by ID
     */
    private mergeMatchHistories(local: MatchRecord[], remote: MatchRecord[]): MatchRecord[] {
        const combined = [...local, ...remote];
        const seen = new Set();
        return combined
            .filter(item => {
                const duplicate = seen.has(item.id);
                seen.add(item.id);
                return !duplicate;
            })
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);
    }

    /**
     * Reset all stats (for debug/testing)
     */
    async resetStats(): Promise<void> {
        this.cachedStats = { ...DEFAULT_STATS };
        await this.persistStats();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Inventory Updates
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Updates the player's inventory (owned items and equipped cosmetics).
     */
    async updateInventory(newInventory: PlayerInventory, uid?: string): Promise<void> {
        if (!this.cachedStats) return;

        this.cachedStats.inventory = newInventory;
        await this.persistStats();

        if (uid && !uid.startsWith('guest_')) {
            try {
                const userRef = doc(db, 'users', uid);
                // We merge only the stats.inventory field
                await setDoc(userRef, { stats: { inventory: newInventory } }, { merge: true });
                console.log('🛍️ [StatsService] Inventory synced to Firebase.');
            } catch (error) {
                console.error('🛍️ [StatsService] Failed to sync inventory to Firebase', error);
            }
        }
    }
}

export const statsService = new StatsService();
