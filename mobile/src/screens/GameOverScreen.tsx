import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameState, Player } from '../core/types';
import Animated, { FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { WINS_TO_WIN_MATCH } from '../core/constants';

interface GameOverScreenProps {
    gameState: GameState;
    currentUserId: string;
    onReplay: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ gameState, currentUserId, onReplay }) => {
    // Determine context (Match Over vs Round Over)
    const isMatchOver = gameState.players.some(p => p.wins >= WINS_TO_WIN_MATCH);

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
                    {isMatchOver ? "MATCH OVER" : "ROUND OVER"}
                </Text>

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
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

                <Animated.View entering={FadeIn.delay(1000)}>
                    <TouchableOpacity style={styles.replayButton} onPress={onReplay}>
                        <Text style={styles.replayText}>
                            {isMatchOver ? "Back to Lobby" : "Next Round"}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
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
});
