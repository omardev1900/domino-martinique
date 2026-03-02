
import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    Image,
    Alert,
    Modal
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { authService } from '../src/core/services/auth.service';
import { statsService } from '../src/core/services/stats.service';
import { PlayerProfile } from '../src/core/types';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../src/core/avatars';

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [user, setUser] = useState<PlayerProfile | null>(null);
    const [reconnectRoomId, setReconnectRoomId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            authService.getCurrentUser().then(u => {
                setUser(u);
                if (u && !u.uid.startsWith('guest_')) {
                    console.log('🔄 HomeScreen: Forcing stats sync for', u.displayName);
                    statsService.syncWithFirebase(u.uid);
                }
            });
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const checkActiveGame = async () => {
                try {
                    const activeRoomId = await AsyncStorage.getItem('active_roomId');
                    if (activeRoomId) {
                        setReconnectRoomId(activeRoomId);
                    }
                } catch (e) {
                    console.error('Error checking active room', e);
                }
            };

            // Delay check slightly to ensure screen is settled
            const timer = setTimeout(checkActiveGame, 600);
            return () => clearTimeout(timer);
        }, [])
    );

    const handleReconnect = useCallback(() => {
        if (reconnectRoomId) {
            router.push({
                pathname: '/game/[id]',
                params: {
                    id: reconnectRoomId,
                    userId: user?.uid || 'guest'
                }
            });
            setReconnectRoomId(null);
        }
    }, [reconnectRoomId, user, router]);

    const handleCancelReconnect = async () => {
        try {
            await AsyncStorage.removeItem('active_roomId');
            setReconnectRoomId(null);
        } catch (e) {
            console.error('Error clearing active room', e);
        }
    };

    return (
        <LinearGradient
            colors={['#2D1B4E', '#1A0E2E']}
            style={[styles.container, { minHeight: height }]}
        >
            {/* Header Area */}
            <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
                {/* Settings Button - Top Left */}
                <Animated.View entering={FadeInLeft.duration(400)}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/modal')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* User Info - Top Right */}
                <Animated.View entering={FadeInRight.duration(400)}>
                    <TouchableOpacity
                        style={styles.userBadge}
                        onPress={() => router.push('/profile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.userName} numberOfLines={1}>{user?.displayName || 'Invité'}</Text>
                        <View style={styles.avatarCircle}>
                            <Image
                                source={getAvatarImage((user?.avatarUrl && (AVAILABLE_AVATARS.includes(user.avatarUrl as AvatarId) || user.avatarUrl === 'avatar_default')) ? user.avatarUrl : 'avatar_default')}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Main Content Area */}
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.cardsContainer, isLandscape && styles.cardsContainerLandscape]}>
                    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={styles.modeCard}
                            onPress={() => router.push('/solo')}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#2E7D32']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardIcon}>🎮</Text>
                                <Text style={styles.cardTitle}>Mode Solo</Text>
                                <Text style={styles.cardDesc}>Jouer contre le Bot</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.cardWrapper}>
                        <TouchableOpacity
                            style={[styles.modeCard, user?.uid?.startsWith('guest_') && { opacity: 0.7 }]}
                            onPress={() => {
                                if (user?.uid?.startsWith('guest_')) {
                                    Alert.alert(
                                        'Accès Restreint',
                                        'Le mode multijoueur requiert un compte gratuit pour jouer avec des amis, gagner des Coins et être classé.',
                                        [
                                            { text: 'Plus tard', style: 'cancel' },
                                            { text: 'Créer un compte', onPress: () => router.push('/login') }
                                        ]
                                    );
                                } else {
                                    router.push('/lobby');
                                }
                            }}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={user?.uid?.startsWith('guest_') ? ['#424242', '#212121'] : ['#2196F3', '#1565C0']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardIcon}>{user?.uid?.startsWith('guest_') ? '🔒' : '👥'}</Text>
                                <Text style={styles.cardTitle}>Mode Multijoueurs</Text>
                                <Text style={styles.cardDesc}>
                                    {user?.uid?.startsWith('guest_') ? 'Nécessite un compte' : 'Jouer contre des amis'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Reconnection Modal */}
            <Modal
                visible={!!reconnectRoomId}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={ZoomIn.duration(400)} style={styles.modalContent}>
                        <LinearGradient
                            colors={['#2D1B4E', '#422770']}
                            style={styles.modalGradient}
                        >
                            <Text style={styles.modalIcon}>📡</Text>
                            <Text style={styles.modalTitle}>Partie Interrompue</Text>
                            <Text style={styles.modalDescription}>
                                Une partie multijoueur est toujours active. Souhaitez-vous la rejoindre pour reprendre la main ?
                            </Text>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalButtonSecondary}
                                    onPress={handleCancelReconnect}
                                >
                                    <Text style={styles.modalButtonTextSecondary}>Abandonner</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalButtonPrimary}
                                    onPress={handleReconnect}
                                >
                                    <LinearGradient
                                        colors={['#FFD700', '#FFA500']}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonTextPrimary}>REJOINDRE</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 100,
        zIndex: 10,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        paddingLeft: 12,
        borderRadius: 20,
        maxWidth: 160,
    },
    userName: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
        marginRight: 8,
        flexShrink: 1,
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 32 * 1.6,
        height: 32 * 1.6,
        position: 'absolute',
        top: -(32 * 1.6 - 32) * 0.25,
    },
    avatarText: {
        color: '#1A0E2E',
        fontWeight: 'bold',
        fontSize: 18,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 22,
    },
    cardsContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        paddingVertical: 20,
    },
    cardsContainerLandscape: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    cardWrapper: {
        width: '100%',
        maxWidth: 280,
    },
    modeCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    cardGradient: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
    },
    cardIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    modalGradient: {
        padding: 30,
        alignItems: 'center',
    },
    modalIcon: {
        fontSize: 50,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    modalButtonSecondary: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalButtonTextSecondary: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtonPrimary: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
    },
    modalButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonTextPrimary: {
        color: '#1A0E2E',
        fontSize: 14,
        fontWeight: '900',
    },
});
