
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile as updateFirebaseProfile,
    User
} from 'firebase/auth';
import { auth } from './firebase';
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
     */
    async loginAsGuest(): Promise<PlayerProfile> {
        let guestUser: PlayerProfile | null = null;

        try {
            const existingProfileJson = await AsyncStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
            if (existingProfileJson) {
                guestUser = JSON.parse(existingProfileJson);
            }
        } catch (error) {
            console.warn('Failed to load existing guest profile', error);
        }

        if (!guestUser) {
            guestUser = {
                uid: this.generateGuestId(),
                displayName: 'Invité',
                avatarUrl: undefined,
                avatarId: undefined,
                gamesPlayed: 0,
                gamesWon: 0,
            };
            await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(guestUser));
        }

        await this.activateSession(guestUser);
        return guestUser;
    }

    /**
     * Firebase Sign In
     */
    async signIn(email: string, pass: string): Promise<PlayerProfile> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            const profile = this.mapFirebaseUserToProfile(user);
            await this.activateSession(profile);
            return profile;
        } catch (error) {
            console.error('Sign In Error:', error);
            throw error;
        }
    }

    /**
     * Firebase Sign Up
     */
    async signUp(email: string, pass: string): Promise<PlayerProfile> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            const profile = this.mapFirebaseUserToProfile(user);
            await this.activateSession(profile);
            return profile;
        } catch (error) {
            console.error('Sign Up Error:', error);
            throw error;
        }
    }

    private mapFirebaseUserToProfile(user: User): PlayerProfile {
        return {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Joueur',
            email: user.email || undefined,
            avatarUrl: user.photoURL || undefined,
            avatarId: user.photoURL || undefined, // Sync avatarId with photoURL (Emoji)
            gamesPlayed: 0,
            gamesWon: 0
        };
    }

    /**
     * Mark session as active and update memory
     */
    private async activateSession(user: PlayerProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_SESSION, 'true');
            this.currentUser = user;
        } catch (error) {
            console.error('Failed to activate session', error);
        }
    }

    /**
     * Get current logged in user
     * Waits for Firebase Auth to initialize before checking
     */
    async getCurrentUser(): Promise<PlayerProfile | null> {
        if (this.currentUser) return this.currentUser;

        try {
            // Check session marker
            const isSessionActive = await AsyncStorage.getItem(STORAGE_KEY_SESSION);

            if (isSessionActive === 'true') {
                // Wait for Firebase Auth to initialize (important for persistence)
                console.log('🔄 Waiting for Firebase Auth to initialize...');
                const firebaseUser = await new Promise<User | null>((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged((user) => {
                        unsubscribe(); // Unsubscribe immediately after first call
                        if (user) {
                            console.log(`🔥 Firebase Auth restored session for: ${user.uid}`);
                        } else {
                            console.log('🔥 Firebase Auth: No persisted session found');
                        }
                        resolve(user);
                    });
                });

                // Priority 1: Check Firebase Auth state
                if (firebaseUser) {
                    this.currentUser = this.mapFirebaseUserToProfile(firebaseUser);
                    return this.currentUser;
                }

                // Priority 2: Fallback to Guest Profile (Local)
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
     */
    async logout(): Promise<void> {
        try {
            await signOut(auth); // Sign out from Firebase
            await AsyncStorage.removeItem(STORAGE_KEY_SESSION); // Clear session marker
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

        this.currentUser = { ...this.currentUser, ...stats };

        // Only persist to Guest Profile if it looks like a guest ID
        if (this.currentUser.uid.startsWith('guest_')) {
            try {
                await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(this.currentUser));
            } catch (error) {
                console.error('Failed to update guest stats', error);
            }
        }
    }

    /**
     * Update User Profile (Unified: Guest & Firebase)
     */
    async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
        if (!this.currentUser) return;

        // 1. Update Local State
        const profileUpdates: Partial<PlayerProfile> = {
            ...(updates.displayName && { displayName: updates.displayName }),
            ...(updates.photoURL !== undefined && { avatarUrl: updates.photoURL, avatarId: updates.photoURL })
        };
        this.currentUser = { ...this.currentUser, ...profileUpdates };

        try {
            // 2. Handle Guest Persistence
            if (this.currentUser.uid.startsWith('guest_')) {
                await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, JSON.stringify(this.currentUser));
            }

            // 3. Handle Firebase Persistence
            else if (auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, {
                    displayName: updates.displayName,
                    photoURL: updates.photoURL
                });
            }
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    }
}

export const authService = new AuthService();
