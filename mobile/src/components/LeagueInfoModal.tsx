import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LEAGUE_FRAME_THRESHOLDS, LEAGUE_ICONS } from '../core/economy.constants';

interface LeagueInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const RANKS = [
    {
        score: '30',
        name: 'APPRENTI',
        coins: 500,
        frameBorderColor: '#C0C0C0', // Silver
        frameGlowColor: 'rgba(192,192,192,0.3)',
        gradient: ['#1A1A24', '#2D2D3F'],
    },
    {
        score: '150',
        name: 'MAÎTRE',
        coins: 2000,
        frameBorderColor: '#FFD700', // Gold
        frameGlowColor: 'rgba(255,215,0,0.5)',
        gradient: ['#2A2410', '#3A3215'],
    },
    {
        score: '250',
        name: 'ROI',
        coins: 5000,
        frameBorderColor: '#00EAFF', // Blue Neon
        frameGlowColor: 'rgba(0,234,255,0.7)',
        gradient: ['#0A1D36', '#0E2A4F'],
    },
    {
        score: '500',
        name: 'LÉGENDE',
        coins: 10000,
        frameBorderColor: '#FF3300', // Red/Flames
        frameGlowColor: 'rgba(255,51,0,0.8)',
        gradient: ['#3A0D0D', '#541515'],
    }
];

export const LeagueInfoModal: React.FC<LeagueInfoModalProps> = ({ visible, onClose }) => {
    
    // The simplified static gauge for the top
    const renderGauge = () => {
        const milestones = [
            { value: LEAGUE_FRAME_THRESHOLDS.APPRENTI, icon: LEAGUE_ICONS.APPRENTI, label: '30' },
            { value: LEAGUE_FRAME_THRESHOLDS.MAITRE, icon: LEAGUE_ICONS.MAITRE, label: '150' },
            { value: LEAGUE_FRAME_THRESHOLDS.ROI, icon: LEAGUE_ICONS.ROI, label: '250' },
            { value: LEAGUE_FRAME_THRESHOLDS.LEGENDE, icon: LEAGUE_ICONS.LEGENDE, label: '500' },
        ];
        
        return (
            <View style={styles.gaugeContainer}>
                <View style={styles.milestonesContainer}>
                    {milestones.map((m, index) => {
                        const leftPercent = (m.value / 500) * 100;
                        return (
                            <View key={index} style={[styles.milestoneItem, { left: `${leftPercent}%` }]}>
                                <Text style={styles.gaugeIcon}>{m.icon}</Text>
                                <Text style={styles.gaugeLabel}>{m.label}</Text>
                            </View>
                        );
                    })}
                </View>
                <View style={styles.progressBarTrack}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: '100%' }]}
                    />
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View entering={FadeInUp.duration(400)} style={styles.modalContent}>
                    
                    <LinearGradient colors={['#07132B', '#020614']} style={styles.modalGradient}>
                        
                        {/* Header */}
                        <View style={styles.header}>
                            <Ionicons name="trophy" size={28} color="#FFD700" style={styles.headerIcon} />
                            <Text style={styles.title}>LIGUE DES COCHONS</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={28} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Top Gauge Demo */}
                        {renderGauge()}

                        {/* Ranks Row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.gridContainer}>
                                {RANKS.map((rank, idx) => (
                                    <Animated.View 
                                        key={idx} 
                                        entering={FadeIn.delay(300 + (idx * 150))}
                                        style={styles.cardWrapper}
                                    >
                                        <LinearGradient
                                            colors={rank.gradient as [string, string]}
                                            style={[styles.card, { borderColor: rank.frameBorderColor }]}
                                        >
                                            <View style={styles.rankHeader}>
                                                <Text style={[styles.rankScore, { color: rank.frameBorderColor }]}>{rank.score}</Text>
                                                <Text style={styles.rankName} numberOfLines={1}>{rank.name}</Text>
                                            </View>
                                            
                                            {/* The Simulated "Frame" (Cadre Profil) */}
                                            <View style={[styles.avatarFrame, {
                                                borderColor: rank.frameBorderColor,
                                                shadowColor: rank.frameBorderColor,
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 1,
                                                shadowRadius: 10,
                                                elevation: 8,
                                            }]}>
                                                <View style={[styles.innerFrame, { borderColor: rank.frameBorderColor }]} />
                                            </View>

                                            <View style={styles.rewardBox}>
                                                <Ionicons name="logo-bitcoin" size={12} color="#FFD700" style={{marginRight: 2}}/>
                                                <Text style={styles.rewardText} numberOfLines={1}>{rank.coins} COINS</Text>
                                            </View>
                                        </LinearGradient>
                                    </Animated.View>
                                ))}
                            </View>
                        </ScrollView>

                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#07132B',
    },
    modalContent: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    modalGradient: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 10,
        paddingTop: 50, // Laisse de l'espace pour le notch
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30, // Un peu plus espacé du titre
        position: 'relative',
        width: '100%',
        paddingHorizontal: 15,
    },
    headerIcon: {
        marginRight: 8,
    },
    title: {
        color: '#FFD700',
        fontSize: 20, // Légèrement réduit
        fontWeight: '900',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    
    // Static Gauge
    gaugeContainer: {
        marginBottom: 25, // Réduit (était 40)
        paddingHorizontal: 10,
    },
    milestonesContainer: {
        height: 40,
        flexDirection: 'row',
        position: 'relative',
        marginBottom: 10,
    },
    milestoneItem: {
        position: 'absolute',
        alignItems: 'center',
        transform: [{ translateX: -15 }],
        width: 30,
    },
    gaugeIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    gaugeLabel: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBarTrack: {
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },

    // Cards Horizontal Row
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center', // Centrer verticalement
        justifyContent: 'center', // Centrer horizontalement
        marginTop: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 8, // Espace entre les cartes
    },
    cardWrapper: {
        width: 90, // Réduit de moitié visuellement par rapport à une grille
        height: 140, // Hauteur très compacte
    },
    card: {
        flex: 1,
        borderRadius: 8,
        borderWidth: 1,
        padding: 5, // Très peu de padding intérieur
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rankHeader: {
        alignItems: 'center',
        paddingVertical: 2,
    },
    rankScore: {
        fontSize: 18,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: -2, // Rapproche du texte en dessous
    },
    rankName: {
        color: '#FFF',
        fontSize: 9, // Plus petit
        fontWeight: '700',
        letterSpacing: 0.5,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    avatarFrame: {
        width: 45, // Petit cadre
        height: 55,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        marginVertical: 4,
    },
    innerFrame: {
        width: '80%',
        height: '80%',
        borderWidth: 1,
        opacity: 0.7,
    },
    rewardBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    rewardText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 10,
    }
});
