import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GameRoom, GameMode } from '../core/types';
import { FadeIn, FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../core/avatars';
import { updateRoomSettings } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';

interface LobbyScreenProps {
    roomData: GameRoom;
    currentUserId: string;
    onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomData, currentUserId, onStartGame }) => {
    const isHost = roomData.players[0]?.uid === currentUserId;
    const canStart = roomData.players.length === 3;
    const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
    const hasAutoStarted = useRef(false);

    const [gameMode, setGameMode] = useState<GameMode>(roomData.gameMode || 'MANCHE');
    const [winningCondition, setWinningCondition] = useState(roomData.winningCondition || 3);
    const [turnDuration, setTurnDuration] = useState(roomData.turnDuration || 15);

    // Sync settings to Firebase when host changes them
    useEffect(() => {
        if (isHost && (
            gameMode !== roomData.gameMode ||
            winningCondition !== roomData.winningCondition ||
            turnDuration !== roomData.turnDuration
        )) {
            updateRoomSettings(roomData.roomId, { gameMode, winningCondition, turnDuration });
        }
    }, [gameMode, winningCondition, turnDuration, isHost]);

    // Update local state when room data changes (for non-hosts)
    useEffect(() => {
        if (!isHost) {
            if (roomData.gameMode) setGameMode(roomData.gameMode);
            if (roomData.winningCondition) setWinningCondition(roomData.winningCondition);
            if (roomData.turnDuration !== undefined) setTurnDuration(roomData.turnDuration);
        }
    }, [roomData.gameMode, roomData.winningCondition, roomData.turnDuration, isHost]);

    // AUTO-START: Lancer automatiquement la partie dès que 3 joueurs sont présents
    // LOGIQUE DE FALLBACK:
    // - L'hôte (position 0) démarre après 2 secondes
    // - Les autres joueurs démarrent après 5 secondes (fallback si l'hôte est absent/déconnecté)
    useEffect(() => {
        if (!canStart || hasAutoStarted.current) {
            return;
        }

        const delay = isHost ? 2000 : 5000; // 2s pour l'hôte, 5s pour les autres

        console.log(`🎮 3 joueurs détectés - Démarrage ${isHost ? 'prioritaire (hôte)' : 'fallback'} dans ${delay / 1000}s...`);

        // Démarrer le compte à rebours visuel (toujours 2s pour l'affichage)
        setAutoStartCountdown(2);

        const countdownInterval = setInterval(() => {
            setAutoStartCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        // Lancer la partie après le délai approprié
        const autoStartTimer = setTimeout(() => {
            if (roomData.players.length === 3 && !hasAutoStarted.current) {
                hasAutoStarted.current = true;
                console.log(`🚀 Lancement automatique ${isHost ? 'par l\'hôte' : 'par fallback'} !`);
                onStartGame();
            }
        }, delay);

        return () => {
            clearTimeout(autoStartTimer);
            clearInterval(countdownInterval);
        };
    }, [canStart, isHost, roomData.players.length, onStartGame]);

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
                            <Text style={styles.emptyText}>Attente...</Text>
                        </>
                    ) : (
                        // Occupied Slot
                        <>
                            <View style={[styles.avatar, slot.isCurrentUser && styles.avatarHighlight, { overflow: 'hidden' }]}>
                                {slot.player?.avatarId && AVAILABLE_AVATARS.includes(slot.player.avatarId as AvatarId) ? (
                                    <Image
                                        source={getAvatarImage(slot.player.avatarId)}
                                        style={{
                                            width: 80 * 1.6,
                                            height: 80 * 1.6,
                                            position: 'absolute',
                                            top: -(80 * 1.6 - 80) * 0.25,
                                        }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Image
                                        source={getAvatarImage('avatar_01')}
                                        style={{
                                            width: 80 * 1.6,
                                            height: 80 * 1.6,
                                            position: 'absolute',
                                            top: -(80 * 1.6 - 80) * 0.25,
                                        }}
                                        resizeMode="cover"
                                    />
                                )}
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
                <Text style={styles.roomCode}>Code : {roomData.roomId}</Text>
            </Animated.View>

            {/* Player Cards - Center */}
            <View style={styles.playersContainer}>
                {slots.map((slot, index) => renderPlayerCard(slot, index))}
            </View>

            {/* Game Options - Middle Section */}
            <Animated.View entering={FadeIn.delay(400)} style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>CONFIGURATIONS DE LA TABLE</Text>

                <View style={[styles.optionsRow, { flexWrap: 'wrap', justifyContent: 'center' }]}>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionLabel}>MODE DE JEU</Text>
                        {isHost ? (
                            <View style={styles.buttonGroup}>
                                {(['MANCHE', 'SCORE', 'COCHON'] as GameMode[]).map(mode => (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[styles.modeButton, gameMode === mode && styles.activeModeButton]}
                                        onPress={() => setGameMode(mode)}
                                    >
                                        <Text style={[styles.modeButtonText, gameMode === mode && styles.activeModeButtonText]}>
                                            {mode}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.readOnlyValue}>
                                <Text style={styles.optionValue}>{gameMode}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.optionItem}>
                        <Text style={styles.optionLabel}>CONDITION : <Text style={styles.winningValueText}>{winningCondition}</Text></Text>
                        {isHost ? (
                            <View style={styles.conditionControls}>
                                <TouchableOpacity
                                    onPress={() => setWinningCondition(Math.max(1, winningCondition - 1))}
                                    style={styles.adjustButton}
                                >
                                    <Ionicons name="remove-circle-outline" size={28} color="#FFD700" />
                                </TouchableOpacity>
                                <Text style={styles.conditionValueText}>{winningCondition}</Text>
                                <TouchableOpacity
                                    onPress={() => setWinningCondition(Math.min(100, winningCondition + 1))}
                                    style={styles.adjustButton}
                                >
                                    <Ionicons name="add-circle-outline" size={28} color="#FFD700" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.readOnlyValue}>
                                <Text style={styles.optionValue}>{winningCondition} {gameMode === 'MANCHE' ? 'Manches' : gameMode === 'SCORE' ? 'Points' : 'Cochons'}</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.optionItem, { minWidth: '100%', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15 }]}>
                        <Text style={styles.optionLabel}>DURÉE DU TOUR : <Text style={styles.winningValueText}>{turnDuration === 0 ? 'Illimité' : `${turnDuration}s`}</Text></Text>
                        {isHost ? (
                            <View style={styles.conditionControls}>
                                <TouchableOpacity
                                    onPress={() => setTurnDuration(Math.max(0, turnDuration - 5))}
                                    style={styles.adjustButton}
                                >
                                    <Ionicons name="remove-circle-outline" size={28} color="#FFD700" />
                                </TouchableOpacity>
                                <Text style={styles.conditionValueText}>{turnDuration === 0 ? 'Off' : turnDuration}</Text>
                                <TouchableOpacity
                                    onPress={() => setTurnDuration(Math.min(60, turnDuration + 5))}
                                    style={styles.adjustButton}
                                >
                                    <Ionicons name="add-circle-outline" size={28} color="#FFD700" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.readOnlyValue}>
                                <Text style={styles.optionValue}>{turnDuration === 0 ? 'Sans limite' : `${turnDuration} secondes`}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>

            {/* Action Button - Bottom */}
            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.footer}>
                {isHost ? (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, !canStart && styles.actionButtonDisabled]}
                            onPress={() => {
                                if (canStart && !hasAutoStarted.current) {
                                    hasAutoStarted.current = true;
                                    onStartGame();
                                }
                            }}
                            disabled={!canStart}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={canStart ? ['#4CAF50', '#2E7D32'] : ['#555', '#333']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.actionButtonText}>
                                    {autoStartCountdown !== null
                                        ? `DÉMARRAGE DANS ${autoStartCountdown}...`
                                        : canStart
                                            ? 'JOUER'
                                            : `ATTENDRE ${3 - roomData.players.length} PLUS`}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        {autoStartCountdown !== null && (
                            <Text style={styles.autoStartHint}>
                                Appuyez pour démarrer immédiatement
                            </Text>
                        )}
                    </>
                ) : (
                    <View style={styles.waitingContainer}>
                        <Text style={styles.waitingText}>
                            {autoStartCountdown !== null
                                ? `Démarrage dans ${autoStartCountdown}...`
                                : 'En attente du hote...'}
                        </Text>
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
        padding: 16,
        alignItems: 'center',
        minHeight: 160,
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
    autoStartHint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontStyle: 'italic',
        marginTop: 12,
        textAlign: 'center',
    },
    // Options Section
    optionsSection: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 2,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    optionItem: {
        flex: 1,
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    buttonGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 4,
        width: '100%',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeModeButton: {
        backgroundColor: '#FFD700',
    },
    modeButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeModeButtonText: {
        color: '#000',
    },
    conditionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    adjustButton: {
        padding: 5,
    },
    conditionValueText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        minWidth: 40,
        textAlign: 'center',
    },
    readOnlyValue: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
    },
    optionValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    winningValueText: {
        color: '#FFD700',
    },
});
