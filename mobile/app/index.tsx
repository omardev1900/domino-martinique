import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
} from 'react-native-reanimated';

export default function SplashScreen() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Animate logo entrance
        scale.value = withSpring(1, { damping: 10 });
        opacity.value = withSequence(
            withDelay(200, withSpring(1)),
        );

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Navigate to home after 3 seconds
        const timer = setTimeout(() => {
            router.replace('/home');
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(countdownInterval);
        };
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Text style={styles.logo}>🁡</Text>
                <Text style={styles.title}>DOMINO</Text>
                <Text style={styles.subtitle}>MARTINIQUE</Text>
                <View style={styles.divider} />

                {/* Loading Indicator */}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>{countdown}s</Text>
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '300',
        color: '#FFD700',
        letterSpacing: 10,
        marginTop: 8,
    },
    divider: {
        width: 120,
        height: 3,
        backgroundColor: 'rgba(255,215,0,0.5)',
        marginTop: 30,
        borderRadius: 2,
    },
    loadingContainer: {
        marginTop: 40,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
});
