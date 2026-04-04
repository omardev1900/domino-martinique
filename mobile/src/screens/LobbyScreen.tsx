import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { GameRoom, GameMode } from '../core/types';
import { FadeIn, FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../core/avatars';
import { EconomyHeader } from '../components/EconomyHeader';
import { AvatarFrame } from '../components/AvatarFrame';

interface LobbyScreenProps {
    roomData: GameRoom;
    currentUserId: string;
    onStartGame: () => void;
}

const MODE_LABELS: Record<string, string> = {
    MANCHE: 'Manche',
    SCORE: 'Score',
    COCHON: 'Cochon',
};

const MODE_UNIT_LABELS: Record<string, string> = {
    MANCHE: 'Manches',
    SCORE: 'Points',
    COCHON: 'Cochons',
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomData, currentUserId, onStartGame }) => {
    const isHost = roomData.players[0]?.uid === currentUserId;
    const canStart = roomData.players.length === 3;
    const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
    const hasAutoStarted = useRef(false);
    const rootRef = useRef<View>(null);

    // Give focus to root on mount (useful returning from game overlays)
    useEffect(() => {
        if (Platform.OS === 'web') {
            setTimeout(() => {
                (rootRef.current as any)?.focus?.();
            }, 100);
        }
    }, []);

    // Read options directly from room data (set at creation time)
    const gameMode = roomData.gameMode || 'MANCHE';
    const winningCondition = roomData.winningCondition || 3;
    const turnDuration = roomData.turnDuration ?? 15;
    const startingHandSize = roomData.startingHandSize || 7;

    // AUTO-START: Lancer automatiquement la partie dès que 3 joueurs sont présents
    useEffect(() => {
        if (!canStart || hasAutoStarted.current) {
            return;
        }

        const delay = isHost ? 2000 : 5000;

        console.log(`🎮 3 joueurs détectés - Démarrage ${isHost ? 'prioritaire (hôte)' : 'fallback'} dans ${delay / 1000}s...`);

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

    const shareToWhatsApp = () => {
        const message = `Rejoins ma table de Domino Martiniquais ! Code : ${roomData.roomId}`;

        let url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        // Web compatibility: use wa.me link
        if (Platform.OS === 'web') {
            url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        }

        Linking.openURL(url).catch(() => {
            // Fallback if WhatsApp is not installed or fails
            alert('WhatsApp ne semble pas être installé');
        });
    };

    const renderPlayerCard = (slot: typeof slots[0], index: number) => {
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
                        <>
                            <View style={styles.emptyAvatar}>
                                <Text style={styles.silhouetteIcon}>👤</Text>
                            </View>
                            <Text style={styles.emptyText}>Attente...</Text>
                        </>
                    ) : (
                        <>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                <View style={[styles.avatar, slot.isCurrentUser && styles.avatarHighlight, { overflow: 'hidden', marginBottom: 0 }]}>
                                    <Image
                                        source={getAvatarImage(slot.player?.avatarId || 'avatar_default')}
                                        style={{
                                            width: 80 * 1.6,
                                            height: 80 * 1.6,
                                            position: 'absolute',
                                            top: -(80 * 1.6 - 80) * 0.25,
                                        }}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                    />
                                </View>
                                {slot.player?.activeFrame && (
                                    <AvatarFrame frameId={slot.player.activeFrame} size={80} />
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
            colors={['#2D1B4E', '#1A0E2E']}
            style={styles.container}
            {...({ ref: rootRef, tabIndex: -1 } as any)}
        >
            <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
                <View style={styles.headerTop}>
                    <EconomyHeader />
                </View>
                <Text style={styles.roomCode}>Code : {roomData.roomId}</Text>
                {roomData.isPrivate ? (
                    <Text style={styles.roomTypeBadge}>🔒 Privée</Text>
                ) : (
                    <Text style={styles.roomTypeBadge}>🌍 Publique</Text>
                )}
            </Animated.View>

            {/* Share Button */}
            <Animated.View entering={FadeIn.delay(150)} style={styles.shareContainer}>
                <TouchableOpacity style={styles.shareButton} onPress={shareToWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                    <Text style={styles.shareButtonText}>Inviter via WhatsApp</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Player Cards - Center */}
            <View style={styles.playersContainer}>
                {slots.map((slot, index) => renderPlayerCard(slot, index))}
            </View>

            {/* Game Options - Read-Only */}
            <Animated.View entering={FadeIn.delay(400)} style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>CONFIGURATION DE LA TABLE</Text>
                <View style={styles.optionsRow}>
                    <View style={styles.optionChip}>
                        <Text style={styles.optionChipLabel}>Mode</Text>
                        <Text style={styles.optionChipValue}>{MODE_LABELS[gameMode] || gameMode}</Text>
                    </View>
                    <View style={styles.optionChip}>
                        <Text style={styles.optionChipLabel}>Objectif</Text>
                        <Text style={styles.optionChipValue}>{winningCondition} {MODE_UNIT_LABELS[gameMode]}</Text>
                    </View>
                    <View style={styles.optionChip}>
                        <Text style={styles.optionChipLabel}>Tour</Text>
                        <Text style={styles.optionChipValue}>{turnDuration === 0 ? 'Illimité' : `${turnDuration}s`}</Text>
                    </View>
                    <View style={styles.optionChip}>
                        <Text style={styles.optionChipLabel}>Dominos</Text>
                        <Text style={styles.optionChipValue}>{startingHandSize}</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    // ─── Header ─────────────────────────────────────────────────
    headerTop: {
        width: '100%',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    roomCode: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 6,
    },
    roomTypeBadge: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    shareContainer: {
        alignItems: 'center',
        marginTop: -15, // Pull up closer to header
        marginBottom: 20,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366', // WhatsApp color
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    shareButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // ─── Player Cards ───────────────────────────────────────────
    playersContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
        flex: 1,
        alignItems: 'center',
    },
    playerCardWrapper: {
        flex: 1,
        maxWidth: 120,
    },
    playerCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    playerCardHighlight: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.08)',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2d5f2e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarHighlight: {
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    emptyAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    silhouetteIcon: {
        fontSize: 32,
        opacity: 0.3,
    },
    playerName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    playerStatus: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginTop: 2,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontStyle: 'italic',
    },
    // ─── Options Section (Read-only) ────────────────────────────
    optionsSection: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 12,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    optionChip: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    optionChipLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    optionChipValue: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    // ─── Footer / Action ────────────────────────────────────────
    footer: {
        alignItems: 'center',
    },
    actionButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
    },
    autoStartHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 8,
    },
    waitingContainer: {
        paddingVertical: 20,
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        fontStyle: 'italic',
    },
});
