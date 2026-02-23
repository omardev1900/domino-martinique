
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    useWindowDimensions,
    Platform
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft, FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoom, joinRoom, listenToPublicRooms, RoomOptions, auth } from '../src/core/services/firebase';
import { PlayerProfile, GameMode, GameRoom } from '../src/core/types';
import { authService } from '../src/core/services/auth.service';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { HAND_SIZE, TURN_DURATION_SECONDS } from '../src/core/constants';

type LobbyTab = 'CREATE' | 'JOIN' | 'PUBLIC';

const MODE_LABELS: Record<GameMode, string> = {
    MANCHE: 'Manche',
    SCORE: 'Score',
    COCHON: 'Cochon',
};

const MODE_UNIT_LABELS: Record<GameMode, string> = {
    MANCHE: 'Manches',
    SCORE: 'Points',
    COCHON: 'Cochons',
};

export default function LobbyScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // — Shared state —
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
    const [activeTab, setActiveTab] = useState<LobbyTab>('CREATE');

    // — JOIN tab state —
    const [roomIdToJoin, setRoomIdToJoin] = useState('');

    // — CREATE tab state —
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomNameInput, setRoomNameInput] = useState('');
    const [gameMode, setGameMode] = useState<GameMode>('SCORE');
    const [winningCondition, setWinningCondition] = useState(6);
    const [turnDuration, setTurnDuration] = useState(TURN_DURATION_SECONDS);
    const [startingHandSize, setStartingHandSize] = useState(HAND_SIZE);

    // — PUBLIC tab state —
    const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
    const [loadingPublicRooms, setLoadingPublicRooms] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                try {
                    // Always refresh from storage to get latest profile data
                    const user = await authService.refreshUserFromStorage();
                    if (user) {
                        if (user.uid.startsWith('guest_')) {
                            // Guard: Anons cannot stay in lobby
                            router.replace('/login');
                            return;
                        }
                        console.log('[Lobby] User loaded:', user.displayName, user.avatarId);
                        setCurrentUser(user);
                    } else {
                        // No user at all -> Login
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('[Lobby] Error loading user:', error);
                }
            };
            loadUser();
        }, [])
    );

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let retryInterval: any = null;

        const startListening = () => {
            if (activeTab === 'PUBLIC') {
                setLoadingPublicRooms(true);
                unsubscribe = listenToPublicRooms((rooms) => {
                    setPublicRooms(rooms);
                    setLoadingPublicRooms(false);
                }, (error) => {
                    console.log("Error listening to rooms", error);
                    setLoadingPublicRooms(false);
                    // Retenter plus tard si erreur (ex: déconnexion passagère)
                });
            }
        };

        startListening();

        // Robustness: Re-check every 30s if we are in public tab
        if (activeTab === 'PUBLIC') {
            retryInterval = setInterval(() => {
                if (!unsubscribe) startListening();
            }, 30000);
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (retryInterval) clearInterval(retryInterval);
        };
    }, [activeTab]);

    // ─── Actions ────────────────────────────────────────────────────

    const requireAccountForMultiplayer = (): boolean => {
        if (!auth.currentUser) {
            Alert.alert("Connexion requise", "Vous devez être connecté pour jouer en Multijoueur.");
            router.push('/login');
            return false;
        }
        if (auth.currentUser.isAnonymous) {
            Alert.alert(
                "Compte Gratuit Requis",
                "Le mode Multijoueur est réservé aux comptes inscrits. Créez un compte gratuit pour défier d'autres joueurs !",
                [
                    { text: "Plus tard", style: "cancel" },
                    { text: "Créer un compte", onPress: () => router.push('/login') }
                ]
            );
            return false;
        }
        return true;
    };

    const handleCreateRoom = async () => {
        if (!requireAccountForMultiplayer()) return;
        if (!currentUser) return;
        try {
            setLoading(true);
            const options: RoomOptions = { gameMode, winningCondition, turnDuration, startingHandSize };
            const newRoomId = await createRoom(
                currentUser,
                isPrivateRoom,
                roomNameInput.trim() || undefined,
                undefined,
                options
            );
            // Navigate directly to game lobby (no intermediate screen)
            router.push({ pathname: '/game/[id]', params: { id: newRoomId, userId: currentUser.uid } });
        } catch (error) {
            Alert.alert("Erreur", "Impossible de créer la table.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!requireAccountForMultiplayer()) return;
        if (!roomIdToJoin.trim() || !currentUser) return;
        try {
            setLoading(true);
            await joinRoom(roomIdToJoin.trim(), currentUser);
            router.push({ pathname: '/game/[id]', params: { id: roomIdToJoin.trim(), userId: currentUser.uid } });
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de rejoindre.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinPublicRoom = async (roomId: string) => {
        if (!requireAccountForMultiplayer()) return;
        if (!currentUser) return;
        try {
            setLoading(true);
            await joinRoom(roomId, currentUser);
            router.push({ pathname: '/game/[id]', params: { id: roomId, userId: currentUser.uid } });
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de rejoindre.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Tabs ───────────────────────────────────────────────────────

    const renderTabs = () => (
        <View style={styles.tabWrapper}>
            <View style={styles.tabContainer}>
                {([
                    { key: 'CREATE' as LobbyTab, label: 'Créer' },
                    { key: 'JOIN' as LobbyTab, label: 'Rejoindre' },
                    { key: 'PUBLIC' as LobbyTab, label: 'Publiques' },
                ]).map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]} numberOfLines={1}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // ─── CREATE Tab ─────────────────────────────────────────────────

    const renderCreateTab = () => (
        <Animated.View entering={FadeIn.delay(200)} style={styles.card}>
            <TextInput
                style={styles.input}
                placeholder="Nom de la table (optionnel)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={roomNameInput}
                onChangeText={setRoomNameInput}
                maxLength={20}
            />

            {/* Game Mode Selection */}
            <View style={styles.gameModeContainer}>
                <TouchableOpacity
                    style={[styles.gameModeTile, gameMode === 'SCORE' && styles.gameModeTileActive]}
                    onPress={() => { setGameMode('SCORE'); setWinningCondition(6); }}
                >
                    <Text style={[styles.gameModeTitle, gameMode === 'SCORE' && styles.gameModeTitleActive]}>
                        <Text style={styles.gameModeIcon}>🎯</Text> SCORE
                    </Text>
                    <Text style={[styles.gameModeSubtitle, gameMode === 'SCORE' && styles.gameModeSubtitleActive]}>
                        Le premier à X points
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.gameModeTile, gameMode === 'COCHON' && styles.gameModeTileActive]}
                    onPress={() => { setGameMode('COCHON'); setWinningCondition(3); }}
                >
                    <Text style={[styles.gameModeTitle, gameMode === 'COCHON' && styles.gameModeTitleActive]}>
                        <Text style={styles.gameModeIcon}>🐷</Text> COCHON
                    </Text>
                    <Text style={[styles.gameModeSubtitle, gameMode === 'COCHON' && styles.gameModeSubtitleActive]}>
                        Évitez le zéro
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.gameModeTile, gameMode === 'MANCHE' && styles.gameModeTileActive]}
                    onPress={() => { setGameMode('MANCHE'); setWinningCondition(3); }}
                >
                    <Text style={[styles.gameModeTitle, gameMode === 'MANCHE' && styles.gameModeTitleActive]}>
                        <Text style={styles.gameModeIcon}>🏆</Text> MANCHE
                    </Text>
                    <Text style={[styles.gameModeSubtitle, gameMode === 'MANCHE' && styles.gameModeSubtitleActive]}>
                        Le meilleur à X manches
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Options Bar */}
            <View style={styles.optionsBar}>
                {/* Type de Table */}
                <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>Table: <Text style={styles.diffValue}>{
                        isPrivateRoom ? 'PRIVÉE' : 'PUBLIQUE'
                    }</Text></Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity style={[styles.diffBtn, !isPrivateRoom && styles.activeDiffBtn]} onPress={() => setIsPrivateRoom(false)}><Text style={[styles.compactIconText, !isPrivateRoom && styles.activeCompactIconText]}>🌍 Public</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.diffBtn, isPrivateRoom && styles.activeDiffBtn]} onPress={() => setIsPrivateRoom(true)}><Text style={[styles.compactIconText, isPrivateRoom && styles.activeCompactIconText]}>🔒 Privé</Text></TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.optionSeparator}>|</Text>

                {/* But */}
                <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>But: </Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity onPress={() => setWinningCondition(Math.max(1, winningCondition - 1))} style={styles.compactBtn}><Ionicons name="remove" size={12} color="#000" /></TouchableOpacity>
                        <Text style={styles.optionValue}>{winningCondition}</Text>
                        <TouchableOpacity onPress={() => setWinningCondition(Math.min(100, winningCondition + 1))} style={styles.compactBtn}><Ionicons name="add" size={12} color="#000" /></TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.optionSeparator}>|</Text>

                {/* Durée */}
                <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>Durée: {turnDuration === 0 ? 'Off' : `${turnDuration}s`} </Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity onPress={() => {
                            const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                            const idx = steps.indexOf(turnDuration);
                            if (idx > 0) setTurnDuration(steps[idx - 1]);
                        }} style={styles.compactBtn}><Ionicons name="remove" size={12} color="#000" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                            const idx = steps.indexOf(turnDuration);
                            if (idx < steps.length - 1) setTurnDuration(steps[idx + 1]);
                        }} style={styles.compactBtn}><Ionicons name="add" size={12} color="#000" /></TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.optionSeparator}>|</Text>

                {/* Main */}
                <View style={styles.optionGroup}>
                    <Text style={styles.optionLabel}>Main: </Text>
                    <View style={styles.optionRow}>
                        {[3, 5, 7].map(size => (
                            <TouchableOpacity key={size} onPress={() => setStartingHandSize(size)} style={[styles.mainBtn, startingHandSize === size && styles.activeMainBtn]}>
                                <Text style={[styles.mainBtnText, startingHandSize === size && styles.activeMainBtnText]}>{size}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity style={styles.startButton} onPress={handleCreateRoom}>
                <Text style={styles.startText}>[ CRÉER LA TABLE ]</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    // ─── JOIN Tab ───────────────────────────────────────────────────

    const renderJoinTab = () => (
        <Animated.View entering={FadeIn.delay(200)} style={styles.card}>
            <Text style={styles.cardTitle}>Rejoindre une Table</Text>
            <Text style={styles.cardSubtitle}>Entre le code partagé par l&apos;hôte</Text>
            <TextInput
                style={styles.input}
                placeholder="Code de la table"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={roomIdToJoin}
                onChangeText={setRoomIdToJoin}
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.startButton} onPress={handleJoinRoom}>
                <Text style={styles.startText}>[ REJOINDRE LA TABLE ]</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    // ─── PUBLIC Tab ─────────────────────────────────────────────────

    const renderPublicRoom = ({ item, index }: { item: GameRoom, index: number }) => (
        <Animated.View entering={FadeInLeft.delay(index * 80)}>
            <TouchableOpacity
                style={styles.roomItem}
                onPress={() => handleJoinPublicRoom(item.roomId)}
            >
                <View style={styles.roomItemLeft}>
                    <View style={styles.roomAvatar}>
                        <Text style={styles.roomAvatarText}>
                            {item.players[0]?.displayName?.charAt(0) || '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.roomNameBold}>
                            {item.roomName || `Table #${item.roomId.slice(0, 4)}`}
                        </Text>
                        <Text style={styles.roomHost}>Hôte: {item.players[0]?.displayName}</Text>
                    </View>
                </View>
                <View style={styles.roomItemRight}>
                    {/* Mode badge */}
                    <View style={styles.modeBadge}>
                        <Text style={styles.modeBadgeText}>
                            {MODE_LABELS[item.gameMode || 'MANCHE']}
                        </Text>
                    </View>
                    <Text style={styles.playerCount}>{item.players.length}/3 👤</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderPublicTab = () => (
        <View style={styles.listContainer}>
            {loadingPublicRooms ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator color="#FFD700" />
                </View>
            ) : (
                <FlatList
                    data={publicRooms}
                    keyExtractor={(item) => item.roomId}
                    renderItem={renderPublicRoom}
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🏝️</Text>
                            <Text style={styles.emptyText}>Aucune table publique pour le moment.</Text>
                            <Text style={styles.emptyHint}>Crée la première !</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    // ─── Main Render ────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2D1B4E', '#1A0E2E']}
                style={styles.container}
            >

                <View style={[styles.header, { paddingTop: Math.max(insets.top, 5) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>Multi</Text>
                    {renderTabs()}
                </View>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'CREATE' && renderCreateTab()}
                    {activeTab === 'JOIN' && renderJoinTab()}
                    {activeTab === 'PUBLIC' && renderPublicTab()}
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1A0E2E',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    // ─── Header ─────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    backButton: {
        paddingVertical: 10,
        paddingRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginRight: 10,
    },
    // ─── Tabs ───────────────────────────────────────────────────
    tabWrapper: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
        fontSize: 11,
    },
    activeTabText: {
        color: '#1A0E2E',
    },
    // ─── Scroll ─────────────────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 15,
    },
    // ─── Card ───────────────────────────────────────────────────
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 18,
    },
    // ─── Inputs ─────────────────────────────────────────────────
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 14,
        color: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 15,
        fontSize: 15,
    },
    // ─── Toggle Public/Private ──────────────────────────────────
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    // ─── Game Mode Section ───────────────────────────────────────
    gameModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        gap: 10,
    },
    gameModeTile: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 25,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    gameModeTileActive: {
        backgroundColor: '#FFF',
        borderColor: '#FFD700',
    },
    gameModeTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    gameModeTitleActive: {
        color: '#000',
    },
    gameModeSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        textAlign: 'center',
    },
    gameModeSubtitleActive: {
        color: '#333',
        fontWeight: 'bold',
    },
    gameModeIcon: {
        fontSize: 14,
    },
    // ─── Options Bar ─────────────────────────────────────────────
    optionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        width: '100%',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    optionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginRight: 6,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactIconText: {
        fontSize: 12,
        color: '#888',
        fontWeight: 'bold',
    },
    activeCompactIconText: {
        color: '#ff9800',
    },
    diffValue: {
        color: '#ff9800',
        fontWeight: 'bold',
        fontSize: 10,
    },
    diffBtn: {
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    activeDiffBtn: {
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
    },
    optionSeparator: {
        color: '#CCC',
        fontSize: 16,
        marginHorizontal: 8,
    },
    compactBtn: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        padding: 2,
        backgroundColor: '#F5F5F5',
    },
    optionValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#000',
        minWidth: 16,
        textAlign: 'center',
    },
    mainBtn: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#F5F5F5',
    },
    activeMainBtn: {
        backgroundColor: '#333',
        borderColor: '#333',
    },
    mainBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    activeMainBtnText: {
        color: '#FFF',
    },
    // ─── Buttons ────────────────────────────────────────────────
    startButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    startText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    // ─── Public Rooms List ──────────────────────────────────────
    listContainer: {
        flex: 1,
    },
    roomItem: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    roomItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    roomItemRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    roomAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,111,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff6f00',
    },
    roomAvatarText: {
        color: '#ff6f00',
        fontWeight: 'bold',
        fontSize: 20,
    },
    roomNameBold: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    roomHost: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
    modeBadge: {
        backgroundColor: 'rgba(255,215,0,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    modeBadgeText: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: 'bold',
    },
    playerCount: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        paddingTop: 50,
        alignItems: 'center',
        gap: 8,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 4,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
        fontSize: 15,
    },
    emptyHint: {
        color: 'rgba(255,215,0,0.5)',
        fontSize: 13,
    },
});
