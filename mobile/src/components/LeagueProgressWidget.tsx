import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LEAGUE_FRAME_THRESHOLDS, LEAGUE_LABELS, LEAGUE_ICONS } from '../core/economy.constants';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

interface LeagueProgressWidgetProps {
    points: number;
    onInfoPress?: () => void;
}

export const LeagueProgressWidget: React.FC<LeagueProgressWidgetProps> = ({ points, onInfoPress }) => {
    // Current grade computation
    const currentGrade = useMemo(() => {
        if (points >= LEAGUE_FRAME_THRESHOLDS.LEGENDE) return 'LEGENDE';
        if (points >= LEAGUE_FRAME_THRESHOLDS.ROI) return 'ROI';
        if (points >= LEAGUE_FRAME_THRESHOLDS.MAITRE) return 'MAITRE';
        return 'APPRENTI';
    }, [points]);

    const title = `NIVEAU ${LEAGUE_LABELS[currentGrade].toUpperCase()}`;

    // Progress computation
    const maxThreshold = LEAGUE_FRAME_THRESHOLDS.LEGENDE;
    // Cap progress at maxThreshold
    const currentProgress = Math.min(points, maxThreshold);
    const progressPercentage = (currentProgress / maxThreshold) * 100;

    const milestones = [
        { value: LEAGUE_FRAME_THRESHOLDS.APPRENTI, icon: LEAGUE_ICONS.APPRENTI, label: '30' },
        { value: LEAGUE_FRAME_THRESHOLDS.MAITRE, icon: LEAGUE_ICONS.MAITRE, label: '150' },
        { value: LEAGUE_FRAME_THRESHOLDS.ROI, icon: LEAGUE_ICONS.ROI, label: '250' },
        { value: LEAGUE_FRAME_THRESHOLDS.LEGENDE, icon: LEAGUE_ICONS.LEGENDE, label: '500' },
    ];

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.container}>
            <LinearGradient
                colors={['#0A1938', '#010619']}
                style={styles.gradientCard}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity 
                        style={styles.infoButton} 
                        onPress={onInfoPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                <View style={styles.milestonesContainer}>
                    {milestones.map((m, index) => {
                        const isReached = points >= m.value;
                        const leftPercent = (m.value / maxThreshold) * 100;
                        return (
                            <View 
                                key={index} 
                                style={[styles.milestoneItem, { left: `${leftPercent}%` }]}
                            >
                                <View style={[styles.iconWrapper, isReached && styles.iconReached]}>
                                    <Text style={[styles.iconText, !isReached && styles.iconLocked]}>{m.icon}</Text>
                                    {isReached && <View style={styles.glow} />}
                                </View>
                                <Text style={[styles.milestoneText, isReached && styles.milestoneReached]}>
                                    {m.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Progress Bar Track */}
                <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarTrack}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                        >
                            <View style={styles.progressBarGlare} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.progressText}>
                        {currentProgress} / {maxThreshold}
                    </Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 340,
        marginBottom: 10,
        alignSelf: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    gradientCard: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
        color: '#FFD700',
        fontWeight: '900',
        fontSize: 12,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 8,
        textShadowColor: 'rgba(255,215,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    milestonesContainer: {
        height: 44,
        width: '100%',
        position: 'relative',
        marginBottom: 6,
    },
    milestoneItem: {
        position: 'absolute',
        transform: [{ translateX: -15 }], 
        alignItems: 'center',
        width: 30, 
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    iconReached: {
        transform: [{ scale: 1.1 }],
    },
    glow: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,215,0,0.2)',
        zIndex: -1,
    },
    iconText: {
        fontSize: 22, // Bigger size relative to original icons
    },
    iconLocked: {
        opacity: 0.4,
        // if supported, we can add grayscale, but opacity works well as a fallback
    },
    milestoneText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
    },
    milestoneReached: {
        color: '#FFD700',
        textShadowColor: 'rgba(255,215,0,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    progressBarWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    progressBarTrack: {
        height: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 8,
        position: 'relative',
    },
    progressBarGlare: {
        position: 'absolute',
        top: 2,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.4)', // Simulate reflection on top half
    },
    progressText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    }
});
