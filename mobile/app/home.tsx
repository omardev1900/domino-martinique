
import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    Image
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { authService } from '../src/core/services/auth.service';
import { PlayerProfile } from '../src/core/types';
import { getAvatarImage, AVAILABLE_AVATARS, AvatarId } from '../src/core/avatars';

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [user, setUser] = useState<PlayerProfile | null>(null);

    useFocusEffect(
        useCallback(() => {
            authService.getCurrentUser().then(setUser);
        }, [])
    );

    // Check if avatar is a valid image avatar
    const isImageAvatar = user?.avatarUrl && AVAILABLE_AVATARS.includes(user.avatarUrl as AvatarId);

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
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
                            {isImageAvatar ? (
                                <Image
                                    source={getAvatarImage(user?.avatarUrl)}
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.[0] || 'I'}
                                </Text>
                            )}
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
                            style={styles.modeCard}
                            onPress={() => router.push('/lobby')}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#2196F3', '#1565C0']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardIcon}>👥</Text>
                                <Text style={styles.cardTitle}>Mode Multijoueurs</Text>
                                <Text style={styles.cardDesc}>Jouer contre des amis</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
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
        color: '#0d1f0d',
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
});
