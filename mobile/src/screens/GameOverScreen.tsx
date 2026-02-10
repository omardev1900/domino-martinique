import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Image } from 'react-native';
import { GameState, Player, PlayerId } from '../core/types';
import Animated, { FadeIn, ZoomIn, SlideInDown, ZoomInEasyUp } from 'react-native-reanimated';
import { WINS_TO_WIN_MATCH } from '../core/constants';
import { determineWinnerOnBoudé } from '../core/LogicEngine';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../core/avatars';

interface GameOverScreenProps {
    gameState: GameState;
    currentUserId: string;
    onReplay: () => void;
    onNextRound?: () => void;
    onRestartMatch?: () => void;
    onVoteRematch?: () => void;
    onLeaveRoom?: () => void;
    rematchVotes?: string[];
    isSolo?: boolean;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
    gameState,
    currentUserId,
    onReplay,
    onNextRound,
    onRestartMatch,
    onVoteRematch,
    onLeaveRoom,
    rematchVotes = [],
    isSolo
}) => {
    const [countdown, setCountdown] = useState(10);

    // Determine context
    const isMatchOver = gameState.phase === 'MATCH_END';
    const isMancheOver = gameState.phase === 'MANCHE_END' || isMatchOver;
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
        if (!isMancheOver) return; // Wait for round end if not even manche end
        if (!onNextRound) return;
        if (isSolo) return; // No auto-next round in solo mode

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
        if (countdown === 0 && isMancheOver && !isMatchOver && !isBoudé && onNextRound && !isSolo) {
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
    // Find winner of the CURRENT round
    const getRoundWinner = (): Player | null => {
        if (isBoudé) {
            // Use the authoritative engine logic to find the winner (including tie-breaks)
            const winnerId = determineWinnerOnBoudé(gameState.players);
            if (winnerId === 'TIE') return null;
            return gameState.players.find(p => p.id === winnerId) || null;
        } else {
            // In normal end, winner is the one with empty hand
            return gameState.players.find(p => p.hand.length === 0) || null;
        }
    };

    const roundWinner = getRoundWinner();
    const sortedPlayers = [...gameState.players].sort((a, b) => b.wins - a.wins);

    return (
        <View style={styles.container}>
            <View style={styles.overlay} />

            <Animated.View entering={ZoomIn.duration(500)} style={styles.content}>
                <Text style={styles.header}>
                    {isMatchOver
                        ? (gameState.mancheResult === 'CHIRE' ? "CHIRÉ !" : "MATCH TERMINÉ")
                        : isMancheOver ? (gameState.mancheResult === 'CHIRE' ? "CHIRÉ !" : "MANCHE TERMINÉE")
                            : isBoudé ? "BOUDÉ !" : "PARTIE TERMINÉE"}
                </Text>

                <View style={styles.gameModeBadge}>
                    <Text style={styles.gameModeText}>MODE {gameState.gameMode}</Text>
                </View>

                {/* WINNER SPOTLIGHT - Emotional Centerpiece */}
                {roundWinner ? (
                    <Animated.View entering={ZoomInEasyUp.duration(600).delay(200)} style={styles.winnerSpotlight}>
                        <View style={styles.avatarGlow}>
                            <View style={styles.avatarCircleBig}>
                                {roundWinner.avatarId && AVAILABLE_AVATARS.includes(roundWinner.avatarId as AvatarId) ? (
                                    <Image
                                        source={getAvatarImage(roundWinner.avatarId)}
                                        style={styles.winnerAvatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Image
                                        source={getAvatarImage('avatar_01')}
                                        style={styles.winnerAvatarImage}
                                        resizeMode="cover"
                                    />
                                )}
                            </View>
                            {gameState.mancheResult !== 'CHIRE' && (
                                <View style={styles.winnerBadge}>
                                    <Text style={styles.winnerBadgeText}>WINNER</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.winnerName}>
                            {gameState.mancheResult === 'CHIRE' ? "MATCH NUL" : roundWinner.name}
                        </Text>
                        {gameState.mancheResult === 'CHIRE' ? (
                            <Text style={styles.winReason}>Pas de cochon, la manche s'arrête !</Text>
                        ) : !isBoudé && (
                            <Text style={styles.winReason}>A posé tous ses dominos !</Text>
                        )}
                    </Animated.View>
                ) : isBoudé ? (
                    <Text style={styles.tieText}>ÉGALITÉ ! La partie est nulle et va être recommencée.</Text>
                ) : null}

                {/* BOUDE Details: Show points breakdown under the winner */}
                {isBoudé && (
                    <Animated.View entering={FadeIn.delay(800)} style={styles.boudeDetails}>
                        <View style={styles.pointsBreakdown}>
                            {gameState.players.map((p) => {
                                const points = p.hand.reduce((sum, d) => sum + d.left + d.right, 0);
                                const isWinner = roundWinner?.id === p.id;
                                return (
                                    <View key={p.id} style={styles.pointRow}>
                                        <Text style={[styles.pointName, isWinner && styles.pointWinner]}>
                                            {p.name} {isWinner ? '🏆' : ''}
                                        </Text>
                                        <Text style={[styles.pointValue, isWinner && styles.pointWinner]}>{points} pts</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <ActivityIndicator size="small" color="#ff6f00" style={styles.loader} />
                    </Animated.View>
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
                                            {p.name} {p.id === currentUserId ? "(Moi)" : ""}
                                        </Text>
                                        {!isSolo && rematchVotes.includes(p.id) && (
                                            <View style={styles.readyBadge}>
                                                <Text style={styles.readyBadgeText}>PRÊT</Text>
                                            </View>
                                        )}
                                        <View style={styles.scoreContainer}>
                                            <View style={styles.scoreColumn}>
                                                <Text style={[styles.scoreMain, isWinner && styles.winnerText]}>
                                                    {p.wins} {p.wins > 1 ? 'Wins' : 'Win'}
                                                </Text>
                                                {gameState.gameMode === 'MANCHE' && (
                                                    <Text style={styles.scoreSub}>
                                                        {p.mancheWins} {p.mancheWins > 1 ? 'Manches' : 'Manche'}
                                                    </Text>
                                                )}
                                            </View>

                                            {p.isCochon && <Text style={styles.pigBadge}>🐷</Text>}

                                            <View style={styles.scoreColumnEnd}>
                                                {gameState.gameMode === 'COCHON' && (
                                                    <Text style={styles.cochonCountLabel}>{p.totalCochons} 🐷</Text>
                                                )}
                                                {(isMatchOver || gameState.gameMode === 'SCORE' || p.totalPoints !== 0) && (
                                                    <Text style={[styles.points, p.totalPoints < 0 && styles.pointsNegative]}>
                                                        {p.totalPoints >= 0 ? '+' : ''}{p.totalPoints} pts
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {/* Countdown - only show for MANCHE_END, not MATCH_END, and not in solo */}
                        {isMancheOver && !isMatchOver && countdown > 0 && !isSolo && (
                            <Text style={styles.countdownText}>
                                Prochaine manche dans {countdown}s...
                            </Text>
                        )}

                        {/* Action buttons */}
                        <Animated.View entering={FadeIn.delay(1000)} style={styles.buttonContainer}>
                            {isMatchOver && isSolo && onRestartMatch && (
                                <TouchableOpacity
                                    style={[styles.replayButton, styles.restartMatchButton]}
                                    onPress={onRestartMatch}
                                >
                                    <Text style={styles.replayText}>Rejouer le match</Text>
                                </TouchableOpacity>
                            )}

                            {isMatchOver && !isSolo && (
                                <>
                                    {!rematchVotes.includes(currentUserId) && (
                                        <TouchableOpacity
                                            style={[styles.replayButton, styles.rematchButton]}
                                            onPress={onVoteRematch}
                                        >
                                            <Text style={styles.replayText}>Proposer une revanche</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.replayButton, styles.leaveButton]}
                                        onPress={onLeaveRoom}
                                    >
                                        <Text style={styles.replayText}>Quitter la table</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {isMancheOver && !isMatchOver && (
                                <TouchableOpacity
                                    style={styles.replayButton}
                                    onPress={() => onNextRound?.()}
                                >
                                    <Text style={styles.replayText}>
                                        {isSolo
                                            ? "Démarrer la manche suivante"
                                            : `Démarrer la manche suivante${countdown > 0 ? ` (${countdown}s)` : ''}`
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {isMatchOver && (
                                <TouchableOpacity
                                    style={styles.replayButton}
                                    onPress={() => onReplay()}
                                >
                                    <Text style={styles.replayText}>Retourner à l'accueil</Text>
                                </TouchableOpacity>
                            )}

                            {!isMancheOver && !isMatchOver && !isBoudé && (
                                <TouchableOpacity
                                    style={styles.replayButton}
                                    onPress={() => onNextRound?.()}
                                >
                                    <Text style={styles.replayText}>
                                        {isSolo ? "Tour suivant" : "Continuer"}
                                    </Text>
                                </TouchableOpacity>
                            )}
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
        fontSize: 16,
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
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    restartMatchButton: {
        backgroundColor: '#2e7d32', // Green for "Play Again"
        marginBottom: 4,
    },
    rematchButton: {
        backgroundColor: '#43a047',
        width: '100%',
        alignItems: 'center',
    },
    leaveButton: {
        backgroundColor: '#d32f2f',
        width: '100%',
        alignItems: 'center',
    },
    readyBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    readyBadgeText: {
        color: '#FFF',
        fontSize: 10,
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
        color: '#ff6f00',
        fontStyle: 'italic',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    pointsBreakdown: {
        width: '100%',
        backgroundColor: 'rgba(255, 111, 0, 0.05)',
        borderRadius: 12,
        padding: 15,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 111, 0, 0.2)',
    },
    pointRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    pointName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    pointValue: {
        fontSize: 16,
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    winnerSpotlight: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    avatarGlow: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 10,
    },
    avatarCircleBig: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f5f5f5',
        borderWidth: 4,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    winnerAvatarImage: {
        width: 100 * 1.6,
        height: 100 * 1.6,
        top: -(100 * 1.6 - 100) * 0.25,
    },
    winnerEmoji: {
        fontSize: 50,
    },
    winnerBadge: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    winnerBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
    },
    winnerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    winReason: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    boudeDetails: {
        width: '100%',
        alignItems: 'center',
    },
    pointWinner: {
        color: '#1b5e20',
        fontWeight: 'bold',
    },
    tieText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
        marginVertical: 20,
    },
    cochonCountLabel: {
        fontSize: 14,
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    scoreColumn: {
        flex: 1,
    },
    scoreColumnEnd: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    scoreMain: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scoreSub: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    gameModeBadge: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.5)',
        marginBottom: 15,
        alignSelf: 'center',
    },
    gameModeText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
