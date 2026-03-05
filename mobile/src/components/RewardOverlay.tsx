import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MatchReward, RewardBreakdown } from '../core/economy.types';
import { LEAGUE_LABELS, LEAGUE_ICONS } from '../core/economy.constants';

interface RewardOverlayProps {
    visible: boolean;
    reward: MatchReward | null;
    isWinner: boolean;
    onContinue: () => void;
}

// ─── Composant Rolling Number ────────────────────────────────────────────────
const RollingNumber: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string; style?: any }> = ({ value, duration = 2000, prefix = '', suffix = '', style }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease out quad
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
                colors={['rgba(45, 27, 78, 0.95)', 'rgba(26, 14, 46, 0.98)']}
                style={StyleSheet.absoluteFillObject}
            />

            <Animated.View entering={ZoomIn.duration(600).springify()} exiting={ZoomOut} style={styles.modalContent}>

                {/* Header = Winner/Loser */}
                <Text style={[styles.title, { color: isWinner ? '#FFD700' : '#FFF' }]}>
                    {isWinner ? '🏆 VICTOIRE 🏆' : 'FIN DE LA PARTIE'}
                </Text>

                {/* Level Up Banner */}
                {isLevelUp && (
                    <Animated.View entering={FadeInDown.delay(1000)} style={styles.levelUpBanner}>
                        <Text style={styles.levelUpText}>⭐ NIVEAU SUPÉRIEUR : {reward.newLevel} !</Text>
                    </Animated.View>
                )}

                {/* Grade Up Banner */}
                {isGradeUp && (
                    <Animated.View entering={FadeInDown.delay(1200)} style={styles.gradeUpBanner}>
                        <Text style={styles.gradeUpText}>
                            🐷 PROMOTION : {LEAGUE_LABELS[reward.newGrade]} !
                        </Text>
                    </Animated.View>
                )}

                {/* Totals Section */}
                <View style={styles.totalsContainer}>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalIcon}>🪙</Text>
                        <RollingNumber value={reward.coinsEarned} prefix="+" style={styles.totalValue} />
                        <Text style={styles.totalLabel}>Coins</Text>
                    </View>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalIcon}>⭐</Text>
                        <RollingNumber value={reward.xpEarned} prefix="+" style={styles.totalValue} />
                        <Text style={styles.totalLabel}>XP</Text>
                    </View>
                    {(reward.diamondsEarned > 0 || reward.leaguePointsEarned > 0) && (
                        <View style={styles.totalBox}>
                            <Text style={styles.totalIcon}>{reward.diamondsEarned > 0 ? '💎' : '🐷'}</Text>
                            <RollingNumber
                                value={reward.diamondsEarned > 0 ? reward.diamondsEarned : reward.leaguePointsEarned}
                                prefix="+"
                                style={[styles.totalValue, { color: reward.diamondsEarned > 0 ? '#60DCFF' : '#FF9800' }]}
                            />
                            <Text style={styles.totalLabel}>{reward.diamondsEarned > 0 ? 'Diamants' : 'Ligue'}</Text>
                        </View>
                    )}
                </View>

                {/* Breakdown Details */}
                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>Détails des gains</Text>
                    {reward.breakdown.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInDown.delay(1500 + (index * 200))}
                            style={styles.breakdownRow}
                        >
                            <Text style={styles.breakdownLabel}>{item.label}</Text>
                            <View style={styles.breakdownValues}>
                                {item.coins > 0 && <Text style={styles.breakdownValText}>+{item.coins}🪙</Text>}
                                {item.xp > 0 && <Text style={styles.breakdownValText}>+{item.xp}⭐</Text>}
                                {item.leaguePoints > 0 && <Text style={styles.breakdownValText}>+{item.leaguePoints}🐷</Text>}
                                {item.diamonds > 0 && <Text style={[styles.breakdownValText, { color: '#60DCFF' }]}>+{item.diamonds}💎</Text>}
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* Continue/Close Button */}
                <Animated.View entering={FadeIn.delay(2500)} style={{ width: '100%', alignItems: 'center', marginTop: 30 }}>
                    <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={styles.continueGradient}
                        >
                            <Text style={styles.continueText}>CONTINUER</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 10000,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' }
        })
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 24,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 30,
    },
    totalBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 16,
        minWidth: 90,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    totalIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    breakdownContainer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 16,
    },
    breakdownTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    breakdownLabel: {
        color: '#FFF',
        fontSize: 14,
        flex: 1,
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
    levelUpBanner: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderWidth: 1,
        borderColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 20,
    },
    levelUpText: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    gradeUpBanner: {
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        borderWidth: 1,
        borderColor: '#FF9800',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 20,
    },
    gradeUpText: {
        color: '#FF9800',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    continueButton: {
        width: '100%',
        borderRadius: 30,
        overflow: 'hidden',
    },
    continueGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueText: {
        color: '#1A0E2E',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 2,
    },
});
