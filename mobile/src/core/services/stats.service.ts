import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PLAYER_STATS = '@player_stats';

export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    totalCochonsInflicted: number;
    totalPointsAccumulated: number;
}

const DEFAULT_STATS: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    totalCochonsInflicted: 0,
    totalPointsAccumulated: 0,
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
     * Call this when phase === 'MATCH_END'.
     *
     * @param isWinner   Did the current player win the match?
     * @param cochons    Number of cochons the player inflicted during this match
     * @param points     Total points accumulated during this match
     */
    async recordMatchResult(isWinner: boolean, cochons: number, points: number): Promise<void> {
        const stats = await this.getStats();

        stats.gamesPlayed += 1;
        if (isWinner) stats.gamesWon += 1;
        stats.totalCochonsInflicted += cochons;
        stats.totalPointsAccumulated += points;

        this.cachedStats = stats;
        await this.persistStats();

        console.log('📊 Stats updated:', stats);
    }

    /**
     * Reset all stats (for debug/testing)
     */
    async resetStats(): Promise<void> {
        this.cachedStats = { ...DEFAULT_STATS };
        await this.persistStats();
    }
}

export const statsService = new StatsService();
