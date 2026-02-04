import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Player } from '../core/types';

interface PlayerAvatarProps {
    player: Player;
    isActive: boolean;
    showTimer?: boolean;
    timerDuration?: number;
    timerProgress?: number; // 0-1
    size?: number;
    position?: 'top-left' | 'top-right' | 'bottom';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
    player,
    isActive,
    showTimer = false,
    timerDuration = 20,
    timerProgress = 1,
    size = 60,
    position = 'bottom'
}) => {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useSharedValue(1);
    const [secondsLeft, setSecondsLeft] = useState(timerDuration);

    useEffect(() => {
        if (showTimer && isActive) {
            // Reset timer
            setSecondsLeft(timerDuration);
            animatedProgress.value = 1;

            // Start countdown
            const interval = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Animate ring
            animatedProgress.value = withTiming(0, {
                duration: timerDuration * 1000,
                easing: Easing.linear,
            });

            return () => clearInterval(interval);
        } else {
            animatedProgress.value = 1;
            setSecondsLeft(timerDuration);
        }
    }, [showTimer, isActive, timerDuration]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animatedProgress.value),
    }));

    // Determine if name should be above or below
    const nameAbove = position === 'bottom';

    return (
        <View style={styles.container}>
            {/* Player Name Above (for main player) */}
            {nameAbove && (
                <Text style={[styles.playerName, styles.nameAbove]} numberOfLines={1}>
                    {player.name}
                </Text>
            )}

            <View style={{ width: size + 12, height: size + 12, alignItems: 'center', justifyContent: 'center' }}>
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
                        },
                        isActive && styles.activeGlow,
                    ]}
                >
                    {/* Show countdown number when timer is active, otherwise show default avatar */}
                    {showTimer && isActive ? (
                        <Text style={[styles.countdown, { fontSize: size / 2.2 }]}>
                            {secondsLeft}
                        </Text>
                    ) : (
                        <Text style={[styles.defaultAvatar, { fontSize: size / 1.5 }]}>
                            👤
                        </Text>
                    )}
                </View>

                {/* Timer Ring */}
                {showTimer && isActive && (
                    <Svg
                        width={size + 12}
                        height={size + 12}
                        style={styles.timerSvg}
                    >
                        {/* Background circle */}
                        <Circle
                            cx={(size + 12) / 2}
                            cy={(size + 12) / 2}
                            r={radius + 4}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        {/* Animated progress circle */}
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
                            origin={`${(size + 12) / 2}, ${(size + 12) / 2}`}
                        />
                    </Svg>
                )}
            </View>

            {/* Player Name Below (for opponents) */}
            {!nameAbove && (
                <Text style={[styles.playerName, styles.nameBelow]} numberOfLines={1}>
                    {player.name}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
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
    playerName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 100,
        textAlign: 'center',
    },
    nameAbove: {
        marginBottom: 6,
    },
    nameBelow: {
        marginTop: 6,
    },
});
