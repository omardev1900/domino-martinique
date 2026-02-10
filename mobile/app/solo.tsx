import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type Difficulty = 'beginner' | 'intermediate';
type GameMode = 'MANCHE' | 'SCORE' | 'COCHON';

export default function SoloScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
    const [gameMode, setGameMode] = useState<GameMode>('MANCHE');
    const [winningCondition, setWinningCondition] = useState(3);

    const startGame = () => {
        router.push({
            pathname: '/game/[id]',
            params: {
                id: 'solo-' + Date.now(),
                mode: 'solo',
                difficulty: difficulty,
                gameMode: gameMode,
                winningCondition: winningCondition
            }
        });
    };

    const updateTarget = (delta: number) => {
        setWinningCondition(prev => Math.max(1, prev + delta));
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            {/* Back Button */}
            <Animated.View entering={FadeInLeft.duration(400)} style={styles.backContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Configuration Solo</Text>
                    <Text style={styles.subtitle}>Préparez votre partie contre 2 bots</Text>

                    {/* Difficulty Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Difficulté des Bots</Text>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.choiceButton, difficulty === 'beginner' && styles.activeChoice]}
                                onPress={() => setDifficulty('beginner')}
                            >
                                <Text style={styles.choiceIcon}>🌱</Text>
                                <Text style={styles.choiceText}>Débutant</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.choiceButton, difficulty === 'intermediate' && styles.activeChoice]}
                                onPress={() => setDifficulty('intermediate')}
                            >
                                <Text style={styles.choiceIcon}>🔥</Text>
                                <Text style={styles.choiceText}>Avancé</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Game Mode Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Type de Jeu</Text>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.choiceButton, gameMode === 'MANCHE' && styles.activeChoice]}
                                onPress={() => { setGameMode('MANCHE'); setWinningCondition(3); }}
                            >
                                <Text style={styles.choiceIcon}>🏆</Text>
                                <Text style={styles.choiceText}>Manche</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.choiceButton, gameMode === 'SCORE' && styles.activeChoice]}
                                onPress={() => { setGameMode('SCORE'); setWinningCondition(15); }}
                            >
                                <Text style={styles.choiceIcon}>🎯</Text>
                                <Text style={styles.choiceText}>Score</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.choiceButton, gameMode === 'COCHON' && styles.activeChoice]}
                                onPress={() => { setGameMode('COCHON'); setWinningCondition(3); }}
                            >
                                <Text style={styles.choiceIcon}>🐷</Text>
                                <Text style={styles.choiceText}>Cochon</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Winning Condition Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {gameMode === 'MANCHE' ? 'Manches pour gagner' :
                                gameMode === 'SCORE' ? 'Points pour gagner' :
                                    'Nombre de cochons total'}
                        </Text>
                        <View style={styles.targetRow}>
                            <TouchableOpacity style={styles.targetButton} onPress={() => updateTarget(-1)}>
                                <Ionicons name="remove" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.targetValueContainer}>
                                <Text style={styles.targetValue}>{winningCondition}</Text>
                            </View>
                            <TouchableOpacity style={styles.targetButton} onPress={() => updateTarget(1)}>
                                <Ionicons name="add" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            style={styles.startGradient}
                        >
                            <Text style={styles.startText}>LANCER LA PARTIE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 100,
        paddingBottom: 40,
    },
    backContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 40,
    },
    section: {
        width: '100%',
        maxWidth: 500,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFD700',
        marginBottom: 15,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    choiceButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeChoice: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    choiceIcon: {
        fontSize: 24,
        marginBottom: 5,
    },
    choiceText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
    },
    targetButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetValueContainer: {
        minWidth: 60,
        alignItems: 'center',
    },
    targetValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
    },
    startButton: {
        width: '100%',
        maxWidth: 300,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginTop: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    startGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

