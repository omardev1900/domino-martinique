import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking as RNLinking, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { GameRoom, GameMode } from '../core/types';
import { FadeIn, FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../core/avatars';
import { EconomyHeader } from '../components/EconomyHeader';
import { AvatarFrame } from '../components/AvatarFrame';
import { GradeBadge } from '../components/GradeBadge';
import { LEAGUE_FRAMES_ENABLED } from '../core/economy.constants';

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
        const deepLink = `https://domino-martinique.online/join/${roomData.roomId}`;
        const message = `Rejoins ma table de Domino Martiniquais ! Code : ${roomData.roomId}\n\nLien : ${deepLink}`;

        let url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        // Web compatibility: use wa.me link
        if (Platform.OS === 'web') {
            url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        }

        RNLinking.openURL(url).catch(() => {
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
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                <View style={[
                                    styles.avatar,
                                    slot.isCurrentUser && styles.avatarHighlight,
                                    { overflow: 'hidden', marginBottom: 0 },
                                    slot.player?.leagueGrade && !slot.isCurrentUser && {
                                        borderWidth: 2,
                                        borderColor: LEAGUE_GRADE_COLORS[slot.player.leagueGrade as LeagueGrade],
                                    },
                                ]}>
                                    <Image
                                        source={getAvatarImage(slot.player?.avatarId || 'avatar_default')}
                                        style={{
                                            width: 64 * 1.6,
                                            height: 64 * 1.6,
                                            position: 'absolute',
                                            top: -(64 * 1.6 - 64) * 0.25,
                                        }}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                    />
                                </View>
                                {LEAGUE_FRAMES_ENABLED && slot.player?.activeFrame && (
                                    <AvatarFrame frameId={slot.player.activeFrame} size={64} />
                                )}
                            </View>
                            <Text style={styles.playerName} numberOfLines={1}>
                                {slot.player!.displayName}
                            </Text>
                            <Text style={styles.playerStatus}>
                                {slot.isCurrentUser ? '(Vous)' : slot.isHost ? 'HÔTE' : 'Joueur'}
                            </Text>
                            {/* [R3-M2] Badge grade Ligue */}
                            <GradeBadge grade={slot.player?.leagueGrade} size="xs" />
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
                <View style={styles.headerLeft}>
                    <EconomyHeader />
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.shareIconButton} onPress={shareToWhatsApp} activeOpacity={0.7}>
                        <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.roomInfoContainer}>
                        <Text style={styles.roomCode}>Code : {roomData.roomId}</Text>
                    </View>
                </View>
            </Animated.View>

            <View style={styles.mainContent}>
                {/* Game Options - Left Side 2x2 Grid */}
                <Animated.View entering={FadeIn.delay(400)} style={styles.optionsSection}>
                    <Text style={styles.sectionTitle}>TABLE</Text>
                    <View style={styles.optionsGrid}>
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
                            <Text style={styles.optionChipValue}>{turnDuration === 0 ? '∞' : `${turnDuration}s`}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Player Cards - Right/Center */}
                <View style={styles.playersContainer}>
                    {slots.map((slot, index) => renderPlayerCard(slot, index))}
                </View>
            </View>

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
        paddingVertical: 20,
    },
    // ─── Header ─────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    roomInfoContainer: {
        alignItems: 'flex-start',
    },
    roomCode: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    roomTypeBadge: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
    },
    shareIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    // ─── Main Content ───────────────────────────────────────────
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    // ─── Player Cards (Reduced -20%) ────────────────────────────
    playersContainer: {
        flex: 3,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    playerCardWrapper: {
        flex: 1,
        maxWidth: 96, // Reduced from 120
    },
    playerCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    playerCardHighlight: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.08)',
    },
    avatar: {
        width: 64, // Reduced from 80
        height: 64, // Reduced from 80
        borderRadius: 32,
        backgroundColor: '#2d5f2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHighlight: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    emptyAvatar: {
        width: 64, // Reduced from 80
        height: 64, // Reduced from 80
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    silhouetteIcon: {
        fontSize: 24,
        opacity: 0.3,
    },
    playerName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    playerStatus: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        marginTop: 1,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontStyle: 'italic',
    },
    // ─── Options Section (2x2 Grid) ─────────────────────────────
    optionsSection: {
        flex: 1.5,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
        maxWidth: 160,
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 8,
    },
    optionsGrid: {
        flexDirection: 'column',
        gap: 6,
    },
    optionChip: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    optionChipLabel: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    optionChipValue: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    // ─── Footer ─────────────────────────────────────────────────
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    actionButton: {
        width: '100%',
        maxWidth: 400,
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
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    autoStartHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginTop: 6,
    },
    waitingContainer: {
        paddingVertical: 15,
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontStyle: 'italic',
    },
});
