import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { statsService, PlayerStats } from '../src/core/services/stats.service';
import { economyService } from '../src/core/services/economy.service';
import { authService } from '../src/core/services/auth.service';
import { PlayerEconomy } from '../src/core/economy.types';
import { xpRequiredForLevel } from '../src/core/RewardEngine';
import { LEAGUE_LABELS, LEAGUE_ICONS } from '../src/core/economy.constants';
import { MatchHistory } from '../src/components/MatchHistory';

export default function StatsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);

    const [economy, setEconomy] = useState<PlayerEconomy>({
        coins: 0, xp: 0, level: 1, diamonds: 0, leaguePoints: 0, leagueGrade: 'APPRENTI',
    });

    useFocusEffect(
        useCallback(() => {
            loadPlayerStats();
            loadEconomy();
        }, [])
    );

    const loadEconomy = async () => {
        try {
            // Sync depuis Firebase d'abord pour que l'XP affiché
            // corresponde à la valeur du leaderboard (source de vérité)
            const user = await authService.getCurrentUser();
            if (user && !user.uid.startsWith('guest_')) {
                await economyService.syncFromFirebase(user.uid);
            }
            const eco = await economyService.getEconomy();
            setEconomy(eco);
        } catch (error) {
            console.error('Failed to load economy', error);
        }
    };

    const loadPlayerStats = async () => {
        setIsLoading(true);
        try {
            const stats = await statsService.getStats();
            setPlayerStats(stats);
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top || 10 }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Statistiques</Text>

            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setHistoryModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.historyIcon}>🕒</Text>
                {playerStats?.matchHistory && playerStats.matchHistory.length > 0 && (
                    <View style={styles.historyBadge}>
                        <Text style={styles.historyBadgeText}>{playerStats.matchHistory.length}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderBlocA = () => {
        const xpCurrent = economy.xp - xpRequiredForLevel(economy.level);
        const xpNeeded = xpRequiredForLevel(economy.level + 1) - xpRequiredForLevel(economy.level);
        const xpPct = xpNeeded > 0 ? Math.min(1, xpCurrent / xpNeeded) : 1;
        const gradeLabel = LEAGUE_LABELS[economy.leagueGrade] || economy.leagueGrade;
        const gradeIcon = LEAGUE_ICONS[economy.leagueGrade] || '🔰';

        return (
            <Animated.View entering={FadeInUp.delay(100).duration(500)} style={[styles.bloc, styles.blocA]}>
                {/* Devises Row */}
                <View style={styles.devisesRow}>
                    <View style={styles.deviseItem}>
                        <Text style={styles.deviseIcon}>🪙</Text>
                        <Text style={styles.deviseValue}>{economy.coins.toLocaleString()}</Text>
                    </View>
                    <View style={styles.deviseDivider} />
                    <View style={styles.deviseItem}>
                        <Text style={styles.deviseIcon}>💎</Text>
                        <Text style={[styles.deviseValue, { color: '#60DCFF' }]}>{economy.diamonds.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Ligue Badge */}
                <View style={styles.leagueContainer}>
                    <Text style={styles.leagueIcon}>{gradeIcon}</Text>
                    <Text style={styles.leagueName}>{gradeLabel}</Text>
                </View>

                {/* XP Bar */}
                <View style={styles.xpBox}>
                    <View style={styles.xpHeader}>
                        <Text style={styles.xpLevel}>Niveau {economy.level}</Text>
                        <Text style={styles.xpProgressTxt}>{xpCurrent.toLocaleString()} / {xpNeeded.toLocaleString()} XP</Text>
                    </View>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${Math.round(xpPct * 100)}%` }]} />
                    </View>
                </View>
            </Animated.View>
        );
    };

    const renderBlocB = () => {
        if (!playerStats) return null;
        const winRate = playerStats.gamesPlayed > 0
            ? Math.round((playerStats.gamesWon / playerStats.gamesPlayed) * 100)
            : 0;

        return (
            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.bloc, styles.blocB]}>
                <View style={styles.statLine}>
                    <Text style={styles.statLineIcon}>🎮</Text>
                    <Text style={styles.statLineLabel}>PARTIES</Text>
                    <View style={styles.statLineDotted} />
                    <Text style={styles.statLineValue}>{playerStats.gamesPlayed.toLocaleString()}</Text>
                </View>

                <View style={styles.statLine}>
                    <Text style={styles.statLineIcon}>🏆</Text>
                    <Text style={styles.statLineLabel}>VICTOIRES</Text>
                    <View style={styles.statLineDotted} />
                    <Text style={styles.statLineValue}>{playerStats.gamesWon.toLocaleString()} <Text style={styles.statLineSubValue}>({winRate}%)</Text></Text>
                </View>

                <View style={styles.statLine}>
                    <Text style={styles.statLineIcon}>🐷</Text>
                    <Text style={styles.statLineLabel}>COCHONS</Text>
                    <View style={styles.statLineDotted} />
                    <Text style={styles.statLineValue}>{(economy.cochonsGiven || 0).toLocaleString()}</Text>
                </View>

                <View style={styles.statLine}>
                    <Text style={styles.statLineIcon}>✨</Text>
                    <Text style={styles.statLineLabel}>POINTS</Text>
                    <View style={styles.statLineDotted} />
                    <Text style={[styles.statLineValue, { color: '#FFD700' }]}>{playerStats.totalPointsAccumulated.toLocaleString()}</Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a0505', '#2a0a0a']} style={StyleSheet.absoluteFillObject} />

            {renderHeader()}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            ) : (
                <View style={[styles.contentLayout, !isLandscape && { flexDirection: 'column' }]}>
                    {renderBlocA()}
                    {renderBlocB()}
                </View>
            )}

            {/* History Modal */}
            <Modal
                visible={historyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setHistoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isLandscape && styles.modalContentLandscape]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Historique des Matchs</Text>
                            <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.modalCloseButton}>
                                <Ionicons name="close-circle" size={30} color="#FFD700" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <MatchHistory history={playerStats?.matchHistory || []} />
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a0505',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'rgba(26,5,5,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.1)',
        zIndex: 10,
    },
    backButton: {
        padding: 5,
        width: 80,
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textTransform: 'uppercase',
        flex: 1,
        textAlign: 'center',
    },
    historyButton: {
        width: 80,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 5,
        position: 'relative',
    },
    historyIcon: {
        fontSize: 24,
    },
    historyBadge: {
        position: 'absolute',
        top: -5,
        right: 0,
        backgroundColor: '#FF3366',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    historyBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFD700',
        fontSize: 16,
    },
    contentLayout: {
        flex: 1,
        flexDirection: 'row',
        padding: 8, // Réduit de 10 à 8
        gap: 8, // Réduit de 10 à 8
    },
    bloc: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
        padding: 10, // Réduit de 12 à 10
        justifyContent: 'space-between',
    },
    blocA: {
        // Optionnel : styles spécifiques au bloc A
    },
    blocB: {
        justifyContent: 'space-evenly', // Distribution égale des 4 lignes
    },

    // --- BLOC A DETAILS ---
    devisesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingVertical: 8,
        marginBottom: 10,
    },
    deviseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 6,
    },
    deviseDivider: {
        width: 1,
        height: '70%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    deviseIcon: {
        fontSize: 18,
    },
    deviseValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    leagueContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    leagueIcon: {
        fontSize: 50,
        marginBottom: 4,
    },
    leagueName: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    xpBox: {
        marginTop: 10,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    xpLevel: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 12,
    },
    xpProgressTxt: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    xpBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },

    // --- BLOC B DETAILS ---
    statLine: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 15,
        paddingVertical: 8, // Réduit de 12 à 8
        borderRadius: 10,
        marginBottom: 6, // Ajoute un petit margin-bottom
    },
    statLineIcon: {
        fontSize: 20, // Réduit de 22 à 20
        marginRight: 8, // Réduit de 10 à 8
        width: 25, // Réduit de 30 à 25
        textAlign: 'center',
    },
    statLineLabel: {
        fontSize: 13, // Réduit de 14 à 13
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statLineDotted: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        marginHorizontal: 8,
        position: 'relative',
        top: 6,
    },
    statLineValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    statLineSubValue: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'normal',
    },

    // --- MODAL ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a0505',
        width: '90%',
        height: '80%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalContentLandscape: {
        width: '80%',
        height: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalCloseButton: {
        padding: 5,
    },
});
