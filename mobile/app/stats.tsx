import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { statsService, PlayerStats } from '../src/core/services/stats.service';
import { economyService } from '../src/core/services/economy.service';
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
    const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
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
        <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistiques</Text>
            <View style={styles.headerRight} />
        </View>
    );

    const renderStatsGrid = () => {
        if (!playerStats) return null;

        const winRate = playerStats.gamesPlayed > 0
            ? Math.round((playerStats.gamesWon / playerStats.gamesPlayed) * 100)
            : 0;

        const statCards = [
            { icon: '🎮', value: playerStats.gamesPlayed, label: 'Parties' },
            { icon: '🏆', value: playerStats.gamesWon, label: `Victoires (${winRate}%)` },
            { icon: '🐷', value: playerStats.totalCochonsInflicted, label: 'Cochons' },
            { icon: '⚡', value: playerStats.totalPointsAccumulated, label: 'Points' },
        ];

        return (
            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.section}>
                <View style={[styles.statsGrid, isLandscape && styles.statsGridLandscape]}>
                    {statCards.map((card, index) => (
                        <View key={index} style={[styles.statCard, isLandscape && styles.statCardLandscape]}>
                            <Text style={styles.statIcon}>{card.icon}</Text>
                            <Text style={styles.statValue}>{card.value}</Text>
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>
            </Animated.View>
        );
    };

    const renderEconomySection = () => {
        const xpCurrent = economy.xp - xpRequiredForLevel(economy.level);
        const xpNeeded = xpRequiredForLevel(economy.level + 1) - xpRequiredForLevel(economy.level);
        const xpPct = xpNeeded > 0 ? Math.min(1, xpCurrent / xpNeeded) : 1;

        const gradeLabel = LEAGUE_LABELS[economy.leagueGrade] || economy.leagueGrade;
        const gradeIcon = LEAGUE_ICONS[economy.leagueGrade] || '🔰';

        return (
            <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.economySection}>
                <View style={styles.economyRow}>
                    <View style={styles.economyPill}>
                        <Text style={styles.economyIcon}>🪙</Text>
                        <Text style={styles.economyValue}>{economy.coins.toLocaleString()}</Text>
                        <Text style={styles.economyLabel}>Coins</Text>
                    </View>
                    <View style={styles.economyPill}>
                        <Text style={styles.economyIcon}>💎</Text>
                        <Text style={[styles.economyValue, { color: '#60DCFF' }]}>{economy.diamonds}</Text>
                        <Text style={styles.economyLabel}>Diamonds</Text>
                    </View>
                    <View style={styles.economyPill}>
                        <Text style={styles.economyIcon}>{gradeIcon}</Text>
                        <Text style={[styles.economyValue, { fontSize: 10 }]} numberOfLines={1}>{gradeLabel}</Text>
                        <Text style={styles.economyLabel}>Ligue</Text>
                    </View>
                </View>
                <View style={styles.xpContainer}>
                    <View style={styles.xpHeader}>
                        <Text style={styles.xpLabel}>⭐ Niveau {economy.level}</Text>
                        <Text style={styles.xpValue}>{economy.xp.toLocaleString()} XP total</Text>
                    </View>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${Math.round(xpPct * 100)}%` }]} />
                    </View>
                    <Text style={styles.xpSubtext}>
                        {xpCurrent.toLocaleString()} / {xpNeeded.toLocaleString()} XP vers niveau {economy.level + 1}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a0505', '#2a0a0a']}
                style={StyleSheet.absoluteFillObject}
            />

            {renderHeader()}

            <View style={styles.content}>
                {renderEconomySection()}

                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'stats' && styles.activeTabItem]}
                        onPress={() => setActiveTab('stats')}
                    >
                        <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>STATS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
                        onPress={() => setActiveTab('history')}
                    >
                        <View style={styles.tabWithBadge}>
                            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>MATCHS</Text>
                            {playerStats && playerStats.matchHistory && playerStats.matchHistory.length > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{playerStats.matchHistory.length}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : (
                    <View style={styles.scrollContainer}>
                        {activeTab === 'stats' ? renderStatsGrid() : <MatchHistory history={playerStats?.matchHistory || []} />}
                    </View>
                )}
            </View>
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
        paddingBottom: 20,
        backgroundColor: 'rgba(26,5,5,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.1)',
        zIndex: 10,
    },
    backButton: {
        padding: 10,
        marginLeft: -10,
        width: 80,
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        textTransform: 'uppercase',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 80,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    scrollContainer: {
        flex: 1,
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
    section: {
        flex: 1,
    },
    // ─── Statistics ───
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        justifyContent: 'center',
    },
    statsGridLandscape: {
        flexWrap: 'nowrap',
    },
    statCard: {
        width: '45%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    statCardLandscape: {
        width: 'auto',
        flex: 1,
        paddingVertical: 12, // Compact vertical padding for landscape
    },
    statIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    // ─── Tabs ───
    tabBar: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.1)',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTabItem: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#FFD700',
    },
    tabWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1a0505',
    },
    // ─── Economy Section ───
    economySection: {
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    economyRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    economyPill: {
        alignItems: 'center',
        flex: 1,
    },
    economyIcon: {
        fontSize: 26,
        marginBottom: 4,
    },
    economyValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFD700',
    },
    economyLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    xpContainer: {
        gap: 6,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    xpLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFD700',
    },
    xpValue: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
    },
    xpBarBg: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 5,
        backgroundColor: '#FFD700',
    },
    xpSubtext: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
    },
});
