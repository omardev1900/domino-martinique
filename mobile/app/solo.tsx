import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type Difficulty = 'easy' | 'medium' | 'expert' | 'legend';
type GameMode = 'MANCHE' | 'SCORE' | 'COCHON';

export default function SoloScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
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
            <View style={[styles.backContainer, isLandscape && styles.backContainerLandscape]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={[styles.mainWrapper, isLandscape && styles.mainWrapperLandscape]}>
                {/* Left Panel: Branding & Difficulty */}
                <View style={[styles.sidebar, isLandscape && styles.sidebarLandscape]}>
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.sidebarContent}>
                        <Text style={[styles.title, isLandscape && styles.titleLandscape]}>Mode Solo</Text>

                        {/* Difficulty Selection moved here */}
                        <View style={[styles.section, { marginTop: 20 }]}>
                            <Text style={[styles.sectionTitle, isLandscape && { textAlign: 'center' }]}>Difficulté des Bots</Text>
                            <View style={styles.difficultyGrid}>
                                <TouchableOpacity
                                    style={[styles.difficultyBox, difficulty === 'easy' && styles.activeChoice]}
                                    onPress={() => setDifficulty('easy')}
                                >
                                    <Text style={styles.choiceIcon}>🌱</Text>
                                    <Text style={styles.choiceTextSmall}>Débutant</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.difficultyBox, difficulty === 'medium' && styles.activeChoice]}
                                    onPress={() => setDifficulty('medium')}
                                >
                                    <Text style={styles.choiceIcon}>🔥</Text>
                                    <Text style={styles.choiceTextSmall}>Moyen</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.difficultyBox, difficulty === 'expert' && styles.activeChoice]}
                                    onPress={() => setDifficulty('expert')}
                                >
                                    <Text style={styles.choiceIcon}>🦁</Text>
                                    <Text style={styles.choiceTextSmall}>Expert</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.difficultyBox, difficulty === 'legend' && styles.activeChoice]}
                                    onPress={() => setDifficulty('legend')}
                                >
                                    <Text style={styles.choiceIcon}>👑</Text>
                                    <Text style={styles.choiceTextSmall}>Légende</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Right Panel: Configuration Forms */}
                <View style={[styles.configPanel, isLandscape && styles.configPanelLandscape]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.scrollContent,
                            isLandscape && styles.scrollContentLandscape
                        ]}
                    >
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
                                <TouchableOpacity style={[styles.targetButton, isLandscape && styles.targetButtonSmall]} onPress={() => updateTarget(-1)}>
                                    <Ionicons name="remove" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <View style={styles.targetValueContainer}>
                                    <Text style={[styles.targetValue, isLandscape && styles.targetValueSmall]}>{winningCondition}</Text>
                                </View>
                                <TouchableOpacity style={[styles.targetButton, isLandscape && styles.targetButtonSmall]} onPress={() => updateTarget(1)}>
                                    <Ionicons name="add" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.startButton, isLandscape && styles.startButtonLandscape]} onPress={startGame}>
                            <LinearGradient
                                colors={['#4CAF50', '#2E7D32']}
                                style={styles.startGradient}
                            >
                                <Text style={styles.startText}>LANCER LA PARTIE</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainWrapper: {
        flex: 1,
        paddingTop: 80,
    },
    mainWrapperLandscape: {
        flexDirection: 'row',
        paddingTop: 0,
    },
    sidebar: {
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sidebarLandscape: {
        flex: 0.4,
        paddingLeft: 0, // Retrait du padding pour un vrai centrage
    },
    sidebarContent: {
        width: '100%',
        alignItems: 'center',
    },
    configPanel: {
        flex: 1,
    },
    configPanelLandscape: {
        flex: 0.6,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    scrollContentLandscape: {
        paddingTop: 40,
        paddingHorizontal: 30,
    },
    backContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    backContainerLandscape: {
        top: 20,
        left: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    titleLandscape: {
        fontSize: 38,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 30,
        textAlign: 'center',
    },
    subtitleLandscape: {
        textAlign: 'left',
        marginBottom: 0,
    },
    decorationContainer: {
        marginTop: 40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    decorationIcon: {
        fontSize: 60,
    },
    section: {
        width: '100%',
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFD700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    choiceButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeChoice: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: '#4CAF50',
    },
    difficultyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    difficultyBox: {
        width: '45%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 4,
    },
    choiceIcon: {
        fontSize: 18,
        marginBottom: 2,
    },
    choiceText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    choiceTextSmall: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    targetButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    targetButtonSmall: {
        width: 40,
        height: 40,
    },
    targetValueContainer: {
        minWidth: 50,
        alignItems: 'center',
    },
    targetValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    targetValueSmall: {
        fontSize: 28,
    },
    startButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    startButtonLandscape: {
        marginTop: 5,
        width: '80%',
        alignSelf: 'center',
    },
    startGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});

