import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { leaderboardService, LeaderboardEntry, LeaderboardCategory } from '../src/core/services/leaderboard.service';
import { authService } from '../src/core/services/auth.service';
import { getAvatarImage, AvatarId, AVAILABLE_AVATARS } from '../src/core/avatars';
import { LEAGUE_LABELS, LEAGUE_ICONS } from '../src/core/economy.constants';

export default function LeaderboardScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<LeaderboardCategory>('XP');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        authService.getCurrentUser().then(u => {
            if (u) setCurrentUserId(u.uid);
        });
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let data: LeaderboardEntry[] = [];
            if (activeTab === 'XP') {
                data = await leaderboardService.getTopPlayersByXP(50);
            } else if (activeTab === 'COINS') {
                data = await leaderboardService.getTopPlayersByCoins(50);
            } else if (activeTab === 'COCHONS') {
                data = await leaderboardService.getTopPlayersByCochons(50);
            }
            setLeaderboardData(data);
        } catch (error) {
            console.error('Failed to load leaderboard', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [activeTab]);

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#FFD700'; // Or
        if (rank === 2) return '#C0C0C0'; // Argent
        if (rank === 3) return '#CD7F32'; // Bronze
        return '#FFFFFF';
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isCurrentUser = item.uid === currentUserId;
        const rankColor = getRankColor(item.rank);
        const avatarSrc = getAvatarImage(item.avatarUrl && AVAILABLE_AVATARS.includes(item.avatarUrl as AvatarId) ? item.avatarUrl : 'avatar_default');

        return (
            <Animated.View entering={FadeInUp.delay(50 + index * 50)} style={[styles.playerRow, isCurrentUser && styles.currentUserRow]}>

                {/* Rang */}
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Image source={avatarSrc} style={styles.avatarImage} />
                </View>

                {/* Nom et Ligue */}
                <View style={styles.nameContainer}>
                    <Text style={[styles.nameText, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
                        {isCurrentUser ? `${item.displayName} (Vous)` : item.displayName}
                    </Text>
                    <Text style={styles.leagueText}>
                        {LEAGUE_ICONS[item.leagueGrade]} {LEAGUE_LABELS[item.leagueGrade]}
                    </Text>
                </View>

                {/* Valeur du score */}
                <View style={styles.scoreContainer}>
                    {activeTab === 'XP' && (
                        <>
                            <Text style={styles.scoreText}>{item.xp.toLocaleString()}</Text>
                            <Text style={styles.scoreLabel}>XP (Niv.{item.level})</Text>
                        </>
                    )}
                    {activeTab === 'COINS' && (
                        <>
                            <Text style={styles.scoreText}>{item.coins.toLocaleString()} 🪙</Text>
                            <Text style={styles.scoreLabel}>Coins</Text>
                        </>
                    )}
                    {activeTab === 'COCHONS' && (
                        <>
                            <Text style={styles.scoreText}>{item.leaguePoints.toLocaleString()} 🐷</Text>
                            <Text style={styles.scoreLabel}>Cochons</Text>
                        </>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <LinearGradient colors={['#2D1B4E', '#1A0E2E']} style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Classement Général',
                    headerStyle: { backgroundColor: '#2D1B4E' },
                    headerTintColor: '#FFD700',
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.push('/home')} style={{ marginLeft: 10 }}>
                            <Ionicons name="arrow-back" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    )
                }}
            />

            {/* Onglets (Tabs) */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'XP' && styles.activeTabButton]}
                    onPress={() => setActiveTab('XP')}
                >
                    <Text style={[styles.tabText, activeTab === 'XP' && styles.activeTabText]} numberOfLines={1}>🌟 XP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'COINS' && styles.activeTabButton]}
                    onPress={() => setActiveTab('COINS')}
                >
                    <Text style={[styles.tabText, activeTab === 'COINS' && styles.activeTabText]} numberOfLines={1}>💰 Coins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'COCHONS' && styles.activeTabButton]}
                    onPress={() => setActiveTab('COCHONS')}
                >
                    <Text style={[styles.tabText, activeTab === 'COCHONS' && styles.activeTabText]} numberOfLines={1}>🐷 Cochons</Text>
                </TouchableOpacity>
            </View>

            {/* Liste */}
            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Recherche des légendes...</Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboardData}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFD700" />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Aucun joueur classé pour le moment.</Text>
                        </View>
                    }
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    activeTabButton: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderColor: '#FFD700',
    },
    tabText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 'bold',
        fontSize: 14
    },
    activeTabText: {
        color: '#FFD700',
    },
    listContent: {
        padding: 15,
        paddingBottom: 40,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    currentUserRow: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: '#FFD700',
    },
    rankContainer: {
        width: 35,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,215,0,0.2)',
        overflow: 'hidden',
        marginLeft: 10,
        marginRight: 15,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    currentUserName: {
        color: '#FFD700',
    },
    leagueText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
    scoreContainer: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    scoreText: {
        color: '#FFD700',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scoreLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600'
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    }
});
