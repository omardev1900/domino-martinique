import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/core/services/auth.service';
import SettingsManager from '../src/core/SettingsManager';

export default function SplashScreen() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    // Mark component as mounted
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const checkAuthSafe = async () => {
            try {
                // Load settings
                await SettingsManager.loadSettings();

                // Quick auth check (no artificial delay)
                const user = await authService.getCurrentUser();

                if (!isMounted) return;

                if (!user) {
                    console.log('❌ No user found - redirecting to login');
                    router.replace('/login');
                    return;
                }

                console.log(`✅ User authenticated: ${user.uid}`);

                // Check active room
                try {
                    const { findActiveRoomForUser } = require('../src/core/services/firebase');
                    const activeRoomId = await findActiveRoomForUser(user.uid);

                    if (!isMounted) return;

                    if (activeRoomId) {
                        console.log(`✅ Active room found: ${activeRoomId}`);

                        // We need to ask user, but we can't show Alert while Splash is potentially covering.
                        // For now, let's redirect to Home and let Home handle the "Rejoin" notification if needed,
                        // OR we force redirect to game.
                        // Let's stick to Home for safety, or direct redirect if we are confident.
                        // BETTER UX: Go to Home, shows "Partie en cours" badge.
                        router.replace('/home');
                    } else {
                        router.replace('/home');
                    }
                } catch (e) {
                    console.error("❌ Rejoin check failed:", e);
                    router.replace('/home');
                }

            } catch (e) {
                console.error("Critical Splash Error", e);
                router.replace('/login');
            }
        };

        checkAuthSafe();
    }, [isMounted]);

    // Render a plain background (matching splash) to avoid white flash
    return (
        <View style={styles.container} />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1f0d', // Match Splash background
    },
});
