
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../types';

const STORAGE_KEY = '@user_session';

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
     * Creates a new guest profile if none exists, or arguably just creates a fresh one.
     * For now, we create a fresh one.
     */
    async loginAsGuest(): Promise<PlayerProfile> {
        const guestUser: PlayerProfile = {
            uid: this.generateGuestId(),
            displayName: 'Invité',
            avatarUrl: undefined, // Default avatar will be used
            gamesPlayed: 0,
            gamesWon: 0,
        };

        await this.saveSession(guestUser);
        return guestUser;
    }

    /**
     * Save user session to local storage
     */
    private async saveSession(user: PlayerProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            this.currentUser = user;
        } catch (error) {
            console.error('Failed to save session', error);
        }
    }

    /**
     * Get current logged in user from memory or storage
     */
    async getCurrentUser(): Promise<PlayerProfile | null> {
        if (this.currentUser) return this.currentUser;

        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            if (jsonValue != null) {
                this.currentUser = JSON.parse(jsonValue);
                return this.currentUser;
            }
        } catch (error) {
            console.error('Failed to load session', error);
        }
        return null;
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            this.currentUser = null;
        } catch (error) {
            console.error('Failed to logout', error);
        }
    }

    /**
     * Update user stats
     */
    async updateStats(stats: Partial<PlayerProfile>): Promise<void> {
        if (!this.currentUser) return;

        const updatedUser = { ...this.currentUser, ...stats };
        await this.saveSession(updatedUser);
    }
}

export const authService = new AuthService();
