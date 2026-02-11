import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, Easing, withRepeat, withSequence } from 'react-native-reanimated';
import { Player } from '../core/types';
import { getAvatarImage, AvatarId } from '../core/avatars';
import { Ionicons } from '@expo/vector-icons';

interface PlayerAvatarProps {
    player: Player;
    isActive: boolean;
    showTimer?: boolean;
    timerDuration?: number;
    timerProgress?: number; // 0-1
    size?: number;
    position?: 'top-left' | 'top-right' | 'bottom' | 'top-center';
    layout?: 'vertical' | 'horizontal';
    namePlacement?: 'above' | 'below'; // Where to place the name in vertical layout
    score?: string; // NEW: Current score to display (e.g. "2 wins" or "45 pts")
    showHandSize?: boolean; // NEW: Show remaining tiles count
    isPaused?: boolean; // NEW: Pause the timer
    onTimeout?: () => void; // Callback when timer expires
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
    player,
    isActive,
    showTimer = false,
    timerDuration = 20,
    timerProgress = 1,
    size = 60,
    position = 'bottom',
    layout = 'vertical',
    namePlacement = 'below',
    score,
    showHandSize = true,
    isPaused = false,
    onTimeout
}) => {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useSharedValue(1);
    const breatheValue = useSharedValue(1);
    const [secondsLeft, setSecondsLeft] = useState(timerDuration);

    // Timer Countdown Effect
    useEffect(() => {
        if (showTimer && isActive && !isPaused) {
            // Start countdown
            const interval = setInterval(() => {
                setSecondsLeft(prev => {
                    const newValue = prev - 1;
                    if (newValue < 0) return 0;
                    return newValue;
                });
            }, 1000);

            // Animate ring (approximate remaining time)
            const remainingDuration = secondsLeft * 1000;
            animatedProgress.value = withTiming(0, {
                duration: remainingDuration,
                easing: Easing.linear,
            });

            // Breathing effect for active player
            breatheValue.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );

            return () => {
                clearInterval(interval);
                // We don't reset breatheValue here to allow it to stay at 1 when paused
            };
        } else {
            // Paused or not active
            if (isPaused) {
                // Keep current progress
                animatedProgress.value = animatedProgress.value;
                breatheValue.value = withTiming(1);
            } else {
                animatedProgress.value = 1;
                setSecondsLeft(timerDuration);
                breatheValue.value = 1;
            }
        }
    }, [showTimer, isActive, isPaused, timerDuration]);

    const animatedAvatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breatheValue.value }],
    }));

    // Timeout Trigger Effect
    useEffect(() => {
        if (showTimer && isActive && secondsLeft === 0) {
            if (onTimeout) {
                onTimeout();
            }
        }
    }, [secondsLeft, showTimer, isActive, onTimeout]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animatedProgress.value),
    }));

    const isHorizontal = layout === 'horizontal';

    // Use player's avatarId or fallback to default 'avatar_01'
    const finalAvatarId = (player.avatarId && player.avatarId.startsWith('avatar_'))
        ? (player.avatarId as AvatarId)
        : 'avatar_01';

    const avatarImage = getAvatarImage(finalAvatarId);

    // Image scaling factor to zoom into the face (top portion)
    const imageScale = 1.8;
    const imageSize = size * imageScale;
    const imageOffset = -(imageSize - size) * 0.25;

    return (
        <View style={[styles.container, isHorizontal && styles.containerHorizontal]}>
            {/* Name above avatar in vertical layout */}
            {!isHorizontal && namePlacement === 'above' && (
                <View style={styles.nameContainerVertical}>
                    <Text
                        style={[styles.playerName, styles.nameVertical]}
                        numberOfLines={1}
                    >
                        {player.name}
                    </Text>
                    {score && <Text style={styles.playerScore}>{score}</Text>}
                    {showHandSize && (
                        <View style={styles.handSizeBadge}>
                            <Ionicons name="documents-outline" size={10} color="#FFF" style={{ opacity: 0.6 }} />
                            <Text style={styles.handSizeText}>{player.handSize}/7</Text>
                        </View>
                    )}
                </View>
            )}

            <Animated.View style={[{ width: size + 12, height: size + 12, alignItems: 'center', justifyContent: 'center' }, animatedAvatarStyle]}>
                {/* Avatar Circle */}
                <View
                    style={[
                        styles.avatar,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: isActive ? 3 : 2,
                            borderColor: isActive ? '#FFD700' : 'rgba(255,255,255,0.3)',
                            overflow: 'hidden',
                        },
                        isActive && styles.activeGlow,
                    ]}
                >
                    {showTimer && isActive ? (
                        <Text style={[styles.countdown, { fontSize: size / 2.2 }]}>
                            {secondsLeft}
                        </Text>
                    ) : (
                        <Image
                            source={avatarImage}
                            style={{
                                width: imageSize,
                                height: imageSize,
                                position: 'absolute',
                                top: imageOffset,
                                left: (size - imageSize) / 2,
                            }}
                            resizeMode="cover"
                        />
                    )}
                </View>

                {/* Timer Ring */}
                {showTimer && isActive && (
                    <Svg
                        width={size + 12}
                        height={size + 12}
                        style={styles.timerSvg}
                    >
                        <Circle
                            cx={(size + 12) / 2}
                            cy={(size + 12) / 2}
                            r={radius + 4}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <AnimatedCircle
                            cx={(size + 12) / 2}
                            cy={(size + 12) / 2}
                            r={radius + 4}
                            stroke="#4CAF50"
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference}
                            strokeLinecap="round"
                            animatedProps={animatedProps}
                            rotation="-90"
                            originX={(size + 12) / 2}
                            originY={(size + 12) / 2}
                        />
                    </Svg>
                )}
            </Animated.View>

            {/* Name below avatar in vertical layout */}
            {!isHorizontal && namePlacement === 'below' && (
                <View style={styles.nameContainerVerticalBelow}>
                    <Text
                        style={[styles.playerName, styles.nameVertical]}
                        numberOfLines={1}
                    >
                        {player.name}
                    </Text>
                    {score && <Text style={styles.playerScore}>{score}</Text>}
                    {showHandSize && (
                        <View style={styles.handSizeBadge}>
                            <Ionicons name="documents-outline" size={10} color="#FFF" style={{ opacity: 0.6 }} />
                            <Text style={styles.handSizeText}>{player.handSize}/7</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Name beside avatar in horizontal layout */}
            {isHorizontal && (
                <View style={styles.nameContainerHorizontal}>
                    <Text
                        style={[styles.playerName, styles.nameHorizontal]}
                        numberOfLines={1}
                    >
                        {player.name}
                    </Text>
                    {score && <Text style={[styles.playerScore, styles.scoreHorizontal]}>{score}</Text>}
                    {showHandSize && (
                        <View style={[styles.handSizeBadge, { justifyContent: 'flex-start', marginTop: 2 }]}>
                            <Ionicons name="documents-outline" size={10} color="#FFF" style={{ opacity: 0.6 }} />
                            <Text style={styles.handSizeText}>{player.handSize}/7</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerHorizontal: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        paddingRight: 0,
        borderRadius: 40,
        height: 70,
    },
    avatar: {
        backgroundColor: 'rgba(50,50,50,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeGlow: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 15,
    },
    defaultAvatar: {
        opacity: 0.9,
    },
    countdown: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    timerSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    nameContainerVertical: {
        marginBottom: 6,
    },
    nameContainerVerticalBelow: {
        marginTop: 6,
    },
    nameContainerHorizontal: {
        marginLeft: 4,
    },
    playerName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nameHorizontal: {
        fontSize: 14,
        textAlign: 'left',
        minWidth: 80,
    },
    nameVertical: {
        maxWidth: 80,
    },
    playerScore: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 1,
    },
    handSizeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        marginTop: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    handSizeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.8,
    },
    scoreHorizontal: {
        textAlign: 'left',
    }
});
