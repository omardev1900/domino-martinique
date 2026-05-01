/**
 * ligue-cochons.tsx
 *
 * Écran "Niveau Boucher" — Ligue des Cochons
 * Affiche la progression du joueur, les paliers débloqués/verrouillés,
 * et permet d'équiper son cadre actif.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { leagueService } from '../src/core/services/league.service';
import { economyService } from '../src/core/services/economy.service';
import { authService } from '../src/core/services/auth.service';
import { AvatarFrame } from '../src/components/AvatarFrame';
import {
    LEAGUE_LABELS,
    LEAGUE_ICONS,
    LEAGUE_FRAME_THRESHOLDS,
    LEAGUE_FRAME_REWARDS,
    LEAGUE_GRADE_ORDER,
} from '../src/core/economy.constants';
import { LeagueFrameId, LeagueGrade } from '../src/core/economy.types';

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface TierInfo {
    grade: LeagueGrade;
    label: string;
    icon: string;
    threshold: number;
    frameId: string;
    coinsBonus: number;
    unlocked: boolean;
}

// ─── Barre de progression animée ─────────────────────────────────────────────

interface ProgressBarProps {
    current: number;
    nextThreshold: number | null;
    prevThreshold: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, nextThreshold, prevThreshold }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        const pct = nextThreshold
            ? Math.min((current - prevThreshold) / (nextThreshold - prevThreshold), 1)
            : 1;
        progress.value = withTiming(pct, { duration: 1400, easing: Easing.out(Easing.cubic) });
    }, [current, nextThreshold, prevThreshold]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, barStyle]}>
                    <LinearGradient
                        colors={['#FF8C00', '#FFD700', '#FF4500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                </Animated.View>
                {/* Jalons */}
                {LEAGUE_GRADE_ORDER.map((grade) => {
                    const threshold = LEAGUE_FRAME_THRESHOLDS[grade];
                    const maxThreshold = 500;
                    const fullRange = maxThreshold;
                    const leftPct = (threshold / fullRange) * 100;
                    return (
                        <View
                            key={grade}
                            style={[styles.milestoneMarker, { left: `${leftPct}%` as any }]}
                        >
                            <Text style={styles.milestoneText}>{threshold}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

// ─── Carte d'un palier ────────────────────────────────────────────────────────

interface TierCardProps {
    tier: TierInfo;
    isActive: boolean;
    onEquip: (frameId: LeagueFrameId) => void;
    index: number;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isActive, onEquip, index }) => {
    const frameId = tier.frameId as LeagueFrameId;

    return (
        <Animated.View
            entering={FadeInDown.delay(100 * index).springify()}
            style={[
                styles.tierCard,
                tier.unlocked ? styles.tierCardUnlocked : styles.tierCardLocked,
                isActive && styles.tierCardActive,
            ]}
        >
            {/* Badge actif */}
            {isActive && (
                <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ÉQUIPÉ</Text>
                </View>
            )}

            {/* Icône grade */}
            <Text style={styles.tierGradeIcon}>{tier.icon}</Text>

            {/* Seuil */}
            <Text style={[styles.tierThreshold, !tier.unlocked && { color: 'rgba(255,255,255,0.4)' }]}>
                {tier.threshold} 🐷
            </Text>

            {/* Nom du grade */}
            <Text style={[styles.tierLabel, !tier.unlocked && { color: 'rgba(255,255,255,0.5)' }]}>
                {tier.label}
            </Text>

            {/* Prévisualisation du cadre */}
            <View style={styles.framePreviewWrapper}>
                {tier.unlocked ? (
                    <>
                        <View style={styles.fakeAvatarSmall} />
                        <AvatarFrame frameId={frameId} size={64} />
                    </>
                ) : (
                    <View style={[styles.fakeAvatarSmall, styles.lockedAvatar]}>
                        <Ionicons name="lock-closed" size={22} color="rgba(255,255,255,0.3)" />
                    </View>
                )}
            </View>

            {/* Récompense coins */}
            <View style={styles.rewardBadge}>
                <Text style={[styles.rewardBadgeText, !tier.unlocked && { color: 'rgba(255,255,255,0.4)' }]}>
                    +{tier.coinsBonus.toLocaleString()} 🪙
                </Text>
            </View>

            {/* Bouton équiper */}
            {tier.unlocked && !isActive && (
                <TouchableOpacity
                    style={styles.equipButton}
                    onPress={() => onEquip(frameId)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.equipButtonText}>Équiper</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function LigueCochonsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [cochonsGiven, setCochonsGiven] = useState(0);
    const [unlockedFrames, setUnlockedFrames] = useState<LeagueFrameId[]>([]);
    const [activeFrame, setActiveFrame] = useState<LeagueFrameId | null>(null);
    const [nextThreshold, setNextThreshold] = useState<number | null>(30);
    const [prevThreshold, setPrevThreshold] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [uid, setUid] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const user = await authService.getCurrentUser();
            if (user && !user.uid.startsWith('guest_')) {
                setUid(user.uid);
                const profile = await leagueService.getLeagueProfile(user.uid);
                setCochonsGiven(profile.cochonsGiven);
                setUnlockedFrames(profile.unlockedFrames);
                setActiveFrame(profile.activeFrame);
                setNextThreshold(profile.nextThreshold);

                // Calcul du seuil précédent (pour la barre de progression)
                const ordered = [0, 30, 150, 250, 500];
                const nextIdx = ordered.indexOf(profile.nextThreshold ?? 500);
                setPrevThreshold(nextIdx > 0 ? ordered[nextIdx - 1] : 0);
            } else {
                // Mode invité — on lit depuis le cache local
                const eco = await economyService.getEconomy();
                const c = eco.cochonsGiven ?? 0;
                setCochonsGiven(c);
                setUnlockedFrames(eco.unlockedFrames ?? []);
                setActiveFrame(eco.activeFrame ?? null);
                setNextThreshold(leagueService.getNextFrameThreshold(c));
            }
        } catch (e) {
            console.error('[LigueCochons] loadProfile error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEquip = async (frameId: LeagueFrameId) => {
        setActiveFrame(frameId);
        if (uid) {
            await economyService.equipLeagueFrame(uid, frameId);
        }
    };

    const handleRemoveFrame = async () => {
        setActiveFrame(null);
        if (uid) {
            await economyService.equipLeagueFrame(uid, null);
        }
    };

    // Construire la liste des paliers
    const tiers: TierInfo[] = LEAGUE_GRADE_ORDER.map((grade) => ({
        grade,
        label: LEAGUE_LABELS[grade],
        icon: LEAGUE_ICONS[grade],
        threshold: LEAGUE_FRAME_THRESHOLDS[grade],
        frameId: LEAGUE_FRAME_REWARDS[grade].frameId,
        coinsBonus: LEAGUE_FRAME_REWARDS[grade].coinsBonus,
        unlocked: unlockedFrames.includes(LEAGUE_FRAME_REWARDS[grade].frameId as LeagueFrameId),
    }));

    return (
        <LinearGradient colors={['#1A0535', '#0D0520', '#180830']} style={styles.container}>
            {/* Header — titre + niveau centrés */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerSideSlot} />
                <View style={styles.headerTitleBlock}>
                    <Text style={styles.headerTitle}>Ligue des Cochons</Text>
                    <Text style={styles.headerSubtitle}>Niveau Boucher</Text>
                </View>
                <View style={styles.headerSideSlot}>
                    {activeFrame && (
                        <TouchableOpacity style={styles.removeFrameBtn} onPress={handleRemoveFrame}>
                            <Ionicons name="close-circle-outline" size={22} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Bloc intro */}
                    <Animated.View entering={ZoomIn.duration(600)} style={styles.introCard}>
                        <Text style={styles.introEmoji}>🏆</Text>
                        <Text style={styles.introTitle}>
                            {cochonsGiven === 0
                                ? 'Donnez votre premier cochon !'
                                : `${cochonsGiven} cochon${cochonsGiven > 1 ? 's' : ''} donnés`}
                        </Text>
                        <Text style={styles.introSubtitle}>
                            {nextThreshold
                                ? `Plus que ${nextThreshold - cochonsGiven} cochon${nextThreshold - cochonsGiven > 1 ? 's' : ''} pour le prochain palier !`
                                : '🔥 Vous avez atteint le grade MAXIMUM !'}
                        </Text>
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressBadgeText}>
                                {nextThreshold
                                    ? `${cochonsGiven} / ${nextThreshold} 🐷 vers le prochain palier`
                                    : `${cochonsGiven} 🐷 • grade maximum`}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Barre de progression */}
                    <ProgressBar
                        current={cochonsGiven}
                        nextThreshold={nextThreshold}
                        prevThreshold={prevThreshold}
                    />

                    {/* Cadre actif */}
                    {activeFrame && (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.activeFrameBlock}>
                            <Text style={styles.activeFrameTitle}>Cadre actif</Text>
                            <View style={styles.activeFramePreview}>
                                <View style={styles.activeFrameAvatarWrapper}>
                                    <View style={styles.fakeAvatarLarge} />
                                    <AvatarFrame frameId={activeFrame} size={80} />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* Séparateur */}
                    <Text style={styles.tiersTitle}>Paliers de progression</Text>

                    {/* Grille des paliers */}
                    <View style={[
                        styles.tiersGrid,
                        { flexDirection: width > 500 ? 'row' : 'column' }
                    ]}>
                        {tiers.map((tier, idx) => (
                            <TierCard
                                key={tier.grade}
                                tier={tier}
                                isActive={activeFrame === tier.frameId}
                                onEquip={handleEquip}
                                index={idx}
                            />
                        ))}
                    </View>

                    {/* Règle du jeu */}
                    <Animated.View entering={FadeInDown.delay(500)} style={styles.rulesCard}>
                        <Text style={styles.rulesTitle}>Comment gagner des cochons ?</Text>
                        <Text style={styles.rulesText}>
                            🐷 Gagnez une manche alors qu'un adversaire a <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>0 victoire</Text> — vous lui infligez un cochon !{'\n\n'}
                            🐷🐷 Si <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>2 adversaires</Text> ont 0 victoire en même temps, vous gagnez un <Text style={{ fontWeight: 'bold', color: '#FF4500' }}>double cochon</Text> !{'\n\n'}
                            Les cochons s'accumulent à vie. Les paliers sont permanents et ne se réinitialisent jamais.
                        </Text>
                    </Animated.View>
                </ScrollView>
            )}
        </LinearGradient>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,215,0,0.15)',
    },
    headerSideSlot: {
        width: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
    },
    removeFrameBtn: {
        padding: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    // ─── Intro ───
    introCard: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    introEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    introTitle: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 6,
    },
    introSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    progressBadge: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.18)',
    },
    progressBadgeText: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    // ─── Barre de progression ───
    progressContainer: {
        gap: 10,
    },
    progressTrack: {
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        overflow: 'visible',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        minWidth: 4,
    },
    milestoneMarker: {
        position: 'absolute',
        top: -20,
        transform: [{ translateX: -10 }],
        alignItems: 'center',
    },
    milestoneText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // ─── Cadre actif ───
    activeFrameBlock: {
        alignItems: 'center',
        gap: 10,
    },
    activeFrameTitle: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    activeFramePreview: {
        alignItems: 'center',
    },
    activeFrameAvatarWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fakeAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    // ─── Paliers ───
    tiersTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 4,
    },
    tiersGrid: {
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    tierCard: {
        flex: 1,
        minWidth: 140,
        maxWidth: 180,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    tierCardUnlocked: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    tierCardLocked: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tierCardActive: {
        borderColor: '#FFD700',
        borderWidth: 2,
        backgroundColor: 'rgba(255,215,0,0.12)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    activeBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    activeBadgeText: {
        color: '#1A0535',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    tierGradeIcon: {
        fontSize: 28,
    },
    tierThreshold: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '900',
    },
    tierLabel: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    framePreviewWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    fakeAvatarSmall: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    lockedAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    rewardBadge: {
        backgroundColor: 'rgba(255,215,0,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    rewardBadgeText: {
        color: '#FFD700',
        fontWeight: '900',
        fontSize: 12,
    },
    equipButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 4,
    },
    equipButtonText: {
        color: '#1A0535',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    // ─── Règles ───
    rulesCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    rulesTitle: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    rulesText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        lineHeight: 20,
    },
});
