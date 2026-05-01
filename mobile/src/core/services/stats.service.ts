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
    roundsWon?: number;       // Manches gagnées dans le match
    leaguePointsEarned?: number; // Points Ligue du match : 5 / 4 / 2 / 1 / -1
    mancheLeaguePointsEarned?: number[]; // Résultats de chaque manche : 5 / 4 / 2 / 1 / -1
}

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalCochonsInflicted: number;
    totalCochonsSubis: number; // Manches où le joueur a pris -1 (cochon reçu)
    totalPointsAccumulated: number;
    totalRoundsWon: number;
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
    totalRoundsWon: 0,
    totalCochonsInflicted: 0,
    totalCochonsSubis: 0,
    totalPointsAccumulated: 0,
    matchHistory: [],
    // Economy defaults
    coins: 0,
    xp: 0,
    level: 1,
    diamonds: 0,
    leaguePoints: 0,
    leagueGrade: null,
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
                    totalRoundsWon: parsed.totalRoundsWon ?? 0,
                    totalCochonsInflicted: parsed.totalCochonsInflicted ?? 0,
                    totalCochonsSubis: parsed.totalCochonsSubis ?? 0,
                    totalPointsAccumulated: parsed.totalPointsAccumulated ?? 0,
                    matchHistory: parsed.matchHistory ?? [],
                    // Economy fields — fallback to 0/defaults for old persisted data
                    coins: parsed.coins ?? 0,
                    xp: parsed.xp ?? 0,
                    level: parsed.level ?? 1,
                    diamonds: parsed.diamonds ?? 0,
                    leaguePoints: parsed.leaguePoints ?? 0,
                    leagueGrade: parsed.leagueGrade ?? 'APPRENTI_1',
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
        roundsWon?: number;
        leaguePointsEarned?: number; // -1 / 1 / 2 / 4 / 5 pts ligue
        mancheLeaguePointsEarned?: number[];
        opponents: { name: string; avatarId: string }[];
        mode: string;
        userId?: string; // Optional: sync immediately if provided
    }): Promise<void> {
        const stats = await this.getStats();
        const { result, cochons, points, roundsWon = 0, leaguePointsEarned, mancheLeaguePointsEarned, opponents, mode, userId } = params;

        stats.gamesPlayed += 1;
        if (result === 'WIN') stats.gamesWon += 1;
        stats.totalRoundsWon += roundsWon;
        stats.totalCochonsInflicted += cochons;
        stats.totalPointsAccumulated += points;

        // Cochons subis : compter les -1 dans mancheLeaguePointsEarned, fallback sur leaguePointsEarned
        const cochonsSubisCeMatch = mancheLeaguePointsEarned?.length
            ? mancheLeaguePointsEarned.filter(v => v === -1).length
            : (leaguePointsEarned === -1 ? 1 : 0);
        stats.totalCochonsSubis = (stats.totalCochonsSubis ?? 0) + cochonsSubisCeMatch;

        // Add to history (keep last 100)
        const newRecord: MatchRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            result,
            score: points,
            cochons: cochons,
            roundsWon,
            leaguePointsEarned,
            mancheLeaguePointsEarned,
            opponents,
            mode
        };

        stats.matchHistory = [newRecord, ...stats.matchHistory].slice(0, 100);

        this.cachedStats = stats;
        await this.persistStats();

        console.log('📊 Stats updated with history:', stats);

        // ✅ FIX [2026-04-15]: Removed leaguePoints override here.
        // Previously, this was setting leaguePoints = stats.totalCochonsInflicted (local AsyncStorage value),
        // which would OVERWRITE the Firebase value with a local counter that resets on reinstall.
        // leaguePoints are now managed EXCLUSIVELY by RewardEngine via processServerReward() in GameScreen.
        // This prevents race conditions and ensures Firebase remains the single source of truth.

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
                    totalRoundsWon: stats.totalRoundsWon,
                    totalCochonsInflicted: stats.totalCochonsInflicted,
                    totalCochonsSubis: stats.totalCochonsSubis ?? 0,
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
                    // MIGRATION LOGIC & BUG FIX [2026-04-15]:
                    // The old Math.max approach compounded stats generated from the double-recording bug (which recorded every manche as a match).
                    // We now strictly rebuild gamesPlayed, gamesWon, and totalPointsAccumulated directly from the merged matchHistory, 
                    // which contains the true canonical record of the matches.
                    // (Max history is 20, but this cleanly fixes the bloated numbers for testers).
                    const mergedHistory = this.mergeMatchHistories(localStats.matchHistory, remoteData.matchHistory || []);
                    
                    let realGamesPlayed = mergedHistory.length;
                    let realGamesWon = 0;
                    let realPoints = 0;
                    let realRoundsWon = 0;
                    mergedHistory.forEach(record => {
                        if (record.result === 'WIN') realGamesWon++;
                        realPoints += (record.score || 0);
                        realRoundsWon += (record.roundsWon || 0);
                    });

                    const mergedStats: PlayerStats = {
                        gamesPlayed: realGamesPlayed,
                        gamesWon: realGamesWon,
                        totalRoundsWon: Math.max(localStats.totalRoundsWon || 0, remoteData.totalRoundsWon || 0, realRoundsWon),
                        // Note: We leave totalCochonsInflicted here but UI now reads economy.cochonsGiven 
                        // because economy is the verified source of truth via Cloud Functions.
                        totalCochonsInflicted: Math.max(localStats.totalCochonsInflicted, remoteData.totalCochonsInflicted || 0),
                        totalCochonsSubis: Math.max(localStats.totalCochonsSubis ?? 0, remoteData.totalCochonsSubis || 0),
                        totalPointsAccumulated: realPoints,
                        matchHistory: mergedHistory,
                        // Firestore est source de vérité pour les champs économiques.
                        // Ne jamais utiliser Math.max ici : ça empêcherait l'admin de corriger un solde.
                        coins: remoteData.coins ?? localStats.coins,
                        xp: remoteData.xp ?? localStats.xp,
                        level: remoteData.level ?? localStats.level,
                        diamonds: remoteData.diamonds ?? localStats.diamonds,
                        leaguePoints: remoteData.leaguePoints ?? localStats.leaguePoints,
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
            .slice(0, 100);
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
