import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            {/* Settings Button - Top Left */}
            <Animated.View entering={FadeInLeft.duration(400)} style={styles.settingsContainer}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/modal')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Mode Cards - Center */}
            <View style={styles.cardsContainer}>
                <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.modeCard}
                        onPress={() => router.push('/solo')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            style={styles.cardGradient}
                        >
                            <Text style={styles.cardIcon}>🎮</Text>
                            <Text style={styles.cardTitle}>Solo Mode</Text>
                            <Text style={styles.cardDesc}>Play vs Bot</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.modeCard}
                        onPress={() => router.push('/lobby')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#2196F3', '#1565C0']}
                            style={styles.cardGradient}
                        >
                            <Text style={styles.cardIcon}>👥</Text>
                            <Text style={styles.cardTitle}>Multiplayer</Text>
                            <Text style={styles.cardDesc}>Play with Friends</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Settings Button - Top Left
    settingsContainer: {
        position: 'absolute',
        top: 40,
        left: 30,
        zIndex: 10,
    },
    settingsButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 24,
    },
    // Mode Cards - Center
    cardsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 80,
        gap: 24,
    },
    cardWrapper: {
        flex: 1,
        maxWidth: 220,
    },
    modeCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    cardGradient: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
    },
    cardIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 6,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },
});
