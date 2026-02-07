import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

export default function SoloScreen() {
    const router = useRouter();

    const startGame = (difficulty: 'beginner' | 'intermediate') => {
        router.push({
            pathname: '/game/[id]',
            params: {
                id: 'solo-' + Date.now(),
                mode: 'solo',
                difficulty: difficulty
            }
        });
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            {/* Back Button - Top Left */}
            <Animated.View entering={FadeInLeft.duration(400)} style={styles.backContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Difficulty Cards - Center */}
            <View style={styles.cardsContainer}>
                <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.difficultyCard}
                        onPress={() => startGame('beginner')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#66BB6A', '#43A047']}
                            style={styles.cardGradient}
                        >
                            <Text style={styles.difficultyIcon}>🌱</Text>
                            <Text style={styles.cardTitle}>Débutant</Text>
                            <Text style={styles.cardDesc}>Bot facile{"\n"}parfait pour apprendre</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.difficultyCard}
                        onPress={() => startGame('intermediate')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#FFA726', '#EF6C00']}
                            style={styles.cardGradient}
                        >
                            <Text style={styles.difficultyIcon}>🔥</Text>
                            <Text style={styles.cardTitle}>Intermédiaire</Text>
                            <Text style={styles.cardDesc}>Bot plus intelligent{"\n"}plus difficile</Text>
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
    backContainer: {
        position: 'absolute',
        top: 40,
        left: 30,
        zIndex: 10,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 28,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
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
    difficultyCard: {
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
    difficultyIcon: {
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
        lineHeight: 18,
    },
});
