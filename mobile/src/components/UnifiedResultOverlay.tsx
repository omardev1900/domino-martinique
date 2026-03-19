import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView, Modal } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing, runOnJS, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GameState, Player, PlayerId, GameMode, MancheResult } from '@/core/types';
import { MatchReward } from '@/core/economy.types';
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
    matchReward?: MatchReward | null; // Passer les requêtes de recompénses depuis GameScreen
}

type OverlayMode = 'SIMPLE_WIN' | 'MANCHE_END' | 'MATCH_END' | 'BOUDE';
type TabType = 'RESULTS' | 'HISTORY' | 'REWARDS';

export const UnifiedResultOverlay: React.FC<UnifiedResultOverlayProps> = ({
    gameState,
    visible,
    currentUserId,
    onContinue,
    onLeave,
    isHost = true,
    matchReward
}) => {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // Derived State
    const [activeTab, setActiveTab] = useState<TabType>('RESULTS');
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

            SoundManager.playSound('end');
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

        // Animation de la carte
        const animatedScale = useSharedValue(isWinner ? 1 : 0.85);
        const animatedOpacity = useSharedValue(isWinner ? 1 : 0.6);

        useEffect(() => {
            if (isWinner) {
                // Flash glow / pulse for winner
                animatedScale.value = withRepeat(
                    withSequence(
                        withTiming(1.05, { duration: 1000 }),
                        withTiming(1, { duration: 1000 })
                    ),
                    -1,
                    true
                );
                animatedOpacity.value = 1;
            } else {
                animatedScale.value = withTiming(0.85, { duration: 500 });
                animatedOpacity.value = withTiming(0.6, { duration: 500 });
            }
        }, [isWinner]);

        const animStyle = useAnimatedStyle(() => ({
            transform: [{ scale: animatedScale.value }],
            opacity: animatedOpacity.value,
        }));

        return (
            <Animated.View style={[
                styles.flexPlayerCard,
                isWinner && styles.flexPlayerCardWinner,
                isLandscape && { width: '24%' },
                animStyle,
                { zIndex: isWinner ? 10 : 1, marginHorizontal: isWinner ? 10 : -10 } // Podium effect
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
                    {isWinner ? (
                        <View style={styles.flexWinnerBadge}>
                            <Text style={styles.flexWinnerBadgeText}>+ {player.currentMancheStars || 0}⭐</Text>
                        </View>
                    ) : (
                        <View style={styles.flexMiniHand}>
                            {/* Les perdants n'affichent plus leurs dominos */}
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic' }}>Terminé</Text>
                        </View>
                    )}
                </View>

                {/* 3. Footer Card: Score current (Gagnant uniquement) */}
                <View style={styles.flexCardFooter}>
                    <Text style={[styles.flexPipsScore, isWinner && styles.flexPipsScoreWinner]}>
                        {isWinner ? (player.hand.length === 0 ? '💯' : `${currentPips} ⚫`) : '-'}
                    </Text>
                </View>
            </Animated.View>
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
    // RENDER: TABS SYSTEM
    // -------------------------------------------------------------
    const renderTabs = () => {
        if (!isMatchOver) return null; // Seulement utile pour le match final
        return (
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'RESULTS' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('RESULTS')}
                >
                    <Ionicons name="trophy-outline" size={16} color={activeTab === 'RESULTS' ? '#FFD700' : 'rgba(255,255,255,0.5)'} />
                    <Text style={[styles.tabText, activeTab === 'RESULTS' && styles.tabTextActive]}>RÉSULTATS</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'HISTORY' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('HISTORY')}
                >
                    <Ionicons name="list-outline" size={16} color={activeTab === 'HISTORY' ? '#FFD700' : 'rgba(255,255,255,0.5)'} />
                    <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>HISTORIQUE</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'REWARDS' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('REWARDS')}
                >
                    <Ionicons name="gift-outline" size={16} color={activeTab === 'REWARDS' ? '#FFD700' : 'rgba(255,255,255,0.5)'} />
                    <Text style={[styles.tabText, activeTab === 'REWARDS' && styles.tabTextActive]}>MES GAINS</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderHistoryTab = () => (
        <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <View style={styles.statsTableHeader}>
                <Text style={[styles.statsTableCell, { width: 60, fontWeight: 'bold' }]}>Round</Text>
                {gameState.players.map(p => (
                    <View key={p.id} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.statsTableCell, { fontWeight: 'bold', color: p.id === currentUserId ? '#FFD700' : '#FFF' }]} numberOfLines={1}>
                            {p.id === currentUserId ? 'Moi' : p.name}
                        </Text>
                    </View>
                ))}
            </View>

            {/* History Rows */}
            {gameState.mancheHistory?.map((h, idx) => (
                <View key={idx} style={styles.statsTableRow}>
                    <Text style={[styles.statsTableCell, { width: 60 }]}>M{h.mancheNumber}</Text>
                    {gameState.players.map(p => (
                        <Text key={p.id} style={[styles.statsTableCell, { flex: 1, color: 'rgba(255,255,255,0.8)' }]}>
                            {h.points[p.id] || 0}
                        </Text>
                    ))}
                </View>
            ))}

            {(!gameState.mancheHistory || gameState.mancheHistory.length === 0) && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>Aucun historique disponible.</Text>
                </View>
            )}

            {/* Final Total */}
            <View style={[styles.statsTableRow, { borderTopWidth: 2, borderColor: '#FFD700', marginTop: 10, paddingTop: 10 }]}>
                <Text style={[styles.statsTableCell, { width: 60, fontWeight: 'bold', color: '#FFD700' }]}>TOTAL</Text>
                {gameState.players.map(p => (
                    <Text key={p.id} style={[styles.statsTableCell, { flex: 1, fontWeight: 'bold', fontSize: 16, color: p.id === winnerId ? '#FFD700' : '#FFF' }]}>
                        {gameState.gameMode === 'SCORE' ? p.totalPoints : gameState.gameMode === 'COCHON' ? p.totalCochons : p.totalPoints}
                    </Text>
                ))}
            </View>
        </ScrollView>
    );

    const renderRewardsTab = () => (
        <View style={styles.rewardsContainer}>
            {matchReward ? (
                <>
                   <Text style={[styles.flexSubtitle, { color: '#FFD700', marginBottom: 15, fontSize: 18 }]}>Vos récompenses de match</Text>
                   <View style={styles.rewardsGrid}>
                        <View style={styles.rewardBox}>
                             <Text style={{fontSize: 24}}>🪙</Text>
                             <Text style={styles.rewardValue}>+{matchReward.coinsEarned}</Text>
                             <Text style={styles.rewardLabel}>Coins</Text>
                        </View>
                        <View style={styles.rewardBox}>
                             <Text style={{fontSize: 24}}>🟢</Text>
                             <Text style={styles.rewardValue}>+{matchReward.xpEarned}</Text>
                             <Text style={styles.rewardLabel}>XP</Text>
                        </View>
                        {matchReward.diamondsEarned > 0 && (
                            <View style={styles.rewardBox}>
                                <Text style={{fontSize: 24}}>💎</Text>
                                <Text style={[styles.rewardValue, { color: '#60DCFF' }]}>+{matchReward.diamondsEarned}</Text>
                                <Text style={styles.rewardLabel}>Diamants</Text>
                            </View>
                        )}
                        {matchReward.leaguePointsEarned > 0 && (
                             <View style={styles.rewardBox}>
                                 <Text style={{fontSize: 24}}>🐷</Text>
                                 <Text style={[styles.rewardValue, { color: '#FF9800' }]}>+{matchReward.leaguePointsEarned}</Text>
                                 <Text style={styles.rewardLabel}>League</Text>
                             </View>
                         )}
                   </View>
                </>
            ) : (
                <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune récompense disponible.</Text>
            )}
        </View>
    );

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

                {/* TABS AT TOP FOR MATCH END */}
                {renderTabs()}

                {/* ZONE 1: HEADER (Title & Stats) - Hidden if match is over as per request */}
                {!isMatchOver && (
                    <View style={styles.flexHeaderZone}>
                        <View style={styles.flexTitleContainer}>
                            <Text style={[styles.flexTitle, isLandscape && { fontSize: 18 }]}>{titles.main}</Text>
                            <Text style={styles.flexSubtitle}>{titles.sub}</Text>
                        </View>
                    </View>
                )}

                {/* ZONE 2: DYNAMIC BODY CONTENT */}
                <View style={[styles.dynamicCardBody, isLandscape && styles.flexBodyZoneLandscape]}>
                    {activeTab === 'RESULTS' && (
                        <View style={[styles.flexPlayersGrid, isLandscape && styles.flexPlayersGridLandscape, { alignItems: 'flex-end', justifyContent: 'center' }]}>
                            {(() => {
                                // Podium Ordering : Winner in center
                                const sortedPlayers = [...gameState.players.slice(0, 4)];
                                const wIdx = sortedPlayers.findIndex(p => p.id === winnerId);
                                if (wIdx > -1) {
                                    const winner = sortedPlayers.splice(wIdx, 1)[0];
                                    const centerPos = Math.floor(sortedPlayers.length / 2);
                                    sortedPlayers.splice(centerPos, 0, winner);
                                }
                                return sortedPlayers.map(p => (
                                    <PlayerResultCard key={p.id} player={p} isWinner={p.id === winnerId} />
                                ));
                            })()}
                        </View>
                    )}
                    
                    {activeTab === 'HISTORY' && renderHistoryTab()}
                    
                    {activeTab === 'REWARDS' && renderRewardsTab()}
                </View>


                {/* ZONE 3: FOOTER (Actions) */}
                <View style={styles.flexFooterZone}>
                    {isHost || isMatchOver ? (
                        <TouchableOpacity style={styles.flexActionBtn} onPress={onContinue}>
                            <Text style={styles.flexActionBtnText}>
                                {isMatchOver ? "QUITTER ET REVENIR À L'ACCUEIL" : "CONTINUER"}
                            </Text>
                            <Ionicons name={isMatchOver ? "home" : "arrow-forward"} size={20} color="black" />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.flexActionBtn, { backgroundColor: '#444', opacity: 0.8 }]}>
                            <Text style={styles.flexActionBtnText}>En attente de l&apos;hôte...</Text>
                        </View>
                    )}

                </View>

            </Animated.View>
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
        backgroundColor: 'rgba(6, 10, 6, 0.95)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 215, 0, 0.5)',
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },
    mainFlexBannerPortrait: {
        width: '90%',
        maxHeight: '85%',
        padding: 10,
    },
    mainFlexBannerLandscape: {
        width: '85%',
        height: '85%',
        padding: 8,
    },

    // --- ZONE 1: HEADER ---
    flexHeaderZone: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 4,
        position: 'relative',
    },
    flexTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    flexTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFD700',
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: 2,
    },
    flexSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: 4,
    },

    // --- TABS SYSTEM ---
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#FFD700',
    },
    tabText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 6,
        letterSpacing: 1,
    },
    tabTextActive: {
        color: '#FFD700',
    },
    
    // --- DYNAMIC BODY ---
    dynamicCardBody: {
        flex: 1,
        width: '100%',
        justifyContent: 'center', // Default align
    },
    
    flexPlayersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    flexPlayersGridLandscape: {
        flexWrap: 'nowrap',
    },
    flexBodyZoneLandscape: {
        // Any specific adjustments if needed for desktop
    },

    // --- PLAYER CARDS (Dark Theme) ---
    flexPlayerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 10,
        width: '45%', 
        maxWidth: 200,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 140,
    },
    flexPlayerCardWinner: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: '#FFD700',
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
        borderColor: 'rgba(255,255,255,0.3)',
    },
    flexMicroAvatarWinner: {
        borderColor: '#FFD700',
        borderWidth: 2,
        width: 55,
        height: 55,
        borderRadius: 27.5,
    },
    flexCrownSmall: {
        position: 'absolute',
        top: -10,
        left: -10,
        fontSize: 25,
        transform: [{ rotate: '-15deg' }],
    },
    flexPlayerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    flexPlayerNameWinner: {
        color: '#FFD700',
        fontSize: 17.5,
    },
    flexCardBody: {
        alignItems: 'center',
        marginVertical: 4,
        width: '100%',
    },
    flexTotalLabel: {
        fontSize: 10,
        color: '#4A90E2',
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
        color: '#4CAF50',
    },
    flexWinnerBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    flexWinnerBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
    },
    flexCardFooter: {
        marginTop: 4,
    },
    flexPipsScore: {
        fontSize: 16,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.6)',
    },
    flexPipsScoreWinner: {
        color: '#FFD700',
        fontSize: 18,
    },

    // --- HISTORY TAB ---
    historyScroll: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 10,
    },
    statsTableHeader: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
    },
    statsTableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    statsTableCell: {
        textAlign: 'center',
        color: '#FFF',
        fontSize: 14,
    },

    // --- REWARDS TAB ---
    rewardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
    },
    rewardBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        width: 120,
    },
    rewardValue: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    rewardLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // --- ZONE 3: FOOTER ---
    flexFooterZone: {
        paddingTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        marginTop: 10,
    },
    flexActionBtn: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        gap: 10,
        minWidth: 200,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    flexActionBtnText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 14,
        textTransform: 'uppercase',
    },
});
