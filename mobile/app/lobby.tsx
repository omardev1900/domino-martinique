
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
import { createRoom, joinRoom, listenToPublicRooms, RoomOptions } from '../src/core/services/firebase';
import { PlayerProfile, GameMode, GameRoom } from '../src/core/types';
import { authService } from '../src/core/services/auth.service';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

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
    const [turnDuration, setTurnDuration] = useState(1);
    const [startingHandSize, setStartingHandSize] = useState(3);

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
                        console.log('[Lobby] User loaded:', user.displayName, user.avatarId);
                        setCurrentUser(user);
                    } else {
                        // Only create new guest if absolutely no user could be recovered
                        console.log('[Lobby] No user found, logging in as guest...');
                        const guest = await authService.loginAsGuest();
                        setCurrentUser(guest);
                    }
                } catch (error) {
                    console.error('[Lobby] Error loading user:', error);
                }
            };
            loadUser();
        }, [])
    );

    useEffect(() => {
        if (activeTab === 'PUBLIC') {
            setLoadingPublicRooms(true);
            const unsubscribe = listenToPublicRooms((rooms) => {
                setPublicRooms(rooms);
                setLoadingPublicRooms(false);
            }, (error) => {
                console.log("Error listening to rooms", error);
                setLoadingPublicRooms(false);
            });
            return () => unsubscribe();
        }
    }, [activeTab]);

    // ─── Actions ────────────────────────────────────────────────────

    const handleCreateRoom = async () => {
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
                    { key: 'CREATE' as LobbyTab, label: '🏠 Créer', icon: 'add-circle-outline' },
                    { key: 'JOIN' as LobbyTab, label: '🔑 Rejoindre', icon: 'enter-outline' },
                    { key: 'PUBLIC' as LobbyTab, label: '🌍 Publiques', icon: 'globe-outline' },
                ]).map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
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
            <Text style={styles.cardTitle}>Créer une Table</Text>

            {/* Public / Private Toggle */}
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleButton, !isPrivateRoom && styles.toggleButtonActive]}
                    onPress={() => setIsPrivateRoom(false)}
                >
                    <Text style={styles.toggleIcon}>🌍</Text>
                    <Text style={[styles.toggleLabel, !isPrivateRoom && styles.toggleLabelActive]}>Publique</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, isPrivateRoom && styles.toggleButtonActivePrivate]}
                    onPress={() => setIsPrivateRoom(true)}
                >
                    <Text style={styles.toggleIcon}>🔒</Text>
                    <Text style={[styles.toggleLabel, isPrivateRoom && styles.toggleLabelActive]}>Privée</Text>
                </TouchableOpacity>
            </View>

            {/* Room Name */}
            <TextInput
                style={styles.input}
                placeholder="Nom de la table (optionnel)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={roomNameInput}
                onChangeText={setRoomNameInput}
                maxLength={20}
            />

            {/* ─── Game Options ──────────────────────── */}
            <View style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>OPTIONS DE JEU</Text>

                {/* Game Mode */}
                <View style={styles.optionItem}>
                    <Text style={styles.optionLabel}>MODE</Text>
                    <View style={styles.buttonGroup}>
                        {(['SCORE', 'COCHON', 'MANCHE'] as GameMode[]).map(mode => (
                            <TouchableOpacity
                                key={mode}
                                style={[styles.modeButton, gameMode === mode && styles.activeModeButton]}
                                onPress={() => setGameMode(mode)}
                            >
                                <Text style={[styles.modeButtonText, gameMode === mode && styles.activeModeButtonText]}>
                                    {MODE_LABELS[mode]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Winning Condition */}
                <View style={styles.optionItem}>
                    <Text style={styles.optionLabel}>
                        OBJECTIF : <Text style={styles.valueHighlight}>{winningCondition} {MODE_UNIT_LABELS[gameMode]}</Text>
                    </Text>
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
                </View>

                {/* Starting Hand Size */}
                <View style={styles.optionItem}>
                    <Text style={styles.optionLabel}>
                        DOMINOS DE DÉPART : <Text style={styles.valueHighlight}>{startingHandSize}</Text>
                    </Text>
                    <View style={styles.buttonGroup}>
                        {([3, 5, 7] as number[]).map(size => (
                            <TouchableOpacity
                                key={size}
                                style={[styles.modeButton, startingHandSize === size && styles.activeModeButton]}
                                onPress={() => setStartingHandSize(size)}
                            >
                                <Text style={[styles.modeButtonText, startingHandSize === size && styles.activeModeButtonText]}>
                                    {size}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Turn Duration */}
                <View style={styles.optionItem}>
                    <Text style={styles.optionLabel}>
                        DURÉE DU TOUR : <Text style={styles.valueHighlight}>{turnDuration === 0 ? 'Illimité' : `${turnDuration}s`}</Text>
                    </Text>
                    <View style={styles.conditionControls}>
                        <TouchableOpacity
                            onPress={() => {
                                const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                const idx = steps.indexOf(turnDuration);
                                if (idx > 0) setTurnDuration(steps[idx - 1]);
                            }}
                            style={styles.adjustButton}
                        >
                            <Ionicons name="remove-circle-outline" size={28} color="#FFD700" />
                        </TouchableOpacity>
                        <Text style={styles.conditionValueText}>{turnDuration === 0 ? 'Off' : turnDuration}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                const steps = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
                                const idx = steps.indexOf(turnDuration);
                                if (idx < steps.length - 1) setTurnDuration(steps[idx + 1]);
                            }}
                            style={styles.adjustButton}
                        >
                            <Ionicons name="add-circle-outline" size={28} color="#FFD700" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRoom}>
                <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.primaryButtonGradient}
                >
                    <Ionicons name="add-circle" size={22} color="#FFF" />
                    <Text style={styles.primaryButtonText}>CRÉER LA TABLE</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    // ─── JOIN Tab ───────────────────────────────────────────────────

    const renderJoinTab = () => (
        <Animated.View entering={FadeIn.delay(200)} style={styles.card}>
            <Text style={styles.cardTitle}>Rejoindre une Table</Text>
            <Text style={styles.cardSubtitle}>Entre le code partagé par l'hôte</Text>
            <TextInput
                style={styles.input}
                placeholder="Code de la table"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={roomIdToJoin}
                onChangeText={setRoomIdToJoin}
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleJoinRoom}>
                <LinearGradient
                    colors={['#2196F3', '#1565C0']}
                    style={styles.primaryButtonGradient}
                >
                    <Ionicons name="enter-outline" size={22} color="#FFF" />
                    <Text style={styles.primaryButtonText}>REJOINDRE</Text>
                </LinearGradient>
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

                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>Multijoueurs</Text>
                </View>

                {renderTabs()}
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
        paddingHorizontal: 20,
        height: 80,
    },
    backButton: {
        paddingVertical: 10,
        paddingRight: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
    // ─── Tabs ───────────────────────────────────────────────────
    tabWrapper: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 25,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 21,
    },
    activeTab: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
        fontSize: 13,
    },
    activeTabText: {
        color: '#1A0E2E',
    },
    // ─── Scroll ─────────────────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    // ─── Card ───────────────────────────────────────────────────
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
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
    toggleButtonActive: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76,175,80,0.15)',
    },
    toggleButtonActivePrivate: {
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255,152,0,0.15)',
    },
    toggleIcon: {
        fontSize: 20,
    },
    toggleLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        fontSize: 15,
    },
    toggleLabelActive: {
        color: '#FFF',
    },
    // ─── Game Options Section ───────────────────────────────────
    optionsSection: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: 2,
    },
    optionItem: {
        marginBottom: 14,
    },
    optionLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    valueHighlight: {
        color: '#FFD700',
    },
    buttonGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 4,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeModeButton: {
        backgroundColor: '#FFD700',
    },
    modeButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    activeModeButtonText: {
        color: '#000',
    },
    conditionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
    },
    adjustButton: {
        padding: 4,
    },
    conditionValueText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        minWidth: 40,
        textAlign: 'center',
    },
    // ─── Buttons ────────────────────────────────────────────────
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
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
