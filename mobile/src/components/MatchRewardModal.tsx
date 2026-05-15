import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withRepeat } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AdRewardButton } from './AdRewardButton';

interface MatchRewardModalProps {
    visible: boolean;
    onClose: () => void;
    onClaim: () => void;
}

export const MatchRewardModal: React.FC<MatchRewardModalProps> = ({ visible, onClose, onClaim }) => {
    const { width, height } = useWindowDimensions();

    const scale = useSharedValue(0);
    const glowOpacity = useSharedValue(0.5);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 12, stiffness: 100 });
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 900 }),
                    withTiming(0.4, { duration: 900 })
                ),
                -1,
                true
            );
        } else {
            scale.value = withTiming(0, { duration: 200 });
            glowOpacity.value = 0;
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: withTiming(visible ? 1 : 0, { duration: 300 }),
    }));

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[styles.overlay, overlayStyle]}>
                <Animated.View style={[styles.cardContainer, cardStyle, { width: Math.min(width * 0.85, 400) }]}>
                    <LinearGradient
                        colors={['rgba(255, 215, 0, 0.15)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                    
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>📺</Text>
                    </View>
                    
                    <Text style={styles.title}>Bonus Fin de Partie</Text>
                    <Text style={styles.subtitle}>Regarde une courte publicité pour gagner 100 pièces supplémentaires !</Text>
                    
                    <View style={styles.btnWrap}>
                        <AdRewardButton
                            coinsAmount={100}
                            onClaim={async () => {
                                await onClaim();
                                setTimeout(onClose, 2000); // Ferme automatiquement après l'animation de succès
                            }}
                            placement="END_OF_MATCH"
                            enterDelay={0}
                            variant="prominent"
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    cardContainer: {
        backgroundColor: '#1E1B2A',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
        zIndex: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    icon: {
        fontSize: 40,
    },
    title: {
        color: '#FFD700',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    btnWrap: {
        width: '100%',
    }
});
