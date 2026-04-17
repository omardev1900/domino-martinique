import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { authService } from '../src/core/services/auth.service';

export default function GameModesScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        authService.getCurrentUser().then(u => setUser(u));
    }, []);

    return (
        <LinearGradient colors={['#2D1B4E', '#1A0E2E']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>CHOISIR UN MODE</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </View>

            <View style={[styles.cardsContainer, isLandscape && styles.cardsContainerLandscape]}>
                <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
                    <TouchableOpacity
                        style={styles.modeCard}
                        onPress={() => { router.back(); setTimeout(() => router.push('/solo'), 300); }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.cardGradient}>
                            <Text style={styles.cardIcon}>🎮</Text>
                            <Text style={styles.cardTitle}>Mode Solo</Text>
                            <Text style={styles.cardDesc}>Jouer contre le Bot</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200).duration(400)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
                    <TouchableOpacity
                        style={styles.modeCard}
                        onPress={() => {
                            router.back();
                            setTimeout(() => {
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
                            }, 300);
                        }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.cardGradient}>
                            <Text style={styles.cardIcon}>{user?.uid?.startsWith('guest_') ? '🔒' : '👥'}</Text>
                            <Text style={styles.cardTitle}>Multijoueurs</Text>
                            <Text style={styles.cardDesc}>
                                {user?.uid?.startsWith('guest_') ? 'Nécessite un compte' : 'Jouer contre des amis'}
                            </Text>
                            {user?.uid?.startsWith('guest_') && <View style={styles.lockOverlay} />}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.cardWrapper, isLandscape && styles.cardWrapperLandscape]}>
                    <TouchableOpacity
                        style={styles.modeCard}
                        onPress={() => {
                            router.back();
                            setTimeout(() => {
                                if (user?.uid?.startsWith('guest_')) {
                                    Alert.alert(
                                        'Accès Restreint',
                                        'Les tournois requièrent un compte gratuit.',
                                        [
                                            { text: 'Plus tard', style: 'cancel' },
                                            { text: 'Créer un compte', onPress: () => router.push('/login') }
                                        ]
                                    );
                                } else {
                                    // @ts-ignore
                                    router.push('/tournaments');
                                }
                            }, 300);
                        }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.cardGradient}>
                            <Text style={styles.cardIcon}>🏆</Text>
                            <Text style={styles.cardTitle}>Tournois</Text>
                            <Text style={styles.cardDesc}>Compétitions en cours</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 40 },
    title: { color: '#FFD700', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
    closeBtn: { padding: 5 },
    cardsContainer: { flexDirection: 'column', alignItems: 'center', gap: 15 },
    cardsContainerLandscape: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16 },
    cardWrapper: { width: '100%', maxWidth: 320 },
    cardWrapperLandscape: { flex: 1, maxWidth: 300, minWidth: 160 },
    modeCard: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    cardGradient: { paddingVertical: 20, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
    cardIcon: { fontSize: 40, marginBottom: 8 },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
    cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
    lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' }
});
