
import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInLeft, FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoom, joinRoom, listenToPublicRooms } from '../src/core/services/firebase';
import { PlayerProfile } from '../src/core/types';
import { authService } from '../src/core/services/auth.service';
import { FlatList } from 'react-native-gesture-handler';

export default function LobbyScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [roomIdToJoin, setRoomIdToJoin] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'CODE' | 'PUBLIC'>('CODE');
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomNameInput, setRoomNameInput] = useState('');
    const [loadingPublicRooms, setLoadingPublicRooms] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const user = await authService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
            } else {
                const guest = await authService.loginAsGuest();
                setCurrentUser(guest);
            }
        };
        loadUser();
    }, []);

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

    useEffect(() => {
        if (!navigation) return;
        const unsubscribe = navigation.addListener('beforeRemove', async (e: any) => {
            if (createdRoomId && currentUser) {
                e.preventDefault();
                setLoading(true);
                try {
                    const { leaveRoom } = require('../src/core/services/firebase');
                    await leaveRoom(createdRoomId, currentUser.uid);
                    setCreatedRoomId(null);
                    navigation.dispatch(e.data.action);
                } catch (err) {
                    console.error("Cleanup error", err);
                    navigation.dispatch(e.data.action);
                } finally {
                    setLoading(false);
                }
            }
        });
        return unsubscribe;
    }, [createdRoomId, currentUser, navigation]);

    const handleCreateRoom = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const newRoomId = await createRoom(currentUser, isPrivateRoom, roomNameInput.trim());
            setCreatedRoomId(newRoomId);
        } catch (error) {
            Alert.alert("Error", "Failed to create room.");
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (createdRoomId) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0d1f0d', '#1a3d1a']} style={StyleSheet.absoluteFill} />
                <ScrollView contentContainerStyle={[styles.createdContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
                    <Animated.View entering={FadeInUp} style={[styles.successCard, isLandscape && styles.successCardLandscape]}>
                        <View style={[isLandscape && styles.successHeaderLandscape]}>
                            <Text style={styles.successTitle}>Table Créée !</Text>
                            <Text style={styles.successSubtitle}>Partage ce code avec tes amis :</Text>
                        </View>

                        <View style={[isLandscape && styles.successContentLandscape]}>
                            <TouchableOpacity onPress={handleCopyCode} style={[styles.codeContainer, isLandscape && styles.codeContainerLandscape]}>
                                <Text style={[styles.roomCode, isLandscape && styles.roomCodeLandscape]}>{createdRoomId}</Text>
                                <Text style={styles.copyText}>{copied ? "Copié !" : "Appuie pour copier"}</Text>
                            </TouchableOpacity>

                            <View style={styles.waitingSection}>
                                <ActivityIndicator color="#FFD700" size="small" />
                                <Text style={styles.waitingText}>En attente des joueurs...</Text>
                            </View>

                            <TouchableOpacity style={[styles.primaryButton, isLandscape && styles.primaryButtonLandscape]} onPress={handleStartGame}>
                                <Text style={styles.buttonText}>Joindre la table</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    const renderPublicRoom = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInLeft.delay(index * 100)}>
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
                            Alert.alert("Erreur", err.message || "Impossible de rejoindre.");
                        });
                }}
            >
                <View style={styles.roomItemLeft}>
                    <View style={styles.roomAvatar}>
                        <Text style={styles.roomAvatarText}>{item.players[0]?.displayName?.charAt(0) || '?'}</Text>
                    </View>
                    <View>
                        <Text style={styles.roomNameBold}>{item.roomName || `Table #${item.roomId.slice(0, 4)}`}</Text>
                        <Text style={styles.roomHost}>Hôte: {item.players[0]?.displayName}</Text>
                    </View>
                </View>
                <Text style={styles.playerCount}>{item.players.length}/3 👤</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']} style={StyleSheet.absoluteFill} />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>Multijoueurs</Text>
            </View>

            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'CODE' && styles.activeTab]}
                        onPress={() => setActiveTab('CODE')}
                    >
                        <Text style={[styles.tabText, activeTab === 'CODE' && styles.activeTabText]}>Par Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'PUBLIC' && styles.activeTab]}
                        onPress={() => setActiveTab('PUBLIC')}
                    >
                        <Text style={[styles.tabText, activeTab === 'PUBLIC' && styles.activeTabText]}>Tables Publiques</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'CODE' ? (
                    <View style={[styles.mainLayout, isLandscape && styles.mainLayoutLandscape]}>
                        <Animated.View entering={FadeIn.delay(200)} style={styles.card}>
                            <Text style={styles.cardTitle}>Rejoindre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Code (ex: X7Z9)"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={roomIdToJoin}
                                onChangeText={setRoomIdToJoin}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.primaryButton} onPress={handleJoinRoom}>
                                <Text style={styles.buttonText}>Rejoindre</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View entering={FadeIn.delay(400)} style={styles.card}>
                            <View style={styles.inlineHeader}>
                                <TouchableOpacity
                                    style={styles.miniCheckboxContainer}
                                    onPress={() => setIsPrivateRoom(!isPrivateRoom)}
                                >
                                    <View style={[styles.miniCheckbox, !isPrivateRoom && styles.miniCheckboxChecked]}>
                                        {!isPrivateRoom && <Text style={styles.miniCheckmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.cardTitle}>Créer une Table {!isPrivateRoom ? '(Publique)' : '(Privée)'}</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Nom de la table"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={roomNameInput}
                                onChangeText={setRoomNameInput}
                                maxLength={12}
                            />

                            <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateRoom}>
                                <Text style={styles.secondaryButtonText}>Créer la Table</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {loadingPublicRooms ? (
                            <ActivityIndicator color="#FFD700" />
                        ) : (
                            <FlatList
                                data={publicRooms}
                                keyExtractor={(item) => item.roomId}
                                renderItem={renderPublicRoom}
                                scrollEnabled={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Aucune table publique pour le moment.</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0d1f0d',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    backText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
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
    },
    activeTabText: {
        color: '#0d1f0d',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    mainLayout: {
        gap: 20,
    },
    mainLayoutLandscape: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    card: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 15,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 14,
        color: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#0d1f0d',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        padding: 15,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    secondaryButtonText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    inlineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    miniCheckboxContainer: {
        padding: 2,
    },
    miniCheckbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniCheckboxChecked: {
        backgroundColor: '#FFD700',
    },
    miniCheckmark: {
        color: '#0d1f0d',
        fontWeight: 'bold',
        fontSize: 10,
    },
    checkboxLabel: {
        color: '#FFF',
        fontSize: 14,
    },
    createdContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    successCard: {
        width: '100%',
        maxWidth: 450,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    successCardLandscape: {
        maxWidth: 600,
        padding: 20,
    },
    successHeaderLandscape: {
        alignItems: 'center',
        marginBottom: 10,
    },
    successContentLandscape: {
        width: '100%',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 8,
    },
    successSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 25,
    },
    codeContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 25,
    },
    codeContainerLandscape: {
        marginBottom: 15,
        paddingVertical: 10,
    },
    roomCode: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 4,
    },
    roomCodeLandscape: {
        fontSize: 32,
    },
    copyText: {
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
        fontSize: 11,
    },
    waitingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
        fontSize: 13,
    },
    primaryButtonLandscape: {
        paddingVertical: 12,
        width: '100%',
        maxWidth: 250,
    },
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
    },
    roomItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    playerCount: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        paddingTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
    },
});
