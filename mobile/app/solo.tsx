import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HAND_SIZE, TURN_DURATION_SECONDS } from '../src/core/constants';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';
import { economyService } from '../src/core/services/economy.service';
import { TABLE_CONFIGS } from '../src/core/economy.constants';
import { TableTier } from '../src/core/economy.types';
import { EconomyHeader } from '../src/components/EconomyHeader';
import Svg, { Rect, Defs, Pattern } from 'react-native-svg';

const MadrasPattern = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" opacity={0.07}>
            <Defs>
                <Pattern
                    id="madras"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    {/* Horizontal lines */}
                    <Rect x="0" y="5" width="40" height="2" fill="#000" />
                    <Rect x="0" y="25" width="40" height="1" fill="#000" />
                    {/* Vertical lines */}
                    <Rect x="5" y="0" width="2" height="40" fill="#000" />
                    <Rect x="25" y="0" width="1" height="40" fill="#000" />
                </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#madras)" />
        </Svg>
    </View>
);

type Difficulty = 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN';
type GameMode = 'MANCHE' | 'SCORE' | 'COCHON' | 'VICTOIRE';

export default function SoloScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [difficulty, setDifficulty] = useState<Difficulty>('MAPIPI');
    const [gameMode, setGameMode] = useState<GameMode>('VICTOIRE');
    const [winningCondition, setWinningCondition] = useState(5);
    const [turnDuration, setTurnDuration] = useState(TURN_DURATION_SECONDS);
    const [startingHandSize, setStartingHandSize] = useState(HAND_SIZE);
    const [user, setUser] = useState<PlayerProfile | null>(null);
    // Phase 7 : le sélecteur de table sera dans l'UI — fixé à DEBUTANT pour l'instant
    const [tableTier] = useState<TableTier>('DEBUTANT');
    const [economyRefresh, setEconomyRefresh] = useState(0);
    const [debitFeedback, setDebitFeedback] = useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            authService.getCurrentUser().then(setUser);
            setEconomyRefresh(v => v + 1); // refresh EconomyHeader
        }, [])
    );

    const handleGoHome = () => {
        router.replace('/home');
    };

    const startGame = async () => {
        const tableConfig = TABLE_CONFIGS[tableTier];

        // ── ANTI-QUIT : Déduire le buy-in AVANT de lancer la partie ──
        if (tableConfig.buyIn > 0) {
            const success = await economyService.deductBuyIn(
                tableConfig.buyIn,
                user?.uid
            );
            if (!success) {
                Alert.alert(
                    'Coins insuffisants 🪙',
                    `Il vous faut ${tableConfig.buyIn} coins pour jouer à la ${tableConfig.label}.\n\nVous n’en avez pas assez.`,
                    [{ text: 'OK', style: 'cancel' }]
                );
                return; // ❌ Bloquer la navigation
            }
            // 💸 Feedback visuel de débit
            setDebitFeedback(`-${tableConfig.buyIn} 🪙`);
            setEconomyRefresh(v => v + 1); // met à jour le solde visible
            setTimeout(() => setDebitFeedback(null), 1800);
        }

        // ✅ Buy-in débité, lancer la partie
        router.push({
            pathname: '/game/[id]',
            params: {
                id: 'solo-' + Date.now(),
                mode: 'solo',
                difficulty: difficulty,
                gameMode: gameMode,
                winningCondition: winningCondition,
                turnDuration: turnDuration,
                startingHandSize: startingHandSize,
                tableTier: tableTier,  // Passé pour le calcul des récompenses au MATCH_END
            }
        });
    };

    const updateTarget = (delta: number) => {
        setWinningCondition(prev => Math.max(1, prev + delta));
    };

    return (
        <LinearGradient
            colors={['#2D1B4E', '#1A0E2E']}
            style={[styles.container, { minHeight: height }]}
        >
            <MadrasPattern />
            <View style={[styles.backContainer, { top: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
                        <Ionicons name="home" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Solo Mode</Text>
                </View>

                <EconomyHeader refreshTrigger={economyRefresh} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.mainWrapper, isLandscape && { paddingTop: 60 }, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
            <Animated.View entering={FadeInUp.delay(200)} style={{ width: '100%', alignItems: 'center' }}>
                <View style={styles.contentContainer}>
                    {/* Game Mode Selection */}
                    {/* Mode Cards */}
                    <View style={[styles.gameModeContainer, isLandscape && styles.gameModeContainerLandscape]}>
                        {/* VICTOIRE */}
                        <TouchableOpacity
                            style={[styles.gameModeTile, isLandscape && styles.gameModeTileLandscape, gameMode === 'VICTOIRE' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('VICTOIRE'); setWinningCondition(5); }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#388E3C', '#66BB6A']} style={[styles.modeGradient, isLandscape && styles.modeGradientLandscape]}>
                                <Text style={[styles.modeIllustration, isLandscape && styles.modeIllustrationLandscape]}>🏆</Text>
                                <Text style={[styles.gameModeTitle, isLandscape && styles.gameModeTitleLandscape]}>Victoire</Text>
                                <Text style={[styles.gameModeSubtitle, isLandscape && styles.gameModeSubtitleLandscape]}>X rounds gagnés</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* SCORE */}
                        <TouchableOpacity
                            style={[styles.gameModeTile, isLandscape && styles.gameModeTileLandscape, gameMode === 'SCORE' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('SCORE'); setWinningCondition(6); }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#0288D1', '#26C6DA']} style={[styles.modeGradient, isLandscape && styles.modeGradientLandscape]}>
                                <Text style={[styles.modeIllustration, isLandscape && styles.modeIllustrationLandscape]}>🎯</Text>
                                <Text style={[styles.gameModeTitle, isLandscape && styles.gameModeTitleLandscape]}>Score</Text>
                                <Text style={[styles.gameModeSubtitle, isLandscape && styles.gameModeSubtitleLandscape]}>Atteindre le but</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* COCHON */}
                        <TouchableOpacity
                            style={[styles.gameModeTile, isLandscape && styles.gameModeTileLandscape, gameMode === 'COCHON' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('COCHON'); setWinningCondition(3); }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#EC407A', '#FF7043']} style={[styles.modeGradient, isLandscape && styles.modeGradientLandscape]}>
                                <Text style={[styles.modeIllustration, isLandscape && styles.modeIllustrationLandscape]}>🐷</Text>
                                <Text style={[styles.gameModeTitle, isLandscape && styles.gameModeTitleLandscape]}>Cochons</Text>
                                <Text style={[styles.gameModeSubtitle, isLandscape && styles.gameModeSubtitleLandscape]}>Éviter le zéro</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* MANCHE */}
                        <TouchableOpacity
                            style={[styles.gameModeTile, isLandscape && styles.gameModeTileLandscape, gameMode === 'MANCHE' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('MANCHE'); setWinningCondition(3); }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#FFA000', '#FFD54F']} style={[styles.modeGradient, isLandscape && styles.modeGradientLandscape]}>
                                <Text style={[styles.modeIllustration, isLandscape && styles.modeIllustrationLandscape]}>🏆</Text>
                                <Text style={[styles.gameModeTitle, isLandscape && styles.gameModeTitleLandscape]}>Manches</Text>
                                <Text style={[styles.gameModeSubtitle, isLandscape && styles.gameModeSubtitleLandscape]}>X manches gagnées</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Parameters Bar (Premium & Optimized for Landscape) */}
                    <View style={[styles.paramsContainer, isLandscape && styles.paramsContainerLandscape]}>
                        {/* 1. Difficulté */}
                        <View style={[styles.paramCol, isLandscape && styles.paramColLandscape]}>
                            <Text style={styles.paramLabel}>Difficulté</Text>
                            <View style={styles.diffToggle}>
                                <TouchableOpacity
                                    style={[styles.diffBtn, difficulty === 'TI_MANMAY' && styles.activeDiffBtn]}
                                    onPress={() => setDifficulty('TI_MANMAY')}
                                >
                                    <Text style={styles.diffIcon}>🌱</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.diffBtn, difficulty === 'MAPIPI' && styles.activeDiffBtn]}
                                    onPress={() => setDifficulty('MAPIPI')}
                                >
                                    <Text style={styles.diffIcon}>🌶️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.diffBtn, difficulty === 'GRAN_MOUN' && styles.activeDiffBtn]}
                                    onPress={() => setDifficulty('GRAN_MOUN')}
                                >
                                    <Text style={styles.diffIcon}>👑</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.paramValueSmall}>
                                {difficulty === 'TI_MANMAY' ? 'MANMAY' : difficulty === 'MAPIPI' ? 'MAPIPI' : 'GRAN MOUN'}
                            </Text>
                        </View>

                        {/* 2. But */}
                        <View style={[styles.paramCol, isLandscape && styles.paramColLandscape]}>
                            <Text style={styles.paramLabel}>Objectif Match</Text>
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => updateTarget(-1)} style={styles.stepBtn}>
                                    <Ionicons name="remove" size={isLandscape ? 16 : 20} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={[styles.stepValue, isLandscape && styles.stepValueLandscape]}>{winningCondition}</Text>
                                <TouchableOpacity onPress={() => updateTarget(1)} style={styles.stepBtn}>
                                    <Ionicons name="add" size={isLandscape ? 16 : 20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.paramValueSmall}>
                                {gameMode === 'VICTOIRE' ? 'Victoires' : gameMode === 'MANCHE' ? 'Manches' : gameMode === 'COCHON' ? 'Cochons' : 'Points'}
                            </Text>
                        </View>

                        {/* 3. Durée du Tour */}
                        <View style={[styles.paramCol, isLandscape && styles.paramColLandscape]}>
                            <Text style={styles.paramLabel}>Vitesse réflexion</Text>
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => setTurnDuration(prev => {
                                    const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                    const idx = steps.indexOf(prev);
                                    return idx > 0 ? steps[idx - 1] : steps[0];
                                })} style={styles.stepBtn}>
                                    <Ionicons name="remove" size={isLandscape ? 16 : 20} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={[styles.stepValue, isLandscape && styles.stepValueLandscape]}>{turnDuration === 0 ? '∞' : turnDuration}</Text>
                                <TouchableOpacity onPress={() => setTurnDuration(prev => {
                                    const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                    const idx = steps.indexOf(prev);
                                    return idx < steps.length - 1 ? steps[idx + 1] : steps[steps.length - 1];
                                })} style={styles.stepBtn}>
                                    <Ionicons name="add" size={isLandscape ? 16 : 20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.paramValueSmall}>
                                {turnDuration === 0 ? 'Illimité' : `secondes`}
                            </Text>
                        </View>

                        {/* 4. Main de départ */}
                        <View style={[styles.paramCol, isLandscape && styles.paramColLandscape, { borderRightWidth: 0 }]}>
                            <Text style={styles.paramLabel}>Main de départ</Text>
                            <View style={styles.handToggle}>
                                {[3, 5, 7].map(size => (
                                    <TouchableOpacity
                                        key={size}
                                        onPress={() => setStartingHandSize(size)}
                                        style={[styles.handBtn, isLandscape && styles.handBtnLandscape, startingHandSize === size && styles.activeHandBtn]}
                                    >
                                        <Text style={[styles.handText, isLandscape && styles.handTextLandscape, startingHandSize === size && styles.activeHandText]}>
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.paramValueSmall}>Dominos</Text>
                        </View>
                    </View>

                    {/* Play Button */}
                    <View style={[styles.playButtonWrapper, isLandscape && styles.playButtonWrapperLandscape]}>
                        <TouchableOpacity style={[styles.playButton, isLandscape && styles.playButtonLandscape]} onPress={startGame} activeOpacity={0.8}>
                            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.playGradient}>
                                <View style={styles.playContent}>
                                    <View style={styles.costContainer}>
                                        <Text style={{ fontSize: isLandscape ? 14 : 18 }}>🪙</Text>
                                        <Text style={[styles.costText, isLandscape && styles.costTextLandscape]}>-{TABLE_CONFIGS[tableTier].buyIn}</Text>
                                    </View>
                                    <View style={styles.playDivider} />
                                    <Text style={[styles.playText, isLandscape && styles.playTextLandscape]}>JOUER MAINTENANT</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {debitFeedback && (
                            <Animated.Text entering={FadeInLeft.duration(200)} style={styles.debitFeedback}>
                                {debitFeedback} débités
                            </Animated.Text>
                        )}
                    </View>
                </View>
            </Animated.View>
            </ScrollView>
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
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    mainWrapper: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 80,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 800,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 30,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 3,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    gameModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        gap: 12,
    },
    gameModeContainerLandscape: {
        marginBottom: 10,
        gap: 8,
    },
    gameModeTile: {
        flex: 1,
        borderRadius: 20,
        height: 160,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    gameModeTileLandscape: {
        height: 100, // ~38% reduction (from 160)
    },
    gameModeTileActive: {
        borderColor: '#FFD700',
        borderWidth: 3,
        transform: [{ scale: 1.02 }],
    },
    modeGradient: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    modeGradientLandscape: {
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    modeIllustration: {
        fontSize: 40,
        marginBottom: 8,
    },
    modeIllustrationLandscape: {
        fontSize: 30,
        marginBottom: 0,
    },
    gameModeTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    gameModeTitleLandscape: {
        fontSize: 16,
    },
    gameModeSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
    },
    gameModeSubtitleLandscape: {
        display: 'none', // Hide subtitle in landscape to save space
    },
    // --- Barre de Paramètres ---
    paramsContainer: {
        width: '100%',
        backgroundColor: 'rgba(30, 20, 50, 0.7)',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 20,
    },
    paramsContainerLandscape: {
        flexDirection: 'row',
        padding: 10,
        marginBottom: 10,
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
    },
    paramCol: {
        flex: 1,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 5,
    },
    paramColLandscape: {
        borderRightWidth: 1,
    },
    paramLabelContainer: {
        flex: 1,
    },
    paramLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    paramValueDisplay: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 2,
    },
    paramValueSmall: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 5,
        opacity: 0.6,
        textTransform: 'uppercase',
    },
    // --- Sélecteurs ---
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        borderRadius: 15,
        gap: 4,
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepValue: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: '900',
        marginHorizontal: 15,
        minWidth: 25,
        textAlign: 'center',
        width: 40,
    },
    stepValueLandscape: {
        fontSize: 18,
        width: 30,
    },
    // --- Sélecteur de Difficulté ---
    diffToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        borderRadius: 15,
        gap: 8,
    },
    diffBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDiffBtn: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    diffIcon: {
        fontSize: 18,
    },
    // --- Sélecteur de Main ---
    handToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        borderRadius: 15,
        gap: 8,
    },
    handBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 4,
    },
    handBtnLandscape: {
        width: 30,
        height: 30,
    },
    activeHandBtn: {
        backgroundColor: '#FFD700',
        borderColor: '#FFF',
        elevation: 5,
    },
    dominoTop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dominoDivider: {
        width: '80%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 4,
    },
    activeDominoDivider: {
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    handText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    handTextLandscape: {
        fontSize: 14,
    },
    activeHandText: {
        color: '#000',
    },
    // --- Bouton JOUER ---
    playButtonWrapper: {
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto',
    },
    playButtonWrapperLandscape: {
        marginTop: 0,
    },
    playButton: {
        width: '100%',
        maxWidth: 400,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    playButtonLandscape: {
        height: 44,
        maxWidth: 300,
    },
    playGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    playContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    costText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        marginLeft: 4,
    },
    costTextLandscape: {
        fontSize: 14,
    },
    playDivider: {
        width: 2,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 15,
    },
    playText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    playTextLandscape: {
        fontSize: 14,
    },
    debitFeedback: {
        color: '#FFD700',
        position: 'absolute',
        top: -30,
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
    },
});
