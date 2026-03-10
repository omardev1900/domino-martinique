import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView, Modal } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing, runOnJS, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GameState, Player, PlayerId, GameMode, MancheResult } from '@/core/types';
import { getAvatarImage, AvatarId } from '@/core/avatars';
import SoundManager from '@/core/audio/SoundManager';
import HapticManager from '@/core/audio/HapticManager';
import { DominoTile } from './DominoTile';
import { calculateHandPoints } from '@/core/ScoringEngine';


interface UnifiedResultOverlayProps {
    gameState: GameState;
    visible: boolean;
    currentUserId: string;
    onContinue: () => void;
    onLeave?: () => void; // For match end
    allReady?: boolean; // Signal from outside if needed, but we'll handle internally too
    onAnimationFinished?: () => void;
    isHost?: boolean;
}

type OverlayMode = 'SIMPLE_WIN' | 'MANCHE_END' | 'MATCH_END' | 'BOUDE';

export const UnifiedResultOverlay: React.FC<UnifiedResultOverlayProps> = ({
    gameState,
    visible,
    currentUserId,
    onContinue,
    onLeave,
    isHost = true
}) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // Derived State
    const [showDetails, setShowDetails] = useState(false);
    const isMatchOver = gameState.phase === 'MATCH_END';
    const isMancheOver = gameState.phase === 'MANCHE_END';
    const isBoude = gameState.phase === 'BOUDE';

    const mancheResult = gameState.mancheResult;

    // Find Winners
    const boudeWinnerId = (() => {
        if (!isBoude) return null;
        const scores = gameState.players.map(p => ({ id: p.id, score: calculateHandPoints(p.hand) }));
        const minScore = Math.min(...scores.map(s => s.score));
        const winners = scores.filter(s => s.score === minScore);
        return winners.length === 1 ? winners[0].id : null;
    })();

    const matchOverallWinner = [...gameState.players].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.totalCochons !== a.totalCochons) return b.totalCochons - a.totalCochons;
        return b.mancheWins - a.mancheWins;
    })[0];

    const winnerId = isMatchOver ? matchOverallWinner?.id : (isBoude ? boudeWinnerId : (gameState.players.find(p => p.id === gameState.firstPlayerOfRound)?.id || gameState.players.find(p => p.hand.length === 0)?.id));
    const isMeWinner = winnerId === currentUserId;

    // animations
    const scaleValue = useSharedValue(0.5);
    const opacityValue = useSharedValue(0);

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleValue.value }],
        opacity: opacityValue.value
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        opacity: opacityValue.value
    }));

    useEffect(() => {
        if (visible) {
            scaleValue.value = withSpring(1);
            opacityValue.value = withTiming(1, { duration: 500 });

            if (mancheResult === 'CHIRE' || isBoude) SoundManager.playSound('boude');
            else if (mancheResult === 'COCHON' || isMeWinner) SoundManager.playSound('win');
            else SoundManager.playSound('lose');
        } else {
            scaleValue.value = 0.5;
            opacityValue.value = 0;
        }
    }, [visible, isBoude, isMatchOver, isMeWinner]);

    if (!visible) return null;

    // --------------------------------------------------------------------------------
    // Sub-Component: Player Card (Universal Flexbox based)
    // --------------------------------------------------------------------------------
    const PlayerResultCard = ({ player, isWinner }: { player: Player, isWinner: boolean }) => {
        const totalPts = gameState.gameMode === 'SCORE' ? player.totalPoints : gameState.gameMode === 'COCHON' ? player.totalCochons : player.totalPoints;
        const currentPips = calculateHandPoints(player.hand);

        return (
            <View style={[
                styles.flexPlayerCard,
                isWinner && styles.flexPlayerCardWinner,
                isLandscape && { width: '24%', marginHorizontal: '0.5%' }
            ]}>
                {/* 1. Header Card: Avatar & Name */}
                <View style={styles.flexCardHeader}>
                    <View style={styles.avatarMiniWrapper}>
                        <Image
                            source={getAvatarImage(player.avatarId as AvatarId || 'avatar_default')}
                            style={[styles.flexMicroAvatar, isWinner && styles.flexMicroAvatarWinner]}
                            contentFit="cover"
                        />
                        {isWinner && <Text style={styles.flexCrownSmall}>👑</Text>}
                    </View>
                    <Text style={[styles.flexPlayerName, isWinner && styles.flexPlayerNameWinner]} numberOfLines={1}>
                        {player.name}
                    </Text>
                </View>

                {/* 2. Body Card: Status / Hands */}
                <View style={styles.flexCardBody}>
                    <Text style={styles.flexTotalLabel}>TOTAL {totalPts}</Text>
                    {isBoude || !isWinner ? (
                        <View style={styles.flexMiniHand}>
                            {player.hand.length === 0 ? (
                                <Text style={styles.flexEmptyHand}>A fini !</Text>
                            ) : (
                                player.hand.slice(0, 4).map(d => (
                                    <View key={d.id} style={styles.flexMiniDomino}>
                                        <DominoTile left={d.left} right={d.right} size={20} noMargin />
                                    </View>
                                ))
                            )}
                            {player.hand.length > 4 && <Text style={{ fontSize: 10 }}>...</Text>}
                        </View>
                    ) : (
                        <View style={styles.flexWinnerBadge}>
                            <Text style={styles.flexWinnerBadgeText}>+ {player.currentMancheStars || 0}⭐</Text>
                        </View>
                    )}
                </View>

                {/* 3. Footer Card: Score current */}
                <View style={styles.flexCardFooter}>
                    <Text style={[styles.flexPipsScore, isWinner && styles.flexPipsScoreWinner]}>
                        {player.hand.length === 0 ? '💯' : `${currentPips} ⚫`}
                    </Text>
                </View>
            </View>
        );
    }

    const renderMainTitle = () => {
        if (isMatchOver) return { main: "VAINQUEUR DU MATCH", sub: matchOverallWinner?.name || "" };
        if (isBoude) return { main: "Partie Bloquée !", sub: boudeWinnerId ? `${gameState.players.find(p => p.id === boudeWinnerId)?.name} gagne !` : "Personne ne gagne." };
        if (mancheResult === 'CHIRE') return { main: "CHIRÉ !!", sub: "Pas de cochon cette fois !" };
        if (mancheResult === 'COCHON') return { main: "COCHON !", sub: "Une manche de prestige !" };
        return { main: "VICTOIRE !", sub: "Partie terminée." };
    };

    const titles = renderMainTitle();

    // -------------------------------------------------------------
    // RENDER: MAIN OVERLAY
    // -------------------------------------------------------------
    return (
        <View style={styles.container} pointerEvents="box-none">
            <Animated.View style={animatedBackdropStyle} />

            <Animated.View style={[
                styles.mainFlexBanner,
                animatedContentStyle,
                isLandscape ? styles.mainFlexBannerLandscape : styles.mainFlexBannerPortrait
            ]}>

                {/* ZONE 1: HEADER (Title & Stats) */}
                <View style={styles.flexHeaderZone}>
                    <View style={styles.flexTitleContainer}>
                        <Text style={[styles.flexTitle, isLandscape && { fontSize: 18 }]}>{titles.main}</Text>
                        <Text style={styles.flexSubtitle}>{titles.sub}</Text>
                    </View>
                    {isMatchOver && (
                        <TouchableOpacity
                            onPress={() => setShowDetails(true)}
                            style={styles.flexStatsButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="stats-chart" size={20} color="#8B6508" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ZONE 2: BODY (Grid of Player Cards) */}
                <View style={[styles.flexBodyZone, isLandscape && styles.flexBodyZoneLandscape]}>
                    {gameState.players.slice(0, 4).map(p => (
                        <PlayerResultCard key={p.id} player={p} isWinner={p.id === winnerId} />
                    ))}
                </View>

                {/* ZONE 3: FOOTER (Actions & Gains) */}
                <View style={styles.flexFooterZone}>
                    {isHost || isMatchOver ? (
                        <TouchableOpacity style={styles.flexActionBtn} onPress={onContinue}>
                            <Text style={styles.flexActionBtnText}>
                                {isMatchOver ? "VOIR MES GAINS" : "CONTINUER"}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.flexActionBtn, { backgroundColor: '#444', opacity: 0.8 }]}>
                            <Text style={styles.flexActionBtnText}>En attente de l'hôte...</Text>
                        </View>
                    )}

                    {!isHost && isMatchOver && (
                        <TouchableOpacity
                            style={[styles.flexActionBtn, { backgroundColor: '#8B0000', marginTop: 12 }]}
                            onPress={onLeave}
                        >
                            <Text style={styles.flexActionBtnText}>QUITTER</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </Animated.View>

            {/* MODAL HISTORIQUE (Stats) - Overlay logic corrected */}
            <Modal visible={showDetails} transparent animationType="slide">
                <View style={styles.statsModalOverlay}>
                    <View style={styles.statsModalContent}>
                        <View style={styles.statsModalHeader}>
                            <Text style={styles.statsModalTitle}>HISTORIQUE DU MATCH</Text>
                            <TouchableOpacity onPress={() => setShowDetails(false)}>
                                <Ionicons name="close-circle" size={32} color="#8B6508" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            {/* Table Header */}
                            <View style={styles.statsTableHeader}>
                                <Text style={[styles.statsTableCell, { width: 60, fontWeight: 'bold' }]}>Round</Text>
                                {gameState.players.map(p => (
                                    <View key={p.id} style={{ flex: 1, alignItems: 'center' }}>
                                        <Text style={[styles.statsTableCell, { fontWeight: 'bold' }]} numberOfLines={1}>{p.name}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* History Rows */}
                            {gameState.mancheHistory?.map((h, idx) => (
                                <View key={idx} style={styles.statsTableRow}>
                                    <Text style={[styles.statsTableCell, { width: 60 }]}>M{h.mancheNumber}</Text>
                                    {gameState.players.map(p => (
                                        <Text key={p.id} style={[styles.statsTableCell, { flex: 1 }]}>
                                            {h.points[p.id] || 0}
                                        </Text>
                                    ))}
                                </View>
                            ))}

                            {(!gameState.mancheHistory || gameState.mancheHistory.length === 0) && (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Text style={{ fontStyle: 'italic', color: '#8B6508' }}>Aucun historique disponible.</Text>
                                </View>
                            )}

                            {/* Final Total */}
                            <View style={[styles.statsTableRow, { borderTopWidth: 2, borderColor: '#8B6508', marginTop: 10 }]}>
                                <Text style={[styles.statsTableCell, { width: 60, fontWeight: 'bold' }]}>TOTAL</Text>
                                {gameState.players.map(p => (
                                    <Text key={p.id} style={[styles.statsTableCell, { flex: 1, fontWeight: 'bold', fontSize: 16 }]}>
                                        {gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints}
                                    </Text>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    // --- MAIN BANNER ---
    mainFlexBanner: {
        backgroundColor: '#Fdf4e3',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E8CA8B',
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    mainFlexBannerPortrait: {
        width: '90%',
        maxHeight: '80%',
        padding: 10,
    },
    mainFlexBannerLandscape: {
        width: '85%',
        height: '85%',
        padding: 8,
    },

    // --- ZONE 1: HEADER ---
    flexHeaderZone: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 101, 8, 0.15)',
        marginBottom: 8,
        position: 'relative',
        minHeight: 50,
    },
    flexTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#8B0000',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    flexSubtitle: {
        fontSize: 14,
        color: '#555',
        fontWeight: 'bold',
    },
    flexStatsButton: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(232, 202, 139, 0.3)',
        borderRadius: 20,
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- ZONE 2: BODY (PLAYER GRID) ---
    flexBodyZone: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    flexBodyZoneLandscape: {
        flexWrap: 'nowrap', // Force 4 columns on desktop/landscape
    },

    // --- PLAYER CARDS ---
    flexPlayerCard: {
        backgroundColor: '#FFF8EB',
        borderRadius: 16,
        padding: 10,
        width: '45%', // Default for portrait (2x2)
        maxWidth: 200,
        borderWidth: 1,
        borderColor: '#E8CA8B',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 140,
    },
    flexPlayerCardWinner: {
        backgroundColor: 'rgba(218, 165, 32, 0.15)',
        borderColor: '#DAA520',
        borderWidth: 2,
        elevation: 4,
    },
    flexCardHeader: {
        alignItems: 'center',
        width: '100%',
    },
    avatarMiniWrapper: {
        position: 'relative',
        marginBottom: 4,
    },
    flexMicroAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#CCC',
    },
    flexMicroAvatarWinner: {
        borderColor: '#DAA520',
        borderWidth: 2,
    },
    flexCrownSmall: {
        position: 'absolute',
        top: -8,
        left: -8,
        fontSize: 20,
        transform: [{ rotate: '-15deg' }],
    },
    flexPlayerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        textAlign: 'center',
    },
    flexPlayerNameWinner: {
        color: '#8B6508',
    },
    flexCardBody: {
        alignItems: 'center',
        marginVertical: 4,
        width: '100%',
    },
    flexTotalLabel: {
        fontSize: 10,
        color: '#1565C0',
        fontWeight: '900',
        marginBottom: 2,
    },
    flexMiniHand: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    flexMiniDomino: {
        transform: [{ scale: 0.6 }],
        marginHorizontal: -4,
    },
    flexEmptyHand: {
        fontSize: 12,
        fontWeight: '900',
        color: '#2E7D32',
    },
    flexWinnerBadge: {
        backgroundColor: '#DAA520',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    flexWinnerBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    flexCardFooter: {
        marginTop: 4,
    },
    flexPipsScore: {
        fontSize: 16,
        fontWeight: '900',
        color: '#666',
    },
    flexPipsScoreWinner: {
        color: '#8B6508',
        fontSize: 18,
    },

    // --- ZONE 3: FOOTER ---
    flexFooterZone: {
        paddingTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexActionBtn: {
        backgroundColor: '#2E7D32',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderBottomWidth: 4,
        borderColor: '#1B5E20',
        gap: 10,
        minWidth: 200,
    },
    flexActionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },

    // --- STATS MODAL ---
    statsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    statsModalContent: {
        width: '100%',
        maxWidth: 600,
        maxHeight: '80%',
        backgroundColor: '#Fdf4e3',
        borderRadius: 24,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E8CA8B',
    },
    statsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderColor: '#E8CA8B',
        paddingBottom: 10,
    },
    statsModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8B6508',
    },
    statsTableHeader: {
        flexDirection: 'row',
        backgroundColor: 'rgba(232, 202, 139, 0.4)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
    },
    statsTableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    statsTableCell: {
        textAlign: 'center',
        color: '#444',
        fontSize: 14,
    },
});
