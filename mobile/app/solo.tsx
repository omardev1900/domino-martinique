import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { HAND_SIZE, TURN_DURATION_SECONDS } from '../src/core/constants';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';
import { economyService } from '../src/core/services/economy.service';
import { TABLE_CONFIGS } from '../src/core/economy.constants';
import { TableTier } from '../src/core/economy.types';
import { EconomyHeader } from '../src/components/EconomyHeader';

type Difficulty = 'easy' | 'medium' | 'expert' | 'legend';
type GameMode = 'MANCHE' | 'SCORE' | 'COCHON';

export default function SoloScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [gameMode, setGameMode] = useState<GameMode>('SCORE');
    const [winningCondition, setWinningCondition] = useState(6);
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
            style={styles.container}
        >
            <View style={styles.backContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoHome}
                    activeOpacity={0.7}
                >
                    <Ionicons name="home" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Economy pill - visible en haut de l'écran solo */}
                <EconomyHeader refreshTrigger={economyRefresh} />
            </View>

            <View style={styles.mainWrapper}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.contentContainer}>
                    <Text style={styles.title}>SOLO MODE</Text>

                    {/* Game Mode Selection */}
                    <View style={styles.gameModeContainer}>
                        <TouchableOpacity
                            style={[styles.gameModeTile, gameMode === 'SCORE' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('SCORE'); setWinningCondition(6); }}
                        >
                            <Text style={[styles.gameModeTitle, gameMode === 'SCORE' && styles.gameModeTitleActive]}>
                                <Text style={styles.gameModeIcon}>🎯</Text> SCORE
                            </Text>
                            <Text style={[styles.gameModeSubtitle, gameMode === 'SCORE' && styles.gameModeSubtitleActive]}>
                                Le premier à X points
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.gameModeTile, gameMode === 'COCHON' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('COCHON'); setWinningCondition(3); }}
                        >
                            <Text style={[styles.gameModeTitle, gameMode === 'COCHON' && styles.gameModeTitleActive]}>
                                <Text style={styles.gameModeIcon}>🐷</Text> COCHON
                            </Text>
                            <Text style={[styles.gameModeSubtitle, gameMode === 'COCHON' && styles.gameModeSubtitleActive]}>
                                Évitez le zéro
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.gameModeTile, gameMode === 'MANCHE' && styles.gameModeTileActive]}
                            onPress={() => { setGameMode('MANCHE'); setWinningCondition(3); }}
                        >
                            <Text style={[styles.gameModeTitle, gameMode === 'MANCHE' && styles.gameModeTitleActive]}>
                                <Text style={styles.gameModeIcon}>🏆</Text> MANCHE
                            </Text>
                            <Text style={[styles.gameModeSubtitle, gameMode === 'MANCHE' && styles.gameModeSubtitleActive]}>
                                Le meilleur à X manches
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Options Bar */}
                    <View style={styles.optionsBar}>
                        {/* Niveau */}
                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Niveau: <Text style={styles.diffValue}>{
                                difficulty === 'easy' ? 'DÉBUTANT' :
                                    difficulty === 'medium' ? 'NORMAL' :
                                        difficulty === 'expert' ? 'EXPERT' : 'LÉGENDE'
                            }</Text></Text>
                            <View style={styles.optionRow}>
                                <TouchableOpacity style={[styles.diffBtn, difficulty === 'easy' && styles.activeDiffBtn]} onPress={() => setDifficulty('easy')}><Text style={[styles.compactIcon, difficulty === 'easy' && styles.activeCompactIcon]}>🌱</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.diffBtn, difficulty === 'medium' && styles.activeDiffBtn]} onPress={() => setDifficulty('medium')}><Text style={[styles.compactIcon, difficulty === 'medium' && styles.activeCompactIcon]}>🔥</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.diffBtn, difficulty === 'expert' && styles.activeDiffBtn]} onPress={() => setDifficulty('expert')}><Text style={[styles.compactIcon, difficulty === 'expert' && styles.activeCompactIcon]}>🦁</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.diffBtn, difficulty === 'legend' && styles.activeDiffBtn]} onPress={() => setDifficulty('legend')}><Text style={[styles.compactIcon, difficulty === 'legend' && styles.activeCompactIcon]}>👑</Text></TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.optionSeparator}>|</Text>

                        {/* But */}
                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>But: </Text>
                            <View style={styles.optionRow}>
                                <TouchableOpacity onPress={() => updateTarget(-1)} style={styles.compactBtn}><Ionicons name="remove" size={12} color="#000" /></TouchableOpacity>
                                <Text style={styles.optionValue}>{winningCondition}</Text>
                                <TouchableOpacity onPress={() => updateTarget(1)} style={styles.compactBtn}><Ionicons name="add" size={12} color="#000" /></TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.optionSeparator}>|</Text>

                        {/* Durée */}
                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Durée: {turnDuration === 0 ? 'Off' : `${turnDuration}s`} </Text>
                            <View style={styles.optionRow}>
                                <TouchableOpacity onPress={() => setTurnDuration(prev => {
                                    const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                    const idx = steps.indexOf(prev);
                                    return idx > 0 ? steps[idx - 1] : steps[0];
                                })} style={styles.compactBtn}><Ionicons name="remove" size={12} color="#000" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => setTurnDuration(prev => {
                                    const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                    const idx = steps.indexOf(prev);
                                    return idx < steps.length - 1 ? steps[idx + 1] : steps[steps.length - 1];
                                })} style={styles.compactBtn}><Ionicons name="add" size={12} color="#000" /></TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.optionSeparator}>|</Text>

                        {/* Main */}
                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Main: </Text>
                            <View style={styles.optionRow}>
                                {[3, 5, 7].map(size => (
                                    <TouchableOpacity key={size} onPress={() => setStartingHandSize(size)} style={[styles.mainBtn, startingHandSize === size && styles.activeMainBtn]}>
                                        <Text style={[styles.mainBtnText, startingHandSize === size && styles.activeMainBtnText]}>{size}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <Text style={styles.startText}>JOUER MAINTENANT</Text>
                        <Text style={styles.buyInBadge}>-{TABLE_CONFIGS[tableTier].buyIn} 🪙</Text>
                    </TouchableOpacity>
                    {/* Feedback de débit (disparait après 1.8s) */}
                    {debitFeedback && (
                        <Animated.Text entering={FadeInLeft.duration(200)} style={styles.debitFeedback}>
                            {debitFeedback} débités
                        </Animated.Text>
                    )}
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
        top: 20,
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
    mainWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 800,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    gameModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        gap: 10,
    },
    gameModeTile: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 35,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    gameModeTileActive: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    prochainementBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#D11C1C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        transform: [{ rotate: '15deg' }],
        zIndex: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    prochainementText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gameModeTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 8,
    },
    gameModeTitleActive: {
        color: '#000',
    },
    gameModeSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textAlign: 'center',
    },
    gameModeSubtitleActive: {
        color: '#333',
        fontWeight: 'bold',
    },
    gameModeIcon: {
        fontSize: 16,
    },
    optionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        width: '100%',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    optionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginRight: 6,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactIcon: {
        fontSize: 14,
        opacity: 0.5,
    },
    activeCompactIcon: {
        opacity: 1,
    },
    diffValue: {
        color: '#ff9800',
        fontWeight: 'bold',
        fontSize: 10,
    },
    diffBtn: {
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    activeDiffBtn: {
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
    },
    optionSeparator: {
        color: '#CCC',
        fontSize: 16,
        marginHorizontal: 12,
    },
    compactBtn: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        padding: 2,
        backgroundColor: '#F5F5F5',
    },
    optionValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#000',
        minWidth: 16,
        textAlign: 'center',
    },
    mainBtn: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#F5F5F5',
    },
    activeMainBtn: {
        backgroundColor: '#333',
        borderColor: '#333',
    },
    mainBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    activeMainBtnText: {
        color: '#FFF',
    },
    startButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    startText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    buyInBadge: {
        color: 'rgba(255, 215, 0, 0.8)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    debitFeedback: {
        color: '#FF6B6B',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});

