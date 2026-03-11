
import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    Alert,
    Modal,
    Platform
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Rect, Path, Defs, Pattern } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { authService } from '../src/core/services/auth.service';
import { statsService } from '../src/core/services/stats.service';
import { economyService } from '../src/core/services/economy.service';
import { PlayerProfile } from '../src/core/types';
import { DAILY_REWARD_COINS } from '../src/core/economy.constants';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../src/core/avatars';
import { EconomyHeader } from '../src/components/EconomyHeader';
import { DailyRewardModal } from '../src/components/DailyRewardModal';
import { HelpOverlay } from '../src/components/HelpOverlay';

const MadrasPattern = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" opacity={0.07}>
            <Defs>
                <Pattern
                    id="madras"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    {/* Horizontal lines */}
                    <Rect x="0" y="5" width="40" height="2" fill="#000" />
                    <Rect x="0" y="25" width="40" height="1" fill="#000" />
                    {/* Vertical lines */}
                    <Rect x="5" y="0" width="2" height="40" fill="#000" />
                    <Rect x="25" y="0" width="1" height="40" fill="#000" />
                </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#madras)" />
        </Svg>
    </View>
);

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [user, setUser] = useState<PlayerProfile | null>(null);
    const [reconnectRoomId, setReconnectRoomId] = useState<string | null>(null);
    const [economyRefresh, setEconomyRefresh] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showDailyReward, setShowDailyReward] = useState(false);
    const [dailyRewardAmount, setDailyRewardAmount] = useState(0);
    const [showHelp, setShowHelp] = useState(false);

    useFocusEffect(
        useCallback(() => {
            authService.getCurrentUser().then(u => {
                setUser(u);
                if (u && !u.uid.startsWith('guest_')) {
                    console.log('🔄 HomeScreen: Forcing stats sync for', u.displayName);
                    statsService.syncWithFirebase(u.uid);
                    // Écrire displayName + avatarId dans Firestore pour le leaderboard
                    economyService.syncProfileToFirebase(
                        u.uid,
                        u.displayName,
                        u.avatarId || u.avatarUrl || 'avatar_default'
                    );
                    economyService.syncFromFirebase(u.uid).then(async () => {
                        // Vérification du cadeau quotidien (sans le créditer — le modal s'en charge)
                        const isAvailable = await economyService.isDailyRewardAvailable();
                        if (isAvailable) {
                            setDailyRewardAmount(DAILY_REWARD_COINS);
                            setShowDailyReward(true);
                        }
                    }).catch(console.error);
                }
            });
            setEconomyRefresh(v => v + 1); // force EconomyHeader refresh
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

    const handleClaimDailyReward = async () => {
        await economyService.checkAndClaimDailyReward(user?.uid);
        setShowDailyReward(false);
        setEconomyRefresh(v => v + 1);
    };

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

    // Fullscreen API (web only)
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS !== 'web') return;
            const handleChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };
            document.addEventListener('fullscreenchange', handleChange);
            return () => document.removeEventListener('fullscreenchange', handleChange);
        }, [])
    );

    const toggleFullscreen = useCallback(() => {
        if (Platform.OS !== 'web') return;
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    return (
        <LinearGradient
            colors={['#2D1B4E', '#1A0E2E']}
            style={[styles.container, { minHeight: height }]}
        >
            {/* Madras Pattern Overlay */}
            <MadrasPattern />

            {/* Header Area */}
            <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
                {/* Left Side: Controls */}
                <View style={styles.headerLeft}>
                    {Platform.OS === 'web' && (
                        <TouchableOpacity
                            style={styles.fullscreenButton}
                            onPress={toggleFullscreen}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isFullscreen ? "contract-outline" : "expand-outline"}
                                size={20}
                                color="#FFD700"
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => setShowHelp(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="help-circle-outline"
                            size={24}
                            color="#FFD700"
                        />
                    </TouchableOpacity>
                </View>

                {/* Right Side: Economy & User Info */}
                <Animated.View entering={FadeInRight.duration(400)} style={styles.headerRight}>
                    <EconomyHeader refreshTrigger={economyRefresh} />

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push('/store')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>🛒</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push('/collection')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>🎒</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push('/leaderboard')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>🏆</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push('/stats')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.settingsIcon}>📈</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.userBadge}
                            onPress={() => router.push('/modal')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.avatarCircle}>
                                <Image
                                    source={getAvatarImage(user?.avatarUrl)}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
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
                    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
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

                    <Animated.View entering={FadeInUp.delay(400).duration(500)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
                        <TouchableOpacity
                            style={styles.modeCard}
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
                                colors={['#1565C0', '#42A5F5']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardIcon}>{user?.uid?.startsWith('guest_') ? '🔒' : '👥'}</Text>
                                <Text style={styles.cardTitle}>Multijoueurs</Text>
                                <Text style={styles.cardDesc}>
                                    {user?.uid?.startsWith('guest_') ? 'Nécessite un compte' : 'Jouer contre des amis'}
                                </Text>
                                {user?.uid?.startsWith('guest_') && (
                                    <View style={styles.lockOverlay} />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(500)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
                        <TouchableOpacity
                            style={[styles.modeCard, { opacity: 0.7 }]}
                            disabled={true}
                            activeOpacity={1}
                        >
                            <LinearGradient
                                colors={['#FF9800', '#F57C00']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardIcon}>🏆</Text>
                                <Text style={styles.cardTitle}>Tournoi</Text>
                                <Text style={styles.cardDesc}>Prochainement</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Help Overlay */}
            <HelpOverlay 
                visible={showHelp} 
                onClose={() => setShowHelp(false)} 
            />

            {/* Daily Reward Modal — affiché uniquement si aucun modal de reconnexion */}
            <DailyRewardModal
                visible={showDailyReward && !reconnectRoomId}
                amount={dailyRewardAmount}
                onClaim={handleClaimDailyReward}
            />

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
        height: 60,
        zIndex: 10,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fullscreenButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingHorizontal: '6%',
        gap: 16,
    },
    cardWrapper: {
        width: '100%',
        maxWidth: 280,
    },
    cardWrapperLandscape: {
        flex: 1,
        maxWidth: 300,
        minWidth: 160,
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
        paddingVertical: 12, // Reduced from 24
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120, // Reduced from 140
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
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
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
