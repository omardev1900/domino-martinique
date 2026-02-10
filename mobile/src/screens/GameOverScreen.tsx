import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator, Image, ScrollView } from 'react-native';
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
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();
    const isLandscape = screenWidth > screenHeight;
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

            <Animated.View entering={ZoomIn.duration(500)} style={[styles.content, isLandscape && styles.contentLandscape]}>
                {isLandscape ? (
                    <View style={styles.landscapeWrapper}>
                        {/* LEFT COLUMN: Result Summary & Winner */}
                        <View style={styles.leftColumn}>
                            <Text style={[styles.header, styles.headerLandscape]}>
                                {isMatchOver
                                    ? (gameState.mancheResult === 'CHIRE' ? "CHIRÉ !" : "MATCH\nTERMINÉ")
                                    : isMancheOver ? (gameState.mancheResult === 'CHIRE' ? "CHIRÉ !" : "MANCHE\nTERMINÉE")
                                        : isBoudé ? "BOUDÉ !" : "PARTIE\nTERMINÉE"}
                            </Text>

                            <View style={[styles.gameModeBadge, styles.gameModeBadgeLandscape]}>
                                <Text style={styles.gameModeText}>MODE {gameState.gameMode}</Text>
                            </View>

                            {roundWinner && (
                                <View style={styles.winnerSpotlightLandscape}>
                                    <View style={styles.avatarCircleLandscape}>
                                        <Image
                                            source={getAvatarImage((roundWinner.avatarId as AvatarId) || 'avatar_01')}
                                            style={styles.avatarImageLandscape}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <Text style={styles.winnerNameLandscape}>
                                        {gameState.mancheResult === 'CHIRE' ? "MATCH NUL" : roundWinner.name}
                                    </Text>
                                    <Text style={styles.winReasonLandscape}>
                                        {gameState.mancheResult === 'CHIRE' ? "Pas de cochon" : "A posé ses dominos"}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* RIGHT COLUMN: Results & Actions */}
                        <View style={styles.rightColumn}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.resultsContainerLandscape}>
                                    {sortedPlayers.map((p, index) => (
                                        <View key={p.id} style={[styles.playerRow, index === 0 && styles.winnerRow, { paddingVertical: 6 }]}>
                                            <Text style={styles.rank}>#{index + 1}</Text>
                                            <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                                            <View style={styles.scoreColumnEnd}>
                                                <Text style={styles.scoreMain}>{p.wins} Win</Text>
                                                <Text style={styles.points}>+{p.totalPoints} pts</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.buttonContainerLandscape}>
                                    {(isMancheOver || isBoudé) && !isMatchOver && (
                                        <TouchableOpacity style={[styles.actionButton, styles.nextRoundButton]} onPress={onNextRound}>
                                            <Text style={styles.actionButtonText}>
                                                {isBoudé ? "Calculer les points" : "Manche suivante"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {!isMancheOver && !isMatchOver && !isBoudé && (
                                        <TouchableOpacity style={[styles.actionButton, styles.nextRoundButton]} onPress={onNextRound}>
                                            <Text style={styles.actionButtonText}>Tour suivant</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Exit Button */}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.homeButton, !isSolo && { backgroundColor: '#d32f2f' }]}
                                        onPress={isSolo ? onReplay : onLeaveRoom}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {isSolo ? "Quitter" : "Quitter la table"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ width: '100%' }}
                        contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}
                    >
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
                            <Animated.View entering={ZoomInEasyUp.duration(600).delay(200)} style={[styles.winnerSpotlight, isLandscape && { marginBottom: 10 }]}>
                                <View style={styles.avatarGlow}>
                                    <View style={[styles.avatarCircleBig, isLandscape && { width: 60, height: 60 }]}>
                                        {roundWinner.avatarId && AVAILABLE_AVATARS.includes(roundWinner.avatarId as AvatarId) ? (
                                            <Image
                                                source={getAvatarImage(roundWinner.avatarId)}
                                                style={[styles.winnerAvatarImage, isLandscape && { width: 60 * 1.6, height: 60 * 1.6, top: -(60 * 1.6 - 60) * 0.25 }]}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Image
                                                source={getAvatarImage('avatar_01')}
                                                style={[styles.winnerAvatarImage, isLandscape && { width: 60 * 1.6, height: 60 * 1.6, top: -(60 * 1.6 - 60) * 0.25 }]}
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
                                <Text style={[styles.winnerName, isLandscape && { fontSize: 18, marginTop: 2 }]}>
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
                    </ScrollView>
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
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        elevation: 10,
    },
    contentLandscape: {
        width: '95%',
        height: '90%',
        padding: 0,
        overflow: 'hidden',
    },
    landscapeWrapper: {
        flexDirection: 'row',
        flex: 1,
    },
    leftColumn: {
        flex: 0.45,
        backgroundColor: '#fff',
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
    },
    rightColumn: {
        flex: 0.55,
        backgroundColor: '#fafafa',
        padding: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: '900',
        color: '#d32f2f',
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    headerLandscape: {
        fontSize: 18,
        lineHeight: 22,
        marginBottom: 8,
    },
    resultsContainer: {
        width: '100%',
        marginBottom: 15,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
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
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 30,
    },
    replayText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 8,
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
    gameModeBadge: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
    },
    gameModeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    winnerSpotlight: {
        alignItems: 'center',
        marginBottom: 10,
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
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f5f5f5',
        borderWidth: 3,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    winnerAvatarImage: {
        width: 80 * 1.6,
        height: 80 * 1.6,
        top: -(80 * 1.6 - 80) * 0.25,
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
        fontSize: 20,
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
    scoreSub: {
        fontSize: 12,
        color: '#888',
    },
    gameModeBadgeLandscape: {
        marginBottom: 15,
        paddingVertical: 2,
    },
    winnerSpotlightLandscape: {
        alignItems: 'center',
        marginTop: 5,
    },
    avatarCircleLandscape: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#FFD700',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    avatarImageLandscape: {
        width: 60 * 1.6,
        height: 60 * 1.6,
        top: -(60 * 1.6 - 60) * 0.25,
        alignSelf: 'center',
    },
    winnerNameLandscape: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 4,
    },
    winReasonLandscape: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
    },
    resultsContainerLandscape: {
        width: '100%',
        marginBottom: 10,
    },
    buttonContainerLandscape: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        marginTop: 5,
    },
    actionButton: {
        backgroundColor: '#2e7d32',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
    },
    nextRoundButton: {
        backgroundColor: '#1b5e20',
    },
    homeButton: {
        backgroundColor: '#555',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    scoreColumnEnd: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    scoreMain: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
});
