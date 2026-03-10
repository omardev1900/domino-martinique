import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    withSequence,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface DailyRewardModalProps {
    visible: boolean;
    amount: number;
    onClaim: () => void;
}

const CoinParticle = ({ delay, index }: { delay: number; index: number }) => {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        const xOffset = (Math.random() - 0.5) * width * 0.8;

        translateY.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-height * 0.5 - Math.random() * 100, { duration: 600 + delay }),
            withTiming(height * 0.3, { duration: 1800 })
        );

        translateX.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(xOffset, { duration: 2400 + delay })
        );

        opacity.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: 150 + delay }),
            withTiming(0, { duration: 1600 })
        );

        scale.value = withSequence(
            withTiming(0.5, { duration: 0 }),
            withSpring(1.2, { damping: 8, stiffness: 200 }),
            withTiming(0.6, { duration: 1800 })
        );

        rotate.value = withRepeat(
            withTiming(360 * (index % 2 === 0 ? 1 : -1), { duration: 1200 }),
            -1,
            false
        );
    }, []);

    const COIN_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#FFEC44', '#FFC107'];
    const coinColor = COIN_COLORS[index % COIN_COLORS.length];

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
        opacity: opacity.value,
        backgroundColor: coinColor,
        shadowColor: coinColor,
        shadowOpacity: 0.8,
        shadowRadius: 4,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                style,
                { left: (width / 25) * (index % 25) }
            ]}
        />
    );
};

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
    visible,
    amount,
    onClaim,
}) => {
    const scale = useSharedValue(0);
    const glowOpacity = useSharedValue(0.5);
    const titleScale = useSharedValue(0.8);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 12, stiffness: 100 });
            titleScale.value = withSequence(
                withTiming(0.8, { duration: 0 }),
                withSpring(1.05, { damping: 8, stiffness: 150 }),
                withTiming(1, { duration: 200 })
            );
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
            titleScale.value = 0.8;
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [
            { scale: interpolate(glowOpacity.value, [0.4, 1], [1, 1.25], Extrapolate.CLAMP) }
        ],
    }));

    const titleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
    }));

    if (!visible) return null;

    const particles = Array.from({ length: 25 }).map((_, i) => (
        <CoinParticle key={i} index={i} delay={Math.random() * 400} />
    ));

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClaim}>
            <View style={styles.overlay}>
                {/* Particles layer */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {particles}
                </View>

                {/* Glow behind card */}
                <Animated.View style={[styles.glowContainer, glowStyle]} pointerEvents="none">
                    <View style={styles.glow} />
                </Animated.View>

                {/* Card */}
                <Animated.View style={[styles.contentContainer, containerStyle]}>
                    <LinearGradient
                        colors={['#2A1B3D', '#1A0B2E']}
                        style={styles.card}
                    >
                        {/* Star burst decoration */}
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconEmoji}>🎁</Text>
                        </View>

                        <Animated.Text style={[styles.title, titleStyle]}>
                            CADEAU DU JOUR !
                        </Animated.Text>

                        <Text style={styles.amountText}>+{amount} 🪙</Text>

                        <Text style={styles.subtitle}>
                            Revenez demain pour un nouveau cadeau
                        </Text>

                        <TouchableOpacity
                            style={styles.claimButton}
                            onPress={onClaim}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.claimGradient}
                            >
                                <Text style={styles.claimButtonText}>RÉCLAMER !</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
        bottom: '45%',
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 5,
        elevation: 5,
    },
    glowContainer: {
        position: 'absolute',
        width: 320,
        height: 320,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    glow: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(255, 215, 0, 0.18)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 60,
        elevation: 10,
    },
    contentContainer: {
        width: '85%',
        maxWidth: 380,
        zIndex: 10,
    },
    card: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconEmoji: {
        fontSize: 52,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(255, 215, 0, 0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        letterSpacing: 1,
    },
    amountText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(255, 215, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.55)',
        textAlign: 'center',
        marginBottom: 26,
        lineHeight: 18,
    },
    claimButton: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    claimGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    claimButtonText: {
        color: '#1A0B2E',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
});
