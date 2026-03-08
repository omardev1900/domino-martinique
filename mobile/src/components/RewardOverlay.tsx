import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn, ZoomOut, useSharedValue, useAnimatedStyle, withDelay, withRepeat, withTiming, withSequence, withSpring, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { MatchReward, RewardBreakdown } from '../core/economy.types';
import { LEAGUE_LABELS, LEAGUE_ICONS, MAX_LEVEL } from '../core/economy.constants';
import { xpRequiredForLevel } from '../core/RewardEngine';

interface RewardOverlayProps {
    visible: boolean;
    reward: MatchReward | null;
    isWinner: boolean;
    onContinue: () => void;
}

const XPIcon = ({ size = 18 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="11" fill="#A5D6A7" />
        <SvgText
            x="12"
            y="16"
            fill="#1A0E2E"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
        >
            XP
        </SvgText>
    </Svg>
);


// ─── Composant Rolling Number ────────────────────────────────────────────────
const RollingNumber: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string; style?: any }> = ({ value, duration = 2000, prefix = '', suffix = '', style }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = progress * (2 - progress);
            setDisplayValue(Math.floor(easeOut * value));

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value, duration]);

    return (
        <Text style={style}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </Text>
    );
};


// ─── Main Overlay ───────────────────────────────────────────────────────────
export function RewardOverlay({ visible, reward, isWinner, onContinue }: RewardOverlayProps) {
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    if (!visible || !reward) return null;

    const isLevelUp = reward.leveledUp;
    const isGradeUp = reward.gradeUp;

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
            style={[styles.container, { width, height }]}
        >
            <LinearGradient
                colors={['rgba(26, 14, 46, 0.95)', 'rgba(10, 5, 20, 0.98)']}
                style={StyleSheet.absoluteFillObject}
            />


            {/* Boutique Bouton CONTINUER (Centre Haut) */}
            <TouchableOpacity
                style={[styles.continuePill, { top: isLandscape ? 15 : 40 }]}
                onPress={onContinue}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.continueGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.continueText}>CONTINUER</Text>
                    <Ionicons name="arrow-forward" size={20} color="#1A0E2E" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Commandes du haut (Coin Supérieur Droit) - Uniquement Info maintenant */}
            <View style={[styles.headerControls, { top: isLandscape ? 15 : 40, left: (isLandscape ? 15 : 20) + width * 0.2 }]}>
                {/* Bouton Détails */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setInfoModalVisible(true)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="information-circle-outline" size={32} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
            </View>

            <Animated.View
                entering={ZoomIn.duration(600).springify()}
                exiting={ZoomOut}
                style={[
                    styles.mainContent,
                    isLandscape && styles.mainContentLandscape
                ]}
            >
                {/* ZONE 1: HEADER (Title & Icons) */}
                <View style={[styles.flexHeaderZone, isLandscape && { paddingBottom: 5 }]}>
                    {isWinner && (
                        <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: '#FFD700' }]}>
                            🏆 VICTOIRE 🏆
                        </Text>
                    )}

                    {/* Level Up & Grade Up Banners */}
                    <View style={[styles.bannersContainer, isLandscape && styles.bannersContainerLandscape]}>
                        {isLevelUp && (
                            <Animated.View entering={FadeInDown.delay(600)} style={styles.levelUpBanner}>
                                <Text style={styles.levelUpText}>⭐ NIV. {reward.newLevel} ! ⭐</Text>
                            </Animated.View>
                        )}

                        {isGradeUp && (
                            <Animated.View entering={FadeInDown.delay(800)} style={styles.gradeUpBanner}>
                                <Text style={styles.gradeUpText}>
                                    🐷 {LEAGUE_LABELS[reward.newGrade]} ! 🐷
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* ZONE 2: BODY (Totals & XP Bar) */}
                <View style={[styles.flexBodyZone, isLandscape && styles.flexBodyZoneLandscape]}>
                    {/* Totals Section */}
                    <View style={[styles.totalsContainer, isLandscape && styles.totalsContainerLandscape]}>
                        <Animated.View entering={FadeInDown.delay(1000)} style={styles.totalBox}>
                            <LinearGradient colors={['rgba(255,215,0,0.1)', 'rgba(0,0,0,0.5)']} style={styles.totalBoxGradient}>
                                <Text style={styles.totalIcon}>🪙</Text>
                                <RollingNumber value={reward.coinsEarned} prefix="+" style={styles.totalValue} />
                                <Text style={styles.totalLabel}>Coins</Text>
                            </LinearGradient>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(1200)} style={styles.totalBox}>
                            <LinearGradient colors={['rgba(255,215,0,0.1)', 'rgba(0,0,0,0.5)']} style={styles.totalBoxGradient}>
                                <View style={{ marginBottom: 4, height: 32, justifyContent: 'center' }}>
                                    <XPIcon size={30} />
                                </View>
                                <RollingNumber value={reward.xpEarned} prefix="+" style={styles.totalValue} />
                                <Text style={styles.totalLabel}>XP</Text>
                            </LinearGradient>
                        </Animated.View>

                        {(reward.diamondsEarned > 0 || reward.leaguePointsEarned > 0) && (
                            <Animated.View entering={FadeInDown.delay(1400)} style={styles.totalBox}>
                                <LinearGradient colors={['rgba(96,220,255,0.1)', 'rgba(0,0,0,0.5)']} style={styles.totalBoxGradient}>
                                    <Text style={styles.totalIcon}>{reward.diamondsEarned > 0 ? '💎' : '🐷'}</Text>
                                    <RollingNumber
                                        value={reward.diamondsEarned > 0 ? reward.diamondsEarned : reward.leaguePointsEarned}
                                        prefix="+"
                                        style={[styles.totalValue, { color: reward.diamondsEarned > 0 ? '#60DCFF' : '#FF9800' }]}
                                    />
                                    <Text style={styles.totalLabel}>{reward.diamondsEarned > 0 ? 'Diamants' : 'Ligue'}</Text>
                                </LinearGradient>
                            </Animated.View>
                        )}
                    </View>

                </View>

                {/* ZONE 3: FOOTER (Continue) */}
                <View style={styles.flexFooterZone}>
                    {/* The next button is already in headerControls, but we can move it here or keep it as is.
                        The user asked for consistency, let's keep it in the flow if possible.
                    */}
                </View>
            </Animated.View>

            {/* Modal Détails des Gains */}
            <Modal
                visible={infoModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setInfoModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setInfoModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.breakdownModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.breakdownTitle}>Détails des gains</Text>
                            <TouchableOpacity onPress={() => setInfoModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={28} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flexGrow: 0, maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                            {reward.breakdown.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(100 + (index * 100))}
                                    style={styles.breakdownRow}
                                >
                                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                                    <View style={styles.breakdownValues}>
                                        {item.coins > 0 && <Text style={styles.breakdownValText}>+{item.coins}🪙</Text>}
                                        {item.xp > 0 && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Text style={styles.breakdownValText}>+{item.xp}</Text>
                                                <XPIcon size={16} />
                                            </View>
                                        )}
                                        {item.leaguePoints > 0 && <Text style={styles.breakdownValText}>+{item.leaguePoints}🐷</Text>}
                                        {item.diamonds > 0 && <Text style={[styles.breakdownValText, { color: '#60DCFF' }]}>+{item.diamonds}💎</Text>}
                                    </View>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 5, 20, 0.95)',
        justifyContent: 'center', // Center in the screen
        alignItems: 'center',
        zIndex: 10000,
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' }
        })
    },
    headerControls: {
        position: 'absolute',
        zIndex: 10001,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continuePill: {
        position: 'absolute',
        zIndex: 10002,
        alignSelf: 'center',
    },
    continueGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        gap: 8,
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
    continueText: {
        color: '#1A0E2E',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    mainContent: {
        width: '95%',
        maxWidth: 600,
        alignItems: 'center',
        zIndex: 10,
    },
    mainContentLandscape: {
        width: '100%',
        maxWidth: 800,
        flexDirection: 'column',
    },
    flexHeaderZone: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    flexBodyZone: {
        alignItems: 'center',
        width: '100%',
    },
    flexBodyZoneLandscape: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 20,
    },
    flexFooterZone: {
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    titleLandscape: {
        fontSize: 22,
        marginBottom: 4,
    },
    bannersContainer: {
        alignItems: 'center',
        marginBottom: 10,
        minHeight: 30,
        width: '100%',
    },
    bannersContainerLandscape: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 5,
    },
    levelUpBanner: {
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        borderWidth: 1.5,
        borderColor: '#81C784',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 5,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
    },
    levelUpText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    gradeUpBanner: {
        backgroundColor: 'rgba(255, 152, 0, 0.9)',
        borderWidth: 1.5,
        borderColor: '#FFB74D',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 5,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
    },
    gradeUpText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 450,
        gap: 10,
        marginBottom: 15,
    },
    totalsContainerLandscape: {
        marginBottom: 0,
        flex: 1,
    },
    totalBox: {
        flex: 1,
        maxWidth: 140,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        shadowColor: 'rgba(255,215,0,0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 3,
    },
    totalBoxGradient: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    totalIcon: {
        fontSize: 24,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 2,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    totalLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // --- Modale Détails ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    breakdownModalContent: {
        width: '90%',
        maxWidth: 450,
        backgroundColor: 'rgba(30, 15, 50, 0.98)',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 8,
    },
    breakdownTitle: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 8,
        borderRadius: 6,
    },
    breakdownLabel: {
        color: '#FFF',
        fontSize: 13,
    },
    breakdownValues: {
        flexDirection: 'row',
        gap: 8,
    },
    breakdownValText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
