import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, Platform } from 'react-native';
import Animated, { FadeIn, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameState, Player, PlayerId, GameMode, MancheResult } from '@/core/types';
import { getAvatarImage, AvatarId, AVAILABLE_AVATARS } from '@/core/avatars';
import SoundManager from '@/core/audio/SoundManager';
import HapticManager from '@/core/audio/HapticManager';
// import { ConfettiSystem } from './ConfettiSystem'; // Skpped for now

interface UnifiedResultOverlayProps {
    gameState: GameState;
    visible: boolean;
    currentUserId: string;
    onContinue: () => void;
    onLeave?: () => void; // For match end
}

type OverlayMode = 'SIMPLE_WIN' | 'MANCHE_END' | 'MATCH_END' | 'BOUDE';

export const UnifiedResultOverlay: React.FC<UnifiedResultOverlayProps> = ({
    gameState,
    visible,
    currentUserId,
    onContinue,
    onLeave
}) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // Derived State
    const isMatchOver = gameState.phase === 'MATCH_END';
    const isMancheOver = gameState.phase === 'MANCHE_END';
    const isBoude = gameState.phase === 'BOUDE';

    // Determine actual mode
    let mode: OverlayMode = 'SIMPLE_WIN';
    if (isMatchOver) mode = 'MATCH_END';
    else if (isMancheOver) mode = 'MANCHE_END';
    else if (isBoude) mode = 'BOUDE';

    const mancheResult = gameState.mancheResult;

    // Find Winner (Round or Match)
    // For Match/Manche end, we usually have a clear winner in logic
    // For Round end, winner is firstPlayerOfRound (usually set to winner) or one with 0 dominoes
    const getWinner = (): Player | undefined => {
        if (isBoude) return undefined; // Handled separately or no winner yet
        if (mancheResult === 'CHIRE') return undefined; // No winner

        // Match Logic
        if (isMatchOver) {
            // Winner is the one who met condition
            if (gameState.gameMode === 'SCORE') return gameState.players.find(p => p.totalPoints >= gameState.winningCondition);
            if (gameState.gameMode === 'COCHON') return gameState.players.find(p => p.totalCochons >= gameState.winningCondition); // Wait, cochon mode winner is usually the one with LEAST cochons? Or logic? 
            // In standard logic: winningCondition usually implies target to reach for WIN. 
            // Let's assume standard sorting by wins/points
            return [...gameState.players].sort((a, b) => b.mancheWins - a.mancheWins)[0];
        }

        // Manche Logic
        if (isMancheOver) {
            const winner = gameState.players.find(p => p.currentMancheStars >= 3); // Or threshold
            if (winner) return winner;
        }

        // Round Logic (Simple Win)
        // Usually the one with empty hand OR determined by logic
        return gameState.players.find(p => p.id === gameState.firstPlayerOfRound) || gameState.players.find(p => p.hand.length === 0);
    };

    const winner = getWinner();
    const isMeWinner = winner?.id === currentUserId;
    const isChire = mancheResult === 'CHIRE';
    const isCochon = mancheResult === 'COCHON';

    // Animation Values
    const scaleValue = useSharedValue(0.5);
    const opacityValue = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scaleValue.value = withSpring(1);
            opacityValue.value = withTiming(1, { duration: 500 });

            // Sounds
            if (isChire) {
                SoundManager.playSound('boude'); // Re-use boude or specific sound
            } else if (isCochon) {
                SoundManager.playSound('win'); // Assuming exists or generic
            } else if (isMeWinner) {
                SoundManager.playSound('win');
                HapticManager.triggerSuccess();
            } else if (winner) {
                SoundManager.playSound('lose');
            }
        } else {
            scaleValue.value = 0.5;
            opacityValue.value = 0;
        }
    }, [visible, mode, isChire, isCochon, isMeWinner]);

    if (!visible) return null;

    // --- RENDER CONTENT BASED ON MODE ---

    // --- RENDER CONTENT BASED ON MODE ---

    const renderHeader = () => {
        if (isMatchOver) return { title: "MÈT PIÈS !", subtitle: "Ou ganyé fwa-tala !" };
        if (isChire) return { title: "CHIRÉ !!", subtitle: "Tout moun a zéro !" };
        if (isCochon) return { title: "COCHON !", subtitle: `Ou pran an koshon ! 🐷` };
        if (isMancheOver) return { title: "MANCHE TERMINÉE", subtitle: `An lòt zetwal !` };
        if (isBoude) return { title: "BOUDÉ !", subtitle: "Pèsonn pa ganyé." };
        return { title: "VICTOIRE !", subtitle: `An lòt zetwal !` };
    };

    const headerInfo = renderHeader();

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Backdrop - Semi transparent to see HUD behind if needed, but mostly dark to focus */}
            <Animated.View style={[styles.backdrop, { opacity: opacityValue }]} />

            {/* Main Card */}
            <Animated.View style={[
                styles.card,
                isLandscape && styles.cardLandscape,
                { transform: [{ scale: scaleValue }], opacity: opacityValue }
            ]}>

                {/* Visual / Avatar Section */}
                <View style={[styles.visualSection, isCochon && styles.visualSectionCochon, isChire && styles.visualSectionChire]}>
                    <LinearGradient
                        colors={isChire ? ['#d32f2f', '#b71c1c'] : isCochon ? ['#ff9800', '#f57c00'] : isMatchOver ? ['#FFD700', '#FFA000'] : ['#4CAF50', '#388E3C']}
                        style={StyleSheet.absoluteFill}
                    />

                    {winner && !isChire && !isBoude && (
                        <Animated.View entering={ZoomIn.delay(300)} style={styles.avatarContainer}>
                            <Image
                                source={getAvatarImage(winner.avatarId as AvatarId || 'avatar_default')}
                                style={styles.avatar}
                            />
                            {isMatchOver && <Text style={styles.crown}>👑</Text>}
                        </Animated.View>
                    )}

                    {isChire && <Text style={styles.bigEmoji}>😱</Text>}
                    {isBoude && <Text style={styles.bigEmoji}>🛑</Text>}

                    <Text style={styles.title}>{headerInfo.title}</Text>
                    <Text style={styles.subtitle}>{headerInfo.subtitle}</Text>
                </View>

                {/* Info / Stats Section */}
                <View style={styles.infoSection}>

                    {/* Dynamic Content based on event */}
                    <View style={styles.dynamicContent}>
                        {mode === 'SIMPLE_WIN' && (
                            <Text style={styles.explanation}>
                                +1 Étoile pour {winner?.name}
                            </Text>
                        )}

                        {isChire && (
                            <Text style={styles.explanation}>
                                Tout moun a zéro !
                            </Text>
                        )}

                        {isCochon && (
                            <Text style={styles.explanation}>
                                {gameState.players.filter(p => p.currentMancheStars === 0).length} joueurs sont Cochon !
                            </Text>
                        )}

                        {/* Mini Score Summary for Match End */}
                        {isMatchOver && (
                            <View style={styles.miniScoreboard}>
                                {gameState.players.map(p => (
                                    <View key={p.id} style={styles.miniScoreRow}>
                                        <Text style={[styles.miniScoreName, p.id === winner?.id && styles.bold]}>{p.name}</Text>
                                        <Text style={styles.miniScoreValue}>
                                            {gameState.gameMode === 'SCORE' ? `${p.totalPoints} pts` :
                                                gameState.gameMode === 'COCHON' ? `${p.totalCochons} 🐷` :
                                                    `${p.mancheWins} 👑`}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, isMatchOver && styles.actionButtonGold]}
                        onPress={onContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.actionButtonText, isMatchOver && styles.actionButtonTextGold]}>
                            {isMatchOver ? "VOIR RÉSULTATS" : "CONTINUER"}
                        </Text>
                        <Ionicons name="arrow-forward" size={24} color={isMatchOver ? "#8F6900" : "white"} />
                    </TouchableOpacity>

                    {/* Secondary Action Button - Leave (Match End Only) */}
                    {isMatchOver && onLeave && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton]}
                            onPress={onLeave}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>QUITTER</Text>
                            <Ionicons name="exit-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    )}

                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Ensure it's on top of everything
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker for better focus
    },
    card: {
        width: '90%',
        maxWidth: 420,
        minHeight: 350, // Ensure height consistency
        backgroundColor: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        // Modern shadow for Web & Native (if supported)
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
            },
            default: {
                elevation: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            }
        }),
        // Ensure flex layout for inner content
        display: 'flex',
        flexDirection: 'column',
    },
    cardLandscape: {
        flexDirection: 'row',
        width: '85%',
        maxWidth: 550,
        height: 320,
        minHeight: 320,
    },
    visualSection: {
        width: '50%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    visualSectionCochon: {
        // Orange handled by gradient
    },
    visualSectionChire: {
        // Red handled by gradient
    },
    cardLandscapeVisual: {
        width: '60%',
        height: '100%',
    },
    avatarContainer: {
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
    },
    crown: {
        fontSize: 30,
        position: 'absolute',
        top: -20,
    },
    bigEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 28, // Slightly larger
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        fontWeight: '700',
        fontStyle: 'italic',
    },
    infoSection: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1, // Fill remaining space
        backgroundColor: '#fff',
        width: '100%',
    },
    dynamicContent: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
        flex: 1, // Take available space
    },
    explanation: {
        fontSize: 18,
        color: '#444',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 24,
    },
    miniScoreboard: {
        width: '100%',
        marginTop: 5,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    miniScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    miniScoreName: {
        fontSize: 15,
        color: '#333',
    },
    miniScoreValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    bold: {
        fontWeight: 'bold',
        color: '#000',
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#222', // Darker black
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 40,
        alignItems: 'center',
        gap: 10,
        width: '100%',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
            },
            default: {
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            }
        }),
    },
    actionButtonGold: {
        backgroundColor: '#FFD700',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 10px rgba(255, 215, 0, 0.5)',
            },
            default: {
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
            }
        }),
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18, // Larger text
        fontWeight: '800', // Bolder
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButtonTextGold: {
        color: '#8F6900',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        marginTop: 12,
        borderWidth: 1.5,
        borderColor: '#ddd',
        paddingVertical: 12,
        elevation: 0,
        shadowOpacity: 0,
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
    }
});

