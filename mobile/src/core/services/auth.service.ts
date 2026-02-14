
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
import { statsService } from './stats.service';

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

                // FIX: Restore avatarUrl from avatarId if missing (JSON.stringify drops undefined)
                if (guestUser && !guestUser.avatarUrl && guestUser.avatarId) {
                    guestUser.avatarUrl = guestUser.avatarId;
                }

                // MIGRATION: Only force default avatar for truly new/invalid accounts
                // Don't overwrite custom avatars!
                if (guestUser) {
                    const isGuestId = guestUser.uid.startsWith('guest_');
                    // Only migrate if NO avatarId at all OR it's the old 'avatar_01' default
                    const needsMigration = !guestUser.avatarId || guestUser.avatarId === 'avatar_01';

                    if (isGuestId && needsMigration) {
                        console.log('[AuthService] Migrating guest avatar to avatar_default');
                        guestUser.avatarId = 'avatar_default';
                        guestUser.avatarUrl = 'avatar_default';
                        await this.saveGuestProfile(guestUser);
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load existing guest profile', error);
        }

        if (!guestUser) {
            guestUser = {
                uid: this.generateGuestId(),
                displayName: 'Invité',
                avatarUrl: 'avatar_default',
                avatarId: 'avatar_default',
                gamesPlayed: 0,
                gamesWon: 0,
            };
            await this.saveGuestProfile(guestUser);
        }

        await this.activateSession(guestUser);
        await statsService.syncWithFirebase(guestUser.uid);
        return guestUser;
    }

    /**
     * Save guest profile ensuring avatarUrl is always present
     */
    private async saveGuestProfile(profile: PlayerProfile): Promise<void> {
        try {
            // Ensure avatarUrl is always set to avatarId (for consistency)
            const profileToSave = {
                ...profile,
                avatarUrl: profile.avatarId || profile.avatarUrl || 'avatar_default'
            };
            const jsonString = JSON.stringify(profileToSave);
            await AsyncStorage.setItem(STORAGE_KEY_GUEST_PROFILE, jsonString);
            console.log('[AuthService] Profile saved to AsyncStorage:', profileToSave.displayName, profileToSave.avatarId);
            
            // Verify it was saved correctly
            const verify = await AsyncStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
            if (verify) {
                const verified = JSON.parse(verify);
                console.log('[AuthService] Verification - saved profile:', verified.displayName, verified.avatarId);
            }
        } catch (error) {
            console.error('[AuthService] Error saving profile:', error);
            throw error;
        }
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
            await statsService.syncWithFirebase(profile.uid);
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
            await statsService.syncWithFirebase(profile.uid);
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
            avatarId: user.photoURL || 'avatar_default',
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
            this.currentUser = { ...user };
            console.log(`[AuthService] Session activated for: ${user.uid} (${user.displayName})`);
        } catch (error) {
            console.error('Failed to activate session', error);
        }
    }

    /**
     * Get current logged in user
     * Priority: 1. Memory, 2. Firebase, 3. Local Guest
     */
    async getCurrentUser(): Promise<PlayerProfile | null> {
        // 1. Return cached user if available
        if (this.currentUser) return this.currentUser;

        try {
            // Check session marker
            const isSessionActive = await AsyncStorage.getItem(STORAGE_KEY_SESSION);

            // 2. Try Firebase Auth (only if session active or previous firebase user)
            if (isSessionActive === 'true') {
                const firebaseUser = await new Promise<User | null>((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged((user) => {
                        unsubscribe();
                        resolve(user);
                    });
                });

                if (firebaseUser) {
                    this.currentUser = this.mapFirebaseUserToProfile(firebaseUser);
                    return this.currentUser;
                }
            }

            // 3. Fallback to Guest Profile (Always try this if no Firebase user, even if session flag is missing)
            const guestProfileJson = await AsyncStorage.getItem(STORAGE_KEY_GUEST_PROFILE);
            if (guestProfileJson) {
                const guestUser = JSON.parse(guestProfileJson);
                // Ensure avatarUrl is restored (JSON.stringify drops undefined)
                if (guestUser && !guestUser.avatarUrl && guestUser.avatarId) {
                    guestUser.avatarUrl = guestUser.avatarId;
                }
                this.currentUser = guestUser;
                return this.currentUser;
            }
        } catch (error) {
            console.error('[AuthService] getCurrentUser error:', error);
        }

        return null;
    }

    /**
     * Refresh user data (forces reload from storage)
     */
    async refreshUserFromStorage(): Promise<PlayerProfile | null> {
        this.currentUser = null;
        return this.getCurrentUser();
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
            this.currentUser = null;
        } catch (error) {
            console.error('Failed to logout', error);
        }
    }

    /**
     * Update user stats
     */
    async updateStats(stats: Partial<PlayerProfile>): Promise<void> {
        const user = await this.getCurrentUser();
        if (!user) return;

        this.currentUser = { ...user, ...stats };

        // Only persist to Guest Profile if it looks like a guest ID
        if (this.currentUser.uid.startsWith('guest_')) {
            try {
                await this.saveGuestProfile(this.currentUser);
            } catch (error) {
                console.error('Failed to update guest stats', error);
            }
        }
    }

    /**
     * Update User Profile (Unified)
     */
    async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
        const user = await this.getCurrentUser();
        if (!user) {
            console.warn('[AuthService] updateProfile: No user logged in');
            return;
        }

        // 1. Prepare updates
        const profileUpdates: Partial<PlayerProfile> = {};

        if (updates.displayName !== undefined && updates.displayName !== null) {
            profileUpdates.displayName = updates.displayName.trim();
        }

        if (updates.photoURL) {
            profileUpdates.avatarUrl = updates.photoURL;
            profileUpdates.avatarId = updates.photoURL;
        }

        // 2. Update memory state immediately
        this.currentUser = { ...user, ...profileUpdates };

        try {
            // 3. Persist Guest Profile
            if (this.currentUser.uid.startsWith('guest_')) {
                await this.saveGuestProfile(this.currentUser);
                await AsyncStorage.setItem(STORAGE_KEY_SESSION, 'true'); // Ensure session is active
                console.log('[AuthService] Guest profile updated & saved:', this.currentUser.displayName);
            }

            // 4. Persist Firebase Profile
            else if (auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, {
                    displayName: updates.displayName,
                    photoURL: updates.photoURL
                });
                console.log('[AuthService] Firebase profile updated');
            }
        } catch (error) {
            console.error('[AuthService] updateProfile error:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();
