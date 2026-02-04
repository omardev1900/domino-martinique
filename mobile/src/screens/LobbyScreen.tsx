import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GameRoom } from '../core/types';
import { FadeIn, FadeInDown } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

interface LobbyScreenProps {
    roomData: GameRoom;
    currentUserId: string;
    onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomData, currentUserId, onStartGame }) => {
    const isHost = roomData.players[0]?.uid === currentUserId;
    const canStart = roomData.players.length === 3; // Require exactly 3 players

    return (
        <View style={styles.container}>
            <Animated.Text entering={FadeInDown.delay(100)} style={styles.title}>
                Room Code: {roomData.roomId}
            </Animated.Text>

            <Animated.View entering={FadeIn.delay(300)} style={styles.card}>
                <Text style={styles.subtitle}>Players ({roomData.players.length}/3)</Text>
                <ScrollView style={styles.playerList}>
                    {roomData.players.map((p, index) => (
                        <View key={p.uid} style={styles.playerItem}>
                            <Text style={styles.playerRank}>#{index + 1}</Text>
                            <Text style={styles.playerName}>
                                {p.displayName} {p.uid === currentUserId ? "(You)" : ""}
                            </Text>
                            {index === 0 && <Text style={styles.hostBadge}>HOST</Text>}
                        </View>
                    ))}
                    {Array.from({ length: 3 - roomData.players.length }).map((_, i) => (
                        <View key={`empty-${i}`} style={[styles.playerItem, styles.emptyItem]}>
                            <Text style={styles.emptyText}>Waiting for player...</Text>
                        </View>
                    ))}
                </ScrollView>
            </Animated.View>

            <View style={styles.footer}>
                {isHost ? (
                    <>
                        <TouchableOpacity
                            style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                            onPress={onStartGame}
                            disabled={!canStart}
                        >
                            <Text style={styles.startButtonText}>Start Game</Text>
                        </TouchableOpacity>
                        {!canStart && (
                            <Text style={styles.requirementText}>
                                Waiting for {3 - roomData.players.length} more player(s)...
                            </Text>
                        )}
                    </>
                ) : (
                    <Text style={styles.waitingText}>Waiting for host to start...</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b5e20', // Matching GameTable Logic
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    card: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: 400,
        marginBottom: 30,
    },
    subtitle: {
        fontSize: 18,
        color: '#ddd',
        marginBottom: 15,
        fontWeight: '600',
    },
    playerList: {
        maxHeight: 250,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    emptyItem: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    emptyText: {
        color: '#aaa',
        fontStyle: 'italic',
    },
    playerRank: {
        fontSize: 16,
        color: '#aaa',
        marginRight: 15,
        width: 20,
    },
    playerName: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        flex: 1,
    },
    hostBadge: {
        fontSize: 10,
        backgroundColor: '#ffd700',
        color: '#000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: 'bold',
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 60,
        paddingVertical: 18,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    startButtonDisabled: {
        backgroundColor: '#555',
        opacity: 0.5,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    waitingText: {
        color: '#bbb',
        fontSize: 16,
        fontStyle: 'italic',
        marginTop: 10,
    },
    requirementText: {
        color: '#ffd700',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
});
