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

// ─── Animation Pluie de Richesse (Wealth Rain) ─────────────────────────────
const Particle = ({ delay, x, icon, duration }: { delay: number, x: number, icon: string, duration: number }) => {
    const { height } = useWindowDimensions();
    const translateY = useSharedValue(-100);
    const rotate = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(withTiming(height + 100, { duration, easing: Easing.linear }), -1, false)
        );
        rotate.value = withDelay(
            delay,
            withRepeat(withTiming(360, { duration: duration * 0.5, easing: Easing.linear }), -1, false)
        );
    }, [height]);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` }
        ],
        position: 'absolute',
        left: x,
        top: -100,
        zIndex: 0,
    }));

    return <Animated.Text style={[style, { fontSize: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }]}>{icon}</Animated.Text>;
};

const WealthRain = () => {
    const { width } = useWindowDimensions();
    const particles = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * width,
            delay: Math.random() * 3000,
            duration: 2500 + Math.random() * 2000,
            icon: Math.random() > 0.3 ? '🪙' : '💎'
        }));
    }, [width]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <Particle key={p.id} {...p} />
            ))}
        </View>
    );
};

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

// ─── Progression XP Bar ────────────────────────────────────────────────────────
const XPProgressBar: React.FC<{ previousXP: number; newXP: number; previousLevel: number; newLevel: number }> = ({ previousXP, newXP, previousLevel, newLevel }) => {
    const width = useSharedValue(0); // 0 to 100%
    const [displayLevel, setDisplayLevel] = useState(previousLevel);
    const [isMaxLevel, setIsMaxLevel] = useState(previousLevel >= MAX_LEVEL);

    useEffect(() => {
        let baseXP = xpRequiredForLevel(previousLevel);
        let nextLevelXP = xpRequiredForLevel(previousLevel + 1);
        let levelRange = nextLevelXP - baseXP;

        // Start percentage
        let startPct = ((previousXP - baseXP) / levelRange) * 100;
        width.value = startPct;

        if (newLevel > previousLevel) {
            // Fill to 100%, then reset and fill to newXP
            const nextLevelXP = xpRequiredForLevel(newLevel + 1);
            const currentLevelXP = xpRequiredForLevel(newLevel);
            const levelRange = nextLevelXP - currentLevelXP;
            const newPct = levelRange > 0 ? ((newXP - currentLevelXP) / levelRange) * 100 : 100;

            width.value = withSequence(
                withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 0 }),
                withTiming(newPct, { duration: 1000, easing: Easing.out(Easing.ease) })
            );

            // Change display level text at the exact moment of level up
            setTimeout(() => {
                setDisplayLevel(newLevel);
                setIsMaxLevel(newLevel >= MAX_LEVEL);
            }, 1500);

        } else if (newXP > previousXP) {
            // Just fill to new percent
            const nextLevelXP = xpRequiredForLevel(previousLevel + 1);
            const currentLevelXP = xpRequiredForLevel(previousLevel);
            const levelRange = nextLevelXP - currentLevelXP;
            const endPct = levelRange > 0 ? ((newXP - currentLevelXP) / levelRange) * 100 : 100;

            width.value = withTiming(endPct, { duration: 2000, easing: Easing.out(Easing.ease) });
        }
    }, [previousXP, newXP, previousLevel, newLevel]);

    const barStyle = useAnimatedStyle(() => {
        return {
            width: `${width.value}%`,
        };
    });

    return (
        <Animated.View entering={FadeInDown.delay(1600)} style={styles.xpContainer}>
            <View style={styles.xpHeader}>
                <Text style={styles.xpLevelText}>Niveau {displayLevel}</Text>
                <Text style={styles.xpLevelText}>{isMaxLevel ? 'MAX' : `Niveau ${displayLevel + 1}`}</Text>
            </View>
            <View style={styles.xpBarBackground}>
                <Animated.View style={[styles.xpBarFill, barStyle]} />
            </View>
        </Animated.View>
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

            {/* Pluie de Richesse si Victoire */}
            {isWinner && <WealthRain />}

            {/* Bouton Info (Coin Supérieur Droit) */}
            <TouchableOpacity
                style={[styles.infoButton, { top: isLandscape ? 15 : 40, right: isLandscape ? 15 : 20 }]}
                onPress={() => setInfoModalVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="information-circle-outline" size={32} color="#rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <Animated.View
                entering={ZoomIn.duration(600).springify()}
                exiting={ZoomOut}
                style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLandscape && styles.scrollContentLandscape
                    ]}
                    style={{ width: '100%' }}
                >
                    {/* Header = Winner Only */}
                    {isWinner && (
                        <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: '#FFD700' }]}>
                            🏆 VICTOIRE 🏆
                        </Text>
                    )}

                    {/* Level Up & Grade Up Banners */}
                    <View style={[styles.bannersContainer, isLandscape && styles.bannersContainerLandscape]}>
                        {isLevelUp && (
                            <Animated.View entering={FadeInDown.delay(600)} style={styles.levelUpBanner}>
                                <Text style={styles.levelUpText}>⭐ NIVEAU SUPÉRIEUR : {reward.newLevel} ! ⭐</Text>
                            </Animated.View>
                        )}

                        {isGradeUp && (
                            <Animated.View entering={FadeInDown.delay(800)} style={styles.gradeUpBanner}>
                                <Text style={styles.gradeUpText}>
                                    🐷 PROMOTION : {LEAGUE_LABELS[reward.newGrade]} ! 🐷
                                </Text>
                            </Animated.View>
                        )}
                    </View>

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

                    {/* XP Progression Bar */}
                    {reward.xpEarned > 0 && (
                        <XPProgressBar
                            previousXP={reward.previousXP}
                            newXP={reward.newXP}
                            previousLevel={reward.previousLevel}
                            newLevel={reward.newLevel}
                        />
                    )}

                    {/* Continue Button */}
                    <Animated.View entering={FadeIn.delay(1800)} style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.continueGradient}
                            >
                                <Text style={styles.continueText}>CONTINUER</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        zIndex: 10000,
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' }
        })
    },
    infoButton: {
        position: 'absolute',
        zIndex: 10001,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        width: '95%',
        maxWidth: 600,
        alignItems: 'center',
        zIndex: 10,
        maxHeight: '95%',
    },
    mainContentLandscape: {
        width: '100%',
        maxWidth: 800,
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    scrollContentLandscape: {
        paddingVertical: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    titleLandscape: {
        fontSize: 24,
        marginBottom: 5,
    },
    bannersContainer: {
        alignItems: 'center',
        marginBottom: 15,
        minHeight: 30,
        width: '100%',
    },
    bannersContainerLandscape: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 10,
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
        gap: 10,
        marginBottom: 20,
    },
    totalsContainerLandscape: {
        marginBottom: 15,
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
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    totalIcon: {
        fontSize: 28,
        marginBottom: 4,
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
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
        marginTop: 10,
    },
    continueButton: {
        width: '100%',
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
    continueGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    continueText: {
        color: '#1A0E2E',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2,
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
    // --- XP Bar ---
    xpContainer: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    xpLevelText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    xpBarBackground: {
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
});
