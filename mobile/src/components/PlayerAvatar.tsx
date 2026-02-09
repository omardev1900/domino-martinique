import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { Player } from '../core/types';
import { getAvatarImage, AvatarId } from '../core/avatars';

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
    onTimeout
}) => {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useSharedValue(1);
    const [secondsLeft, setSecondsLeft] = useState(timerDuration);

    // Timer Countdown Effect
    useEffect(() => {
        if (showTimer && isActive) {
            // Reset timer
            setSecondsLeft(timerDuration);
            animatedProgress.value = 1;

            // Start countdown
            const interval = setInterval(() => {
                setSecondsLeft(prev => {
                    const newValue = prev - 1;
                    if (newValue < 0) return 0;
                    return newValue;
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

    // Check if avatarId is a valid image avatar (starts with 'avatar_')
    const isImageAvatar = player.avatarId && player.avatarId.startsWith('avatar_');
    const avatarImage = isImageAvatar ? getAvatarImage(player.avatarId) : null;

    // Image scaling factor to zoom into the face (top portion)
    // 1.8 means the image will be 80% larger, showing only the top ~55%
    const imageScale = 1.8;
    const imageSize = size * imageScale;
    // Offset to move image up, showing just the face
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
                </View>
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
                            overflow: 'hidden', // Important for image cropping
                        },
                        isActive && styles.activeGlow,
                    ]}
                >
                    {showTimer && isActive ? (
                        <Text style={[styles.countdown, { fontSize: size / 2.2 }]}>
                            {secondsLeft}
                        </Text>
                    ) : isImageAvatar && avatarImage ? (
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
                    ) : (
                        <Text style={[styles.defaultAvatar, { fontSize: size / 1.5 }]}>
                            {player.avatarId || '👤'}
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
                            origin={`${(size + 12) / 2}, ${(size + 12) / 2}`}
                        />
                    </Svg>
                )}
            </View>

            {/* Name below avatar in vertical layout */}
            {!isHorizontal && namePlacement === 'below' && (
                <View style={styles.nameContainerVerticalBelow}>
                    <Text
                        style={[styles.playerName, styles.nameVertical]}
                        numberOfLines={1}
                    >
                        {player.name}
                    </Text>
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
});
