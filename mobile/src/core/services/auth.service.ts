
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../types';

const STORAGE_KEY_SESSION = '@user_session_active';
const STORAGE_KEY_GUEST_PROFILE = '@guest_profile_data';

class AuthService {
    private currentUser: PlayerProfile | null = null;

    /**
     * Generate a random guest ID
     */
    private generateGuestId(): string {
        return 'guest_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Login as Guest
     * - Checks if a Guest Profile already exists.
     * - If YES: Loads it and marks session as active.
     * - If NO: Creates a new one, saves it, and marks session as active.
     */
    async loginAsGuest(): Promise<PlayerProfile> {
        let guestUser: PlayerProfile | null = null;

        try {
            // 1. Check for existing guest profile
            const existingProfileJson = await AsyncStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
            if (existingProfileJson) {
                guestUser = JSON.parse(existingProfileJson);
            }
        } catch (error) {
            console.warn('Failed to load existing guest profile', error);
        }

        if (!guestUser) {
            // 2. Create new guest profile if none exists
            guestUser = {
                uid: this.generateGuestId(),
                displayName: 'Invité',
                avatarUrl: undefined, // Default avatar will be used
                gamesPlayed: 0,
                gamesWon: 0,
            };
            // Persist the new profile
            await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(guestUser));
        }

        // 3. Activate Session (using the Guest User)
        await this.activateSession(guestUser);
        return guestUser;
    }

    /**
     * Mark session as active and update memory
     */
    private async activateSession(user: PlayerProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_SESSION, 'true'); // Simple marker
            // We rely on the Guest Profile being stored Separately, but for performance, we keep `currentUser` in memory
            this.currentUser = user;
        } catch (error) {
            console.error('Failed to activate session', error);
        }
    }

    /**
     * Get current logged in user
     * - Checks if Session is Active.
     * - If Session Active -> Loads Guest Profile.
     */
    async getCurrentUser(): Promise<PlayerProfile | null> {
        if (this.currentUser) return this.currentUser;

        try {
            const isSessionActive = await AsyncStorage.getItem(STORAGE_KEY_SESSION);

            if (isSessionActive === 'true') {
                // Session is active, load the Guest Profile
                const guestProfileJson = await AsyncStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
                if (guestProfileJson) {
                    this.currentUser = JSON.parse(guestProfileJson);
                    return this.currentUser;
                }
            }
        } catch (error) {
            console.error('Failed to load session/user', error);
        }

        return null;
    }

    /**
     * Logout
     * - Clears the Session Marker.
     * - KEEPS the Guest Profile Data (stats, etc.).
     */
    async logout(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
            this.currentUser = null;
        } catch (error) {
            console.error('Failed to logout', error);
        }
    }

    /**
     * Update user stats
     * - Updates memory AND the persisted Guest Profile.
     */
    async updateStats(stats: Partial<PlayerProfile>): Promise<void> {
        if (!this.currentUser) return;

        // Update in-memory
        this.currentUser = { ...this.currentUser, ...stats };

        // Persist updates to the Guest Profile
        try {
            await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('Failed to update stats', error);
        }
    }
}

export const authService = new AuthService();
