import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { LEAGUE_FRAME_THRESHOLDS, LEAGUE_ICONS, LEAGUE_LABELS } from '../core/economy.constants';

interface LeagueInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const RANKS = [
    {
        score: '30',
        name: LEAGUE_LABELS.APPRENTI,
        coins: 500,
        frameBorderColor: '#C0C0C0', // Silver
        frameGlowColor: 'rgba(192,192,192,0.3)',
        gradient: ['#1A1A24', '#2D2D3F'],
    },
    {
        score: '150',
        name: LEAGUE_LABELS.MAITRE,
        coins: 2000,
        frameBorderColor: '#FFD700', // Gold
        frameGlowColor: 'rgba(255,215,0,0.5)',
        gradient: ['#2A2410', '#3A3215'],
    },
    {
        score: '250',
        name: LEAGUE_LABELS.ROI,
        coins: 5000,
        frameBorderColor: '#00EAFF', // Blue Neon
        frameGlowColor: 'rgba(0,234,255,0.7)',
        gradient: ['#0A1D36', '#0E2A4F'],
    },
    {
        score: '500',
        name: LEAGUE_LABELS.LEGENDE,
        coins: 10000,
        frameBorderColor: '#FF3300', // Red/Flames
        frameGlowColor: 'rgba(255,51,0,0.8)',
        gradient: ['#3A0D0D', '#541515'],
    }
];

export const LeagueInfoModal: React.FC<LeagueInfoModalProps> = ({ visible, onClose }) => {
    
    const renderLeftPanel = () => {
        const milestones = [
            { value: LEAGUE_FRAME_THRESHOLDS.APPRENTI, icon: LEAGUE_ICONS.APPRENTI, label: '30' },
            { value: LEAGUE_FRAME_THRESHOLDS.MAITRE, icon: LEAGUE_ICONS.MAITRE, label: '150' },
            { value: LEAGUE_FRAME_THRESHOLDS.ROI, icon: LEAGUE_ICONS.ROI, label: '250' },
            { value: LEAGUE_FRAME_THRESHOLDS.LEGENDE, icon: LEAGUE_ICONS.LEGENDE, label: '500' },
        ];
        
        return (
            <Animated.View entering={FadeInLeft.duration(600)} style={styles.leftPanel}>
                <View style={styles.header}>
                    <Ionicons name="trophy" size={32} color="#FFD700" />
                    <Text style={styles.title}>LIGUE DES COCHONS</Text>
                </View>

                <View style={styles.horizontalGaugeContainer}>
                    <View style={styles.milestonesHorizontal}>
                        {milestones.map((m, index) => (
                            <View key={index} style={styles.milestoneHorizontalItem}>
                                <Text style={styles.gaugeIconSmall}>{m.icon}</Text>
                                <Text style={styles.gaugeScoreSmall}>{m.value}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.horizontalBarTrack}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.horizontalBarFill}
                        />
                    </View>
                </View>

                <Text style={styles.infoText}>
                    Donnez des cochons pour grimper dans les rangs et débloquer des cadres exclusifs et des récompenses !
                </Text>
            </Animated.View>
        );
    };

    const renderRightPanel = () => {
        return (
            <Animated.View entering={FadeInRight.duration(600).delay(200)} style={styles.rightPanel}>
                <View style={styles.grid}>
                    {RANKS.map((rank, idx) => (
                        <Animated.View 
                            key={idx} 
                            entering={ZoomIn.delay(400 + (idx * 100))}
                            style={styles.cardContainer}
                        >
                            <LinearGradient
                                colors={rank.gradient as [string, string]}
                                style={[styles.card, { borderColor: rank.frameBorderColor }]}
                            >
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.rankScore, { color: rank.frameBorderColor }]}>{rank.score}</Text>
                                    <Text style={styles.rankName}>{rank.name}</Text>
                                </View>
                                
                                <View style={[styles.avatarFrame, {
                                    borderColor: rank.frameBorderColor,
                                    shadowColor: rank.frameBorderColor,
                                    shadowRadius: 5,
                                    elevation: 5,
                                }]}>
                                    <View style={[styles.innerFrame, { borderColor: rank.frameBorderColor }]} />
                                </View>

                                <View style={styles.rewardBadge}>
                                    <Ionicons name="cash-outline" size={10} color="#FFD700" />
                                    <Text style={styles.rewardText}>{rank.coins}</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    ))}
                </View>
            </Animated.View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.overlay}>
                <LinearGradient colors={['#0A1938', '#010619']} style={styles.background}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        {renderLeftPanel()}
                        {renderRightPanel()}
                    </View>
                </LinearGradient>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#010619',
    },
    background: {
        flex: 1,
        padding: 15,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    // Left Panel
    leftPanel: {
        flex: 0.45,
        justifyContent: 'center',
        paddingRight: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 1,
    },
    horizontalGaugeContainer: {
        width: '100%',
        marginVertical: 15,
    },
    horizontalBarTrack: {
        width: '100%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.1)',
        overflow: 'hidden',
    },
    horizontalBarFill: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    milestonesHorizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    milestoneHorizontalItem: {
        alignItems: 'center',
    },
    gaugeIconSmall: {
        fontSize: 18,
    },
    gaugeScoreSmall: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '900',
    },
    infoText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 10,
    },
    // Right Panel
    rightPanel: {
        flex: 0.55,
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        maxWidth: 240, // Force 2x2 by limiting total width
        alignSelf: 'center',
    },
    cardContainer: {
        width: '48%',
        aspectRatio: 0.9, 
        maxWidth: 110, // Keep them small as requested
    },
    card: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: {
        alignItems: 'center',
    },
    rankScore: {
        fontSize: 18,
        fontWeight: '900',
    },
    rankName: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 1,
    },
    avatarFrame: {
        width: 40,
        height: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginVertical: 2,
    },
    innerFrame: {
        width: '80%',
        height: '80%',
        borderWidth: 1,
        opacity: 0.5,
    },
    rewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 3,
    },
    rewardText: {
        color: '#FFD700',
        fontWeight: '900',
        fontSize: 10,
    }
});
