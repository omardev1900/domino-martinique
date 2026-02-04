import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameRoom } from '../core/types';
import { FadeIn, FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LobbyScreenProps {
    roomData: GameRoom;
    currentUserId: string;
    onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomData, currentUserId, onStartGame }) => {
    const isHost = roomData.players[0]?.uid === currentUserId;
    const canStart = roomData.players.length === 3;

    // Create array of 3 slots with player data
    const slots = Array.from({ length: 3 }, (_, index) => {
        const player = roomData.players[index];
        return {
            player,
            isCurrentUser: player?.uid === currentUserId,
            isHost: index === 0,
            isEmpty: !player,
        };
    });

    const renderPlayerCard = (slot: typeof slots[0], index: number) => {
        const getInitials = (name: string) => {
            return name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        };

        return (
            <Animated.View
                key={index}
                entering={FadeInUp.delay(200 + index * 100).duration(500)}
                style={styles.playerCardWrapper}
            >
                <View
                    style={[
                        styles.playerCard,
                        slot.isCurrentUser && styles.playerCardHighlight,
                    ]}
                >
                    {slot.isEmpty ? (
                        // Empty Slot
                        <>
                            <View style={styles.emptyAvatar}>
                                <Text style={styles.silhouetteIcon}>👤</Text>
                            </View>
                            <Text style={styles.emptyText}>Waiting...</Text>
                        </>
                    ) : (
                        // Occupied Slot
                        <>
                            <View style={[styles.avatar, slot.isCurrentUser && styles.avatarHighlight]}>
                                <Text style={styles.avatarText}>
                                    {getInitials(slot.player!.displayName)}
                                </Text>
                            </View>
                            <Text style={styles.playerName}>
                                {slot.player!.displayName}
                            </Text>
                            <Text style={styles.playerStatus}>
                                {slot.isCurrentUser ? '(You)' : slot.isHost ? 'HOST' : 'Player'}
                            </Text>
                        </>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            {/* Room Code - Top */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
                <Text style={styles.roomCodeLabel}>Room Code</Text>
                <Text style={styles.roomCode}>{roomData.roomId}</Text>
            </Animated.View>

            {/* Player Cards - Center */}
            <View style={styles.playersContainer}>
                {slots.map((slot, index) => renderPlayerCard(slot, index))}
            </View>

            {/* Action Button - Bottom */}
            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.footer}>
                {isHost ? (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, !canStart && styles.actionButtonDisabled]}
                            onPress={onStartGame}
                            disabled={!canStart}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={canStart ? ['#4CAF50', '#2E7D32'] : ['#555', '#333']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.actionButtonText}>
                                    {canStart ? 'START GAME' : `WAITING FOR ${3 - roomData.players.length} MORE`}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.waitingContainer}>
                        <Text style={styles.waitingText}>Waiting for host to start...</Text>
                    </View>
                )}
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 40,
        paddingVertical: 30,
    },
    // Header
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    roomCodeLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    roomCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 3,
        fontFamily: 'monospace',
    },
    // Player Cards Container
    playersContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        paddingHorizontal: 20,
    },
    playerCardWrapper: {
        flex: 1,
        maxWidth: 200,
    },
    playerCard: {
        backgroundColor: 'rgba(30,30,30,0.7)',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 24,
        alignItems: 'center',
        minHeight: 200,
        justifyContent: 'center',
    },
    playerCardHighlight: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.1)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    // Avatar
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(76,175,80,0.3)',
        borderWidth: 3,
        borderColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarHighlight: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.2)',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    emptyAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    silhouetteIcon: {
        fontSize: 40,
        opacity: 0.4,
    },
    playerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    playerStatus: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: '600',
        letterSpacing: 1,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    // Footer
    footer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    actionButton: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        paddingVertical: 20,
        paddingHorizontal: 50,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    waitingContainer: {
        paddingVertical: 20,
    },
    waitingText: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
});
