import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft, FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { createRoom, joinRoom, listenToPublicRooms } from '../src/core/services/firebase';
import { PlayerProfile } from '../src/core/types';
import { authService } from '../src/core/services/auth.service';
import { FlatList } from 'react-native-gesture-handler';

export default function LobbyScreen() {
    // CORRECT FIX: Separate router and navigation
    const router = useRouter();
    const navigation = useNavigation();
    const [roomIdToJoin, setRoomIdToJoin] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // NEW: Real User Profile State
    const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);

    // New States for Public Rooms
    const [activeTab, setActiveTab] = useState<'CODE' | 'PUBLIC'>('CODE');
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomNameInput, setRoomNameInput] = useState('');
    const [loadingPublicRooms, setLoadingPublicRooms] = useState(false);

    // Fetch Current User on Mount
    React.useEffect(() => {
        const loadUser = async () => {
            const user = await authService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
            } else {
                // Determine what to do if no user found? Login as guest?
                // For now, let's assume auth guard handled it or we trigger guest login
                const guest = await authService.loginAsGuest();
                setCurrentUser(guest);
            }
        };
        loadUser();
    }, []);

    // Initial Load of Public Rooms
    React.useEffect(() => {
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

    // GHOST ROOM FIX: Intercept Back Navigation
    React.useEffect(() => {
        // Ensure navigation is available (it should be in expo-router usually, but safety check)
        if (!navigation) return;

        const unsubscribe = navigation.addListener('beforeRemove', async (e: any) => {
            // If we have a created room or joined room (we track this via current room state usually, 
            // but here we have createdRoomId. For joined rooms, we usually push to GameScreen immediately, 
            // so we only need to clean up here if we are "waiting" in the lobby as creator)

            // Correction: If we joined a room, we navigated TO GameScreen.
            // If we are IN GameScreen, GameScreen handles leave.
            // If we come BACK to Lobby from Game, we are "left".
            // The issue is: If I *Create* a room, I see "Waiting for players...". If I back out NOW, the room stays.

            if (createdRoomId && currentUser) {
                e.preventDefault(); // Stop navigation

                // Optional: Alert confirmation? User asked for "Systematically executed" for Lobby.
                // So no alert, just do it.
                // But we need to await async, so we might need to prevent default, do async, then dispatch again.
                // Or just fire and forget if we trust it executes before component death? 
                // React Native useEffect cleanup usually works, but `beforeRemove` is safer for async.

                // Better UX: Show "Leaving..." spinner?
                setLoading(true);

                try {
                    const { leaveRoom } = require('../src/core/services/firebase'); // Lazy import to avoid circular dep if any
                    await leaveRoom(createdRoomId, currentUser.uid);
                    setCreatedRoomId(null);
                    // Dispatch the action to go back
                    navigation.dispatch(e.data.action);
                } catch (err) {
                    console.error("Cleanup error", err);
                    navigation.dispatch(e.data.action); // Force exit
                } finally {
                    setLoading(false);
                }
            }
        });
        return unsubscribe;
    }, [createdRoomId, currentUser, navigation]);

    const handleCreateRoom = async () => {
        if (!currentUser) {
            Alert.alert("Error", "User profile not loaded.");
            return;
        }
        try {
            setLoading(true);
            const newRoomId = await createRoom(currentUser, isPrivateRoom, roomNameInput.trim());
            setCreatedRoomId(newRoomId);
        } catch (error) {
            Alert.alert("Error", "Failed to create room: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!createdRoomId) return;
        await Clipboard.setStringAsync(createdRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStartGame = () => {
        if (createdRoomId && currentUser) {
            router.push({ pathname: '/game/[id]', params: { id: createdRoomId, userId: currentUser.uid } });
        }
    };

    const handleJoinRoom = async () => {
        if (!roomIdToJoin.trim()) return;
        if (!currentUser) {
            Alert.alert("Error", "User profile not loaded.");
            return;
        }

        try {
            setLoading(true);
            await joinRoom(roomIdToJoin, currentUser);
            router.push({ pathname: '/game/[id]', params: { id: roomIdToJoin, userId: currentUser.uid } });
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de rejoindre : La partie a déjà commencé.");
        } finally {
            setLoading(false);
        }
    };

    // Render Logic
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (createdRoomId) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#1a1a1a', '#000000']}
                    style={StyleSheet.absoluteFill}
                />

                <Animated.View entering={FadeInUp.delay(200)} style={styles.createdContainer}>
                    <Text style={styles.successTitle}>Room Created!</Text>
                    <Text style={styles.successSubtitle}>Share this code with your friends:</Text>

                    <TouchableOpacity onPress={handleCopyCode} style={styles.codeContainer}>
                        <Text style={styles.roomCode}>{createdRoomId}</Text>
                        <Text style={styles.copyText}>{copied ? "Copied!" : "Tap to Copy"}</Text>
                    </TouchableOpacity>

                    <Text style={styles.waitingText}>Waiting for players to join...</Text>
                    <ActivityIndicator color="#FFD700" style={{ marginTop: 20 }} />

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleStartGame}
                    >
                        <Text style={styles.buttonText}>Enter Game Room</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    // Public Room List Item
    const renderPublicRoom = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInLeft.delay(index * 100).springify()}>
            <TouchableOpacity
                style={styles.roomItem}
                onPress={() => {
                    if (!currentUser) return;
                    setLoading(true);
                    joinRoom(item.roomId, currentUser)
                        .then(() => {
                            setLoading(false);
                            router.push({ pathname: '/game/[id]', params: { id: item.roomId, userId: currentUser.uid } });
                        })
                        .catch(err => {
                            setLoading(false);
                            Alert.alert("Erreur", err.message || "Impossible de rejoindre la salle.");
                        });
                }}
            >
                <View style={styles.roomItemLeft}>
                    <View style={styles.roomAvatar}>
                        <Text style={styles.roomAvatarText}>
                            {item.players[0]?.avatarId || item.players[0]?.displayName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.roomNameBold}>{item.roomName || `Table #${item.roomId.slice(0, 4)}`}</Text>
                        <Text style={styles.roomHost}>Host: {item.players[0]?.displayName || 'Unknown'}</Text>
                    </View>
                </View>
                <View style={styles.roomItemRight}>
                    <Text style={styles.playerCount}>{item.players.length}/3 👤</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#2c3e50']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Multiplayer Lobby</Text>
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.infoContainer}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'CODE' && styles.activeTab]}
                        onPress={() => setActiveTab('CODE')}
                    >
                        <Text style={[styles.tabText, activeTab === 'CODE' && styles.activeTabText]}>Join by Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'PUBLIC' && styles.activeTab]}
                        onPress={() => setActiveTab('PUBLIC')}
                    >
                        <Text style={[styles.tabText, activeTab === 'PUBLIC' && styles.activeTabText]}>Public Rooms</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'CODE' ? (
                // JOIN/CREATE SECTION
                <View style={styles.contentContainer}>
                    <Animated.View entering={FadeIn.delay(300)} style={styles.card}>
                        <Text style={styles.cardTitle}>Join a Room</Text>
                        <Text style={styles.cardSubtitle}>Enter Game Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. X7Z9"
                            placeholderTextColor="#666"
                            value={roomIdToJoin}
                            onChangeText={setRoomIdToJoin}
                            autoCapitalize="none"
                            maxLength={30}
                        />
                        <TouchableOpacity style={styles.primaryButton} onPress={handleJoinRoom}>
                            <Text style={styles.buttonText}>Join Game</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(500)} style={[styles.card, { marginTop: 20 }]}>
                        <Text style={styles.cardTitle}>Create a Room</Text>

                        <Text style={styles.cardSubtitle}>Room Name (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Domino Masters"
                            placeholderTextColor="#666"
                            value={roomNameInput}
                            onChangeText={setRoomNameInput}
                        />

                        {/* PRIVATE / PUBLIC Toggle */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setIsPrivateRoom(!isPrivateRoom)}
                        >
                            <View style={[styles.checkbox, !isPrivateRoom && styles.checkboxChecked]}>
                                {!isPrivateRoom && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>Public Game (visible to everyone)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleCreateRoom}
                            disabled={loading}
                        >
                            <Text style={styles.secondaryButtonText}>Create New Game</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            ) : (
                // PUBLIC LIST SECTION
                <View style={styles.listContainer}>
                    {loadingPublicRooms ? (
                        <ActivityIndicator color="#FFD700" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={publicRooms}
                            keyExtractor={(item) => item.roomId}
                            renderItem={renderPublicRoom}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No public rooms available.</Text>
                            }
                        />
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#FFF',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 20,
    },
    infoContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        color: '#AAA',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#000',
    },
    contentContainer: {
        padding: 20,
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    cardSubtitle: {
        color: '#AAA',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 12,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        marginTop: 10,
    },
    secondaryButtonText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#FFD700',
    },
    checkmark: {
        color: '#000',
        fontWeight: 'bold',
    },
    checkboxLabel: {
        color: '#FFF',
        fontSize: 14,
    },
    // Created Room Styles
    createdContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    successSubtitle: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 30,
    },
    codeContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 20,
    },
    roomCode: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 4,
    },
    copyText: {
        color: '#AAA',
        marginTop: 8,
    },
    waitingText: {
        color: '#AAA',
        marginTop: 20,
        fontStyle: 'italic',
    },
    // Public Room List Styles
    roomItem: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#34495e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roomAvatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    roomNameBold: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    roomHost: {
        color: '#AAA',
        fontSize: 12,
    },
    roomItemRight: {
        alignItems: 'flex-end',
    },
    playerCount: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#AAA',
        textAlign: 'center',
        marginTop: 40,
        fontStyle: 'italic',
    },
});
