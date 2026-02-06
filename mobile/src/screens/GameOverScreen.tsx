import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { GameState, Player } from '../core/types';
import Animated, { FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { WINS_TO_WIN_MATCH } from '../core/constants';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';

interface GameOverScreenProps {
    gameState: GameState;
    currentUserId: string;
    onReplay: () => void;
    onNextRound?: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState, currentUserId, onReplay, onNextRound }) => {
    const [countdown, setCountdown] = useState(10);

    // Determine context
    const isMatchOver = gameState.players.some(p => p.wins >= WINS_TO_WIN_MATCH);
    const isBoudé = gameState.phase === 'BOUDE';

    // Game Effects on mount (skip during BOUDE - resolution is pending)
    useEffect(() => {
        // Don't play win/lose sounds during BOUDE - wait for resolution
        if (isBoudé) return;

        const sortedPlayers = [...gameState.players].sort((a, b) => b.wins - a.wins);
        const isWinner = sortedPlayers[0].id === currentUserId;

        if (isWinner) {
            SoundManager.playSound('win');
            HapticManager.triggerSuccess();
        } else {
            SoundManager.playSound('lose');
        }
    }, [gameState.gameId, currentUserId, isBoudé]);

    // Play specific sound for BOUDE phase
    useEffect(() => {
        if (isBoudé) {
            SoundManager.playSound('boude');
            HapticManager.triggerImpact(); // Add impact for reinforcement
        }
    }, [isBoudé]);

    // Auto-restart countdown for next round (skip during BOUDE - parent handles resolution)
    useEffect(() => {
        // Don't run countdown during BOUDE phase - parent will handle resolution
        if (isBoudé) return;
        if (isMatchOver) return;
        if (!onNextRound) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isMatchOver, isBoudé, onNextRound]);

    // Separate effect to call onNextRound when countdown reaches 0
    useEffect(() => {
        if (countdown === 0 && !isMatchOver && !isBoudé && onNextRound) {
            // Use setTimeout to defer state update to next tick
            const timeout = setTimeout(() => {
                onNextRound();
            }, 0);
            return () => clearTimeout(timeout);
        }
    }, [countdown, isMatchOver, isBoudé, onNextRound]);

    // Find winner
    // If match over, it's the one with 3 wins.
    // If round over, it's the one who played last or has lowest points (firstPlayerOfRound usually set to winner)
    // Detailed logic depends on how handleEndOfRound sets state.

    // Simple display based on state
    const sortedPlayers = [...gameState.players].sort((a, b) => b.wins - a.wins);

    return (
        <View style={styles.container}>
            <View style={styles.overlay} />

            <Animated.View entering={ZoomIn.duration(500)} style={styles.content}>
                <Text style={styles.header}>
                    {isBoudé ? "BOUDÉ !" : isMatchOver ? "MANCHE TERMINÉE" : "TOUR TERMINÉ"}
                </Text>

                {/* BOUDE Phase: Show only waiting message */}
                {isBoudé && (
                    <View style={styles.boudeContainer}>
                        <Text style={styles.boudeSubtitle}>
                            Jeu bloqué !
                        </Text>
                        <ActivityIndicator size="large" color="#ff6f00" style={styles.loader} />
                        <Text style={styles.boudeCalculating}>
                            Calcul des points en cours...
                        </Text>
                    </View>
                )}

                {/* Results Section: Only show when NOT in BOUDE phase */}
                {!isBoudé && (
                    <>
                        <View style={styles.resultsContainer}>
                            {sortedPlayers.map((p, index) => {
                                const isWinner = index === 0;
                                return (
                                    <Animated.View
                                        key={p.id}
                                        entering={SlideInDown.delay(index * 200)}
                                        style={[styles.playerRow, isWinner && styles.winnerRow]}
                                    >
                                        <Text style={[styles.rank, isWinner && styles.winnerText]}>#{index + 1}</Text>
                                        <Text style={[styles.name, isWinner && styles.winnerText]}>
                                            {p.name} {p.id === currentUserId ? "(You)" : ""}
                                        </Text>
                                        <View style={styles.scoreContainer}>
                                            <Text style={[styles.score, isWinner && styles.winnerText]}>{p.wins} Wins</Text>
                                            {p.isCochon && <Text style={styles.pigBadge}>🐷</Text>}
                                            {isMatchOver && (
                                                <Text style={[styles.points, p.isCochon && styles.pointsNegative]}>
                                                    {p.totalPoints >= 0 ? '+' : ''}{p.totalPoints} pts
                                                </Text>
                                            )}
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {/* Countdown - only show for ROUND_END, not MATCH_END */}
                        {!isMatchOver && countdown > 0 && (
                            <Text style={styles.countdownText}>
                                Prochain tour dans {countdown}s...
                            </Text>
                        )}

                        {/* Action buttons */}
                        <Animated.View entering={FadeIn.delay(1000)}>
                            <TouchableOpacity
                                style={styles.replayButton}
                                onPress={() => isMatchOver ? onReplay() : onNextRound?.()}
                            >
                                <Text style={styles.replayText}>
                                    {isMatchOver ? "Revenir au lobby" : `Démarrer le tour suivant${countdown > 0 ? ` (${countdown}s)` : ''}`}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    content: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        elevation: 10,
        alignItems: 'center',
    },
    header: {
        fontSize: 36,
        fontWeight: '900',
        color: '#d32f2f', // Red for intensity
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    resultsContainer: {
        width: '100%',
        marginBottom: 30,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    winnerRow: {
        backgroundColor: '#fff9c4', // Gold tint
        borderRadius: 10,
        borderBottomWidth: 0,
        marginVertical: 5,
        elevation: 2,
    },
    rank: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        width: 30,
    },
    name: {
        fontSize: 18,
        color: '#333',
        flex: 1,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    winnerText: {
        color: '#f57f17', // Dark Gold
    },
    pigBadge: {
        fontSize: 20,
        marginLeft: 10,
    },
    points: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2ecc71',
        marginLeft: 10,
    },
    pointsNegative: {
        color: '#e74c3c',
    },
    countdownText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    replayButton: {
        backgroundColor: '#1b5e20',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
    },
    replayText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    boudeSubtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff6f00',
        marginBottom: 10,
        textAlign: 'center',
    },
    boudeContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    loader: {
        marginVertical: 20,
    },
    boudeCalculating: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
