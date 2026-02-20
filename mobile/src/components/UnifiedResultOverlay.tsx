import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, Platform, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GameState, Player, PlayerId, GameMode, MancheResult } from '@/core/types';
import { getAvatarImage, AvatarId, AVAILABLE_AVATARS } from '@/core/avatars';
import SoundManager from '@/core/audio/SoundManager';
import HapticManager from '@/core/audio/HapticManager';
import { DominoTile } from './DominoTile';
import { calculateHandPoints } from '@/core/ScoringEngine';
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
            if (gameState.gameMode === 'COCHON') return gameState.players.find(p => p.totalCochons >= gameState.winningCondition); // Wait, cochon mode winner is usually the one with LEAST cochons?
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

    const renderHeader = () => {
        if (isMatchOver) return { title: "MÈT PIÈS !", subtitle: "Ou ganyé fwa-tala !" };
        if (isChire) return { title: "CHIRÉ !!", subtitle: "Tout moun a zéro !" };
        if (isCochon) return { title: "COCHON !", subtitle: `Ou pran an koshon ! 🐷` };
        if (isMancheOver) return { title: "MANCHE TERMINÉE", subtitle: `An lòt zetwal !` };
        if (isBoude) return { title: "BOUDÉ !", subtitle: "Pèsonn pa ganyé." };
        return { title: "VICTOIRE !", subtitle: `An lòt zetwal !` };
    };

    const headerInfo = renderHeader();

    // If match is over, we show the full screen podium instead of a card
    if (isMatchOver || isBoude) {
        // Special Podium Layout for Match End AND Boude
        const roundWinnerId = gameState.firstPlayerOfRound || (gameState.players.find(p => p.hand.length === 0)?.id);
        const finalWinner = isBoude ? null : (winner || gameState.players[0]);

        // Sort players to put winner in the middle [RunnerUp, Winner, Third]
        // If 2 players: [Winner, RunnerUp]
        // If 3 players: [P2, P1, P3] where P1 is winner
        let sortedPlayers = [...gameState.players];

        // For Boude, find the one with min points
        const boudeWinnerId = isBoude ? (() => {
            const scores = gameState.players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand) }));
            const minScore = Math.min(...scores.map(s => s.score));
            const winners = scores.filter(s => s.score === minScore);
            return winners.length === 1 ? winners[0].id : null;
        })() : null;
        const boudeWinner = gameState.players.find(p => p.id === boudeWinnerId);

        const currentWinnerId = isBoude ? boudeWinnerId : finalWinner?.id;

        if (gameState.players.length === 3) {
            const p1 = gameState.players.find(p => p.id === currentWinnerId) || gameState.players[0];
            const others = gameState.players.filter(p => p.id !== p1.id);
            sortedPlayers = [others[0], p1, others[1]];
        } else if (gameState.players.length === 2) {
            const p1 = gameState.players.find(p => p.id === currentWinnerId) || gameState.players[0];
            const p2 = gameState.players.find(p => p.id !== p1.id) || gameState.players[1];
            sortedPlayers = [p1, p2];
        }

        return (
            <View style={styles.container} pointerEvents="box-none">
                <Animated.View style={[styles.backdrop, { opacity: opacityValue }]} />
                <Animated.View style={[
                    styles.podiumContainer,
                    { transform: [{ scale: scaleValue }], opacity: opacityValue }
                ]}>
                    <BlurView intensity={Platform.OS === 'ios' ? 30 : 100} tint="dark" style={StyleSheet.absoluteFill} />

                    <Text style={styles.podiumHeader}>{isBoude ? "PARTIE BLOQUÉE !" : "FIN DE MATCH"}</Text>

                    <View style={styles.podiumRow}>
                        {sortedPlayers.map((p, idx) => (
                            isBoude ? (
                                <BoudeCard
                                    key={p.id}
                                    player={p}
                                    isWinner={p.id === boudeWinner?.id}
                                    handPoints={calculateHandPoints(p.hand)}
                                />
                            ) : (
                                <PodiumCard
                                    key={p.id}
                                    player={p}
                                    isWinner={finalWinner ? p.id === finalWinner.id : false}
                                    totalPoints={
                                        gameState.gameMode === 'SCORE' ? p.totalPoints :
                                            gameState.gameMode === 'COCHON' ? p.totalCochons :
                                                p.mancheWins
                                    }
                                />
                            )
                        ))}
                    </View>

                    {isMatchOver && (
                        <View style={styles.gainsContainer}>
                            <Text style={styles.gainsText}>Vos gains :</Text>
                            <Text style={styles.gainsValue}>+180 🟡</Text>
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        {isMatchOver && (
                            <TouchableOpacity
                                style={styles.menuButton}
                                onPress={onLeave || onContinue}
                            >
                                <Text style={styles.buttonTextLight}>Menu principal</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.newGameButton}
                            onPress={onContinue}
                        >
                            <Text style={styles.buttonTextDark}>{isBoude ? "CONTINUER" : "Nouvelle partie"}</Text>
                            <Ionicons name={isBoude ? "arrow-forward" : "play"} size={20} color="#064e3b" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        );
    }

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
                            <Text style={styles.winnerAvatarName}>{winner.name}</Text>
                        </Animated.View>
                    )}

                    {isChire && <Text style={styles.bigEmoji}>😱</Text>}
                    {isBoude && <Text style={styles.bigEmoji}>🛑</Text>}

                    <Text style={styles.title}>{headerInfo.title}</Text>
                    <Text style={styles.subtitle}>{headerInfo.subtitle}</Text>
                </View>

                {/* Content Panel (Right side in Landscape) */}
                <View style={styles.rightPanel}>
                    {/* Info / Stats Section */}
                    <ScrollView
                        style={styles.infoSection}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Dynamic Content based on event */}
                        <View style={styles.dynamicContent}>
                            {mode === 'SIMPLE_WIN' && (
                                <View style={styles.resultsTable}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.columnHeader, { flex: 2.5, textAlign: 'left' }]}>JOUEUR</Text>
                                        <Text style={[styles.columnHeader, { flex: 1.5 }]}>⭐</Text>
                                    </View>
                                    {gameState.players.map(p => (
                                        <View key={p.id} style={styles.tableRow}>
                                            <Text style={[styles.cell, { flex: 2.5, textAlign: 'left' }]} numberOfLines={1}>{p.name}</Text>
                                            <Text style={[styles.cell, { flex: 1.5 }]}>{p.currentMancheStars} ⭐</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {mode === 'MANCHE_END' && (
                                <View style={styles.resultsTable}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.columnHeader, { flex: 2.5, textAlign: 'left' }]}>Joueur</Text>
                                        <Text style={[styles.columnHeader, { flex: 1.5 }]}>Pts</Text>
                                        <Text style={[styles.columnHeader, { flex: 0.8 }]}>🐷</Text>
                                        <Text style={[styles.columnHeader, { flex: 1.5 }]}>⭐</Text>
                                    </View>
                                    {gameState.players.map(p => {
                                        const latestManche = gameState.mancheHistory?.[gameState.mancheHistory.length - 1];
                                        const points = latestManche?.points[p.id] || 0;
                                        const isMancheWinner = p.id === latestManche?.winnerId;
                                        const pigsGiven = isMancheWinner ? (latestManche?.cochonCount || 0) : 0;

                                        return (
                                            <View key={p.id} style={styles.tableRow}>
                                                <Text style={[styles.cell, { flex: 2.5, textAlign: 'left' }]} numberOfLines={1}>{p.name}</Text>
                                                <Text style={[styles.cell, { flex: 1.5, fontWeight: '900', color: points > 0 ? '#4CAF50' : points < 0 ? '#d32f2f' : '#333' }]}>
                                                    {points > 0 ? `+${points}` : points}
                                                </Text>
                                                <Text style={[styles.cell, { flex: 0.8 }]}>{pigsGiven > 0 ? `${pigsGiven} 🐷` : '-'}</Text>
                                                <Text style={[styles.cell, { flex: 1.5 }]}>{p.currentMancheStars} ⭐</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {isBoude && (
                                <View style={styles.resultsTable}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.columnHeader, { flex: 2.5, textAlign: 'left' }]}>Joueur</Text>
                                        <Text style={[styles.columnHeader, { flex: 1.5 }]}>⭐</Text>
                                    </View>
                                    {gameState.players.map(p => (
                                        <View key={p.id} style={styles.tableRow}>
                                            <Text style={[styles.cell, { flex: 2.5, textAlign: 'left' }]} numberOfLines={1}>{p.name}</Text>
                                            <Text style={[styles.cell, { flex: 1.5 }]}>{p.currentMancheStars} ⭐</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {isChire && (
                                <Text style={styles.explanation}>
                                    Tout moun a zéro !
                                </Text>
                            )}

                            {isCochon && (
                                <Text style={styles.explanation}>
                                    {gameState.players.filter(p => p.currentMancheStars === 0).length === 1
                                        ? "1 joueur est Cochon !"
                                        : `${gameState.players.filter(p => p.currentMancheStars === 0).length} joueurs sont Cochons !`}
                                </Text>
                            )}

                            {/* Mini Score Summary removed (podium) */}
                        </View>
                    </ScrollView>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, isMancheOver && styles.actionButtonGold]}
                        onPress={onContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.actionButtonText, isMancheOver && styles.actionButtonTextGold]}>
                            {isMancheOver ? "MANCHE SUIVANTE" : "CONTINUER"}
                        </Text>
                        <Ionicons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Leave Button removed from here (moved to podium) */}
            </Animated.View>
        </View>
    );
};

// --- HELPER COMPONENT FOR BOUDE CARDS ---
const BoudeCard = ({ player, isWinner, handPoints }: { player: Player, isWinner: boolean, handPoints: number }) => {
    return (
        <Animated.View
            entering={ZoomIn.delay(isWinner ? 200 : 400).duration(600)}
            style={[styles.podiumCardBoude, isWinner && styles.podiumCardWinnerBoude, styles.boudeCard]}
        >
            {isWinner && (
                <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
            )}

            <Image
                source={getAvatarImage(player.avatarId as AvatarId || 'avatar_default')}
                style={[styles.podiumAvatar, isWinner && styles.podiumAvatarWinner, { marginBottom: 5 }]}
            />

            <Text style={styles.podiumNameBoude} numberOfLines={1}>{player.name}</Text>

            <Text style={[styles.boudePoints, isWinner ? styles.pointsWinner : styles.pointsLoser]}>
                {handPoints} pts
            </Text>

            <View style={styles.boudeHand}>
                {player.hand.map((domino, idx) => (
                    <View key={domino.id || idx} style={styles.miniDominoWrapper}>
                        <DominoTile
                            left={domino.left}
                            right={domino.right}
                            size={45}
                            noMargin
                            entering={FadeIn.delay(600 + idx * 100)}
                        />
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

// --- HELPER COMPONENT FOR PODIUM CARDS ---
const PodiumCard = ({ player, isWinner, totalPoints }: { player: Player, isWinner: boolean, totalPoints: number }) => {
    return (
        <Animated.View
            entering={ZoomIn.delay(isWinner ? 200 : 400).duration(600)}
            style={[styles.podiumCard, isWinner && styles.podiumCardWinner]}
        >
            {isWinner && (
                <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
            )}

            <View style={styles.cardGlowContainer}>
                <Image
                    source={getAvatarImage(player.avatarId as AvatarId || 'avatar_default')}
                    style={[styles.podiumAvatar, isWinner && styles.podiumAvatarWinner]}
                />
                {isWinner && <Text style={styles.podiumCrown}>👑</Text>}
            </View>

            <Text style={styles.podiumName} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.podiumScore}>{totalPoints}</Text>

            {/* Added for visual flair like in the screenshot */}
            <TouchableOpacity style={styles.podiumAction}>
                <Ionicons name="person-add" size={16} color="white" />
            </TouchableOpacity>
        </Animated.View>
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
        backgroundColor: '#FDF5E6', // OPAQUE Premium Light (Old Lace)
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
        width: '90%',
        maxWidth: 640,
        height: 320,
        minHeight: 320,
    },
    visualSection: {
        width: '35%',
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
    winnerAvatarName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bigEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 28, // Slightly larger
        fontWeight: '900',
        color: '#FFFFFF', // Keep White on colored gradient background
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
    rightPanel: {
        flex: 1,
        backgroundColor: '#FDF5E6', // Match Card BG
        flexDirection: 'column',
    },
    infoSection: {
        padding: 24,
        flex: 1, // Fill remaining space in its container
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
        fontSize: 20,
        color: '#1a1a1a', // Dark text for easy reading
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 26,
    },
    miniScoreboard: {
        width: '100%',
        marginTop: 5,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    miniScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    miniScoreName: {
        fontSize: 15,
        color: '#333',
    },
    miniScoreValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
    },
    bold: {
        fontWeight: 'bold',
        color: '#000',
    },
    resultsTable: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        marginBottom: 4,
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: '#888',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    cell: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#000000', // Pitch black for contrast
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 40,
        alignItems: 'center',
        gap: 10,
        minWidth: 200,
        alignSelf: 'center',
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
        fontSize: 16, // Smaller text
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
        borderColor: '#aaa',
        paddingVertical: 12,
        elevation: 0,
        shadowOpacity: 0,
    },
    secondaryButtonText: {
        color: '#444',
        fontSize: 15, // Visible
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    // --- NEW PODIUM STYLES ---
    podiumContainer: {
        flex: 1,
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    podiumRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
        marginBottom: 30,
    },
    podiumCard: {
        width: 140, // Back to original green style size
        backgroundColor: 'rgba(15, 80, 60, 0.9)', // Translucent Deep Green
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        height: 180,
    },
    podiumCardWinner: {
        width: 160,
        height: 220,
        borderColor: '#FFD700', // Gold for match winner
        borderWidth: 2,
        backgroundColor: 'rgba(20, 100, 80, 0.98)',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    // --- BOUDE SPECIFIC CARDS ---
    podiumCardBoude: {
        width: 180,
        backgroundColor: 'rgba(230, 230, 230, 0.9)', // Premium Light Gray
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        height: 200,
    },
    podiumCardWinnerBoude: {
        width: 200,
        height: 240,
        borderColor: '#4ADE80', // Glowing green border
        borderWidth: 2,
        backgroundColor: 'rgba(245, 245, 245, 0.98)',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    winnerBadge: {
        position: 'absolute',
        top: -15,
        backgroundColor: '#DC2626', // Vibrant red
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    winnerBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    cardGlowContainer: {
        marginBottom: 10,
        position: 'relative',
    },
    podiumAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    podiumAvatarWinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderColor: '#FFD700', // Gold border for winner
    },
    podiumCrown: {
        position: 'absolute',
        top: -20,
        alignSelf: 'center',
        fontSize: 24,
    },
    podiumName: {
        color: '#4ADE80', // Emerald for match end
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    podiumNameBoude: {
        color: '#064e3b', // Dark green for gray card
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    podiumScore: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
    },
    podiumAction: {
        position: 'absolute',
        bottom: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 6,
        borderRadius: 6,
    },
    gainsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    gainsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    gainsValue: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: '900',
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 10,
    },
    menuButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newGameButton: {
        backgroundColor: '#4ADE80', // Vibrant emerald green
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        // Elevation for premium feel
        shadowColor: '#4ADE80',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonTextLight: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonTextDark: {
        color: '#064e3b', // Dark green for contrast on light green button
        fontWeight: '800',
        fontSize: 16,
    },
    // --- NEW BOUDE STYLES ---
    boudeCard: {
        height: 380, // Taller to fit hand and tripled dominoes
        justifyContent: 'flex-start',
        paddingTop: 20,
    },
    boudePoints: {
        fontSize: 22,
        fontWeight: '900',
        marginVertical: 5,
    },
    pointsWinner: {
        color: '#059669', // Stronger Green for contrast
    },
    pointsLoser: {
        color: '#374151', // Dark UI Gray
    },
    boudeHand: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
        width: '100%',
    },
    miniDominoWrapper: {
        transform: [{ scale: 0.8 }],
    },
});

