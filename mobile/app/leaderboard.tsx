import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, useWindowDimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { leaderboardService, LeaderboardEntry, LeaderboardCategory } from '../src/core/services/leaderboard.service';
import { authService } from '../src/core/services/auth.service';
import { economyService } from '../src/core/services/economy.service';
import { getAvatarImage } from '../src/core/avatars';
import { LEAGUE_LABELS, LEAGUE_ICONS } from '../src/core/economy.constants';
import { PlayerProfile } from '../src/core/types';
import { AvatarFrame } from '../src/components/AvatarFrame';

export default function LeaderboardScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<LeaderboardCategory>('XP');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
    /** Rang du joueur actuel si hors du Top 50 (null = dans le Top 50 ou invité) */
    const [playerOutsideRank, setPlayerOutsideRank] = useState<number | null>(null);
    const [playerLocalScore, setPlayerLocalScore] = useState<number>(0);

    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Charger le profil utilisateur et synchroniser les infos dans Firestore
    useEffect(() => {
        authService.getCurrentUser().then(u => {
            if (!u) return;
            setCurrentUser(u);
            // Sync le displayName et avatarId vers Firestore pour les joueurs
            // déjà connectés dont le document n'a jamais eu ces champs.
            if (!u.uid.startsWith('guest_')) {
                economyService.syncProfileToFirebase(
                    u.uid,
                    u.displayName,
                    u.avatarId || u.avatarUrl || 'avatar_default'
                );
            }
        });
    }, []);

    // Charger le score local (pour les invités et le bandeau hors Top 50)
    useEffect(() => {
        economyService.getEconomy().then(eco => {
            if (activeTab === 'XP') setPlayerLocalScore(eco.xp);
            else if (activeTab === 'COINS') setPlayerLocalScore(eco.coins);
            else setPlayerLocalScore(eco.leaguePoints);
        });
    }, [activeTab]);

    // S'abonner au classement en temps réel
    useEffect(() => {
        // Nettoyer l'abonnement précédent
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        setLoading(true);
        setLeaderboardData([]);
        setPlayerOutsideRank(null);

        const unsub = leaderboardService.subscribeLeaderboard(
            activeTab,
            50,
            (entries) => {
                setLeaderboardData(entries);
                setLoading(false);
                setRefreshing(false);
            }
        );
        unsubscribeRef.current = unsub;

        // Nettoyage au démontage
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [activeTab]);

    // Calculer le rang du joueur s'il est hors du Top 50
    useEffect(() => {
        if (!currentUser || currentUser.uid.startsWith('guest_') || loading) return;

        const isInTopList = leaderboardData.some(e => e.uid === currentUser.uid);
        if (isInTopList) {
            setPlayerOutsideRank(null);
            return;
        }

        leaderboardService.getPlayerRank(currentUser.uid, activeTab, playerLocalScore)
            .then(rank => setPlayerOutsideRank(rank));
    }, [leaderboardData, currentUser, activeTab, playerLocalScore, loading]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // onSnapshot se mettra à jour automatiquement ; on simule juste le spinner
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#FFFFFF';
    };

    const getScoreForTab = (item: LeaderboardEntry) => {
        if (activeTab === 'XP') return item.xp;
        if (activeTab === 'COINS') return item.coins;
        return item.leaguePoints;
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isCurrentUser = currentUser && item.uid === currentUser.uid;
        const rankColor = getRankColor(item.rank);
        const avatarSrc = getAvatarImage(item.avatarId || 'avatar_default');

        return (
            <Animated.View entering={FadeInUp.delay(50 + index * 40)} style={[styles.playerRow, isCurrentUser && styles.currentUserRow]}>

                {/* Rang */}
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
                </View>

                {/* Avatar */}
                <View style={[styles.avatarContainer, item.activeFrame ? { overflow: 'visible', backgroundColor: 'transparent' } : null]}>
                    <View style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: 'rgba(255,215,0,0.2)' }}>
                        <Image
                            source={avatarSrc}
                            style={styles.avatarImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    </View>
                    {item.activeFrame && <AvatarFrame frameId={item.activeFrame} size={44} />}
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

                {/* Score */}
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

    /** Bandeau fixe affiché en bas quand le joueur est hors Top 50 ou invité */
    const renderPlayerBanner = () => {
        const isGuest = !currentUser || currentUser.uid.startsWith('guest_');

        if (isGuest) {
            return (
                <View style={styles.playerBanner}>
                    <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.playerBannerText}>
                        Votre position : Non classé{'\n'}
                        <Text style={styles.playerBannerSub}>Créez un compte pour apparaître dans le classement</Text>
                    </Text>
                    <Text style={styles.playerBannerScore}>
                        {playerLocalScore.toLocaleString()} {activeTab === 'COINS' ? '🪙' : activeTab === 'COCHONS' ? '🐷' : 'XP'}
                    </Text>
                </View>
            );
        }

        const inTopList = leaderboardData.some(e => currentUser && e.uid === currentUser.uid);
        if (inTopList) return null; // Déjà visible dans la liste

        const rankText = playerOutsideRank != null ? `#${playerOutsideRank}` : '...';
        return (
            <View style={[styles.playerBanner, styles.playerBannerAuth]}>
                <Ionicons name="person" size={16} color="#FFD700" />
                <Text style={[styles.playerBannerText, { color: '#FFD700' }]}>
                    Votre position : {rankText}
                </Text>
                <Text style={styles.playerBannerScore}>
                    {playerLocalScore.toLocaleString()} {activeTab === 'COINS' ? '🪙' : activeTab === 'COCHONS' ? '🐷' : 'XP'}
                </Text>
            </View>
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

            {/* Onglets */}
            <View style={styles.tabsContainer}>
                {(['XP', 'COINS', 'COCHONS'] as LeaderboardCategory[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]} numberOfLines={1}>
                            {tab === 'XP' ? '🌟 XP' : tab === 'COINS' ? '💰 Coins' : '🐷 Cochons'}
                        </Text>
                    </TouchableOpacity>
                ))}
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
                    ListFooterComponent={renderPlayerBanner}
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
        paddingBottom: 20,
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
        paddingVertical: 40,
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
    },
    // ── Bandeau position joueur ──
    playerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginBottom: 10,
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    playerBannerAuth: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderColor: '#FFD700',
    },
    playerBannerText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: 'bold',
    },
    playerBannerSub: {
        fontSize: 11,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.5)',
    },
    playerBannerScore: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
