import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolateColor } from 'react-native-reanimated';
import Svg, { Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { DominoSide } from '../core/types';
import HapticManager from '../core/audio/HapticManager';

interface DominoTileProps {
    left: DominoSide;
    right: DominoSide;
    size?: number; // Width of the tile (height will be 2x)
    orientation?: 'vertical' | 'horizontal';
    onPress?: () => void;
    disabled?: boolean;
    entering?: any; // Reanimated entering prop
    noMargin?: boolean; // Remove margin for board tiles
    isPlayable?: boolean; // Should the tile glow?
}

// Logic for pip positions
const DOT_POSITIONS: Record<number, number[][]> = {
    0: [],
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]],
};

export const DominoTile: React.FC<DominoTileProps> = ({
    left,
    right,
    size = 40,
    orientation = 'vertical',
    onPress,
    disabled = false,
    entering,
    noMargin = false,
    isPlayable = false
}) => {
    const isVertical = orientation === 'vertical';
    const width = isVertical ? size : size * 2;
    const height = isVertical ? size * 2 : size;

    const glowValue = useSharedValue(0);
    const pressScale = useSharedValue(1);

    React.useEffect(() => {
        if (isPlayable) {
            glowValue.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 }),
                    withTiming(0.4, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            glowValue.value = 0;
        }
    }, [isPlayable]);

    const animatedGlowStyle = useAnimatedStyle(() => {
        return {
            shadowColor: '#4CAF50',
            shadowOpacity: withTiming(isPlayable ? 0.7 * glowValue.value : 0),
            shadowRadius: 8 + glowValue.value * 12,
            borderColor: interpolateColor(
                glowValue.value,
                [0, 1],
                ['rgba(255,255,255,0.2)', '#4CAF50']
            ),
            borderWidth: isPlayable ? 3 : 1,
            transform: [
                { scale: withTiming(isPlayable ? 1.05 + glowValue.value * 0.02 : 1) },
                { scale: pressScale.value }
            ]
        };
    });

    const handlePressIn = () => {
        if (!disabled && onPress) {
            pressScale.value = withTiming(0.92, { duration: 100 });
            HapticManager.triggerLightSelection();
        }
    };

    const handlePressOut = () => {
        pressScale.value = withTiming(1, { duration: 100 });
    };

    const renderHalfSVG = (value: DominoSide, isSideHorizontal: boolean) => {
        let pips = [...DOT_POSITIONS[value]];

        // Special logic for 6: Rotate dots if horizontal
        if (value === 6 && isSideHorizontal) {
            pips = [
                [0.25, 0.25], [0.5, 0.25], [0.75, 0.25],
                [0.25, 0.75], [0.5, 0.75], [0.75, 0.75]
            ];
        }

        const dotRadius = size * 0.09;
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100">
                {pips.map(([x, y], idx) => (
                    <Circle
                        key={idx}
                        cx={x * 100}
                        cy={y * 100}
                        r={dotRadius * 2.5}
                        fill="#1a1a1a"
                    />
                ))}
            </Svg>
        );
    };

    return (
        <Animated.View entering={entering || ZoomIn.duration(400)} style={{ opacity: disabled ? 0.9 : 1 }}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || !onPress}
                style={[
                    styles.baseContainer,
                    noMargin ? { margin: 0 } : { margin: 4 },
                    { width, height, flexDirection: isVertical ? 'column' : 'row' },
                    animatedGlowStyle,
                ]}
            >
                {/* Visual Background with SVG Gradients */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg width="100%" height="100%">
                        <Defs>
                            <LinearGradient id="ivoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#FFFFFF" />
                                <Stop offset="50%" stopColor="#FFFFF0" />
                                <Stop offset="100%" stopColor="#F5F5DC" />
                            </LinearGradient>
                        </Defs>
                        <Rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            rx={8}
                            fill="url(#ivoryGradient)"
                        />
                    </Svg>
                </View>

                {/* Left/Top Half */}
                <View style={styles.half}>
                    {renderHalfSVG(left, !isVertical)}
                </View>

                {/* Center Divider */}
                <View style={[
                    styles.divider,
                    isVertical
                        ? { width: size * 0.8, height: size * 0.05 }
                        : { width: size * 0.05, height: size * 0.8 }
                ]}>
                    <View style={styles.dividerLine} />
                </View>

                {/* Right/Bottom Half */}
                <View style={styles.half}>
                    {renderHalfSVG(right, !isVertical)}
                </View>

                {/* Bevel Overlay for 3D look */}
                <View style={styles.bevelOverlay} pointerEvents="none" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    baseContainer: {
        backgroundColor: '#FFFFF0',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    half: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    divider: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerLine: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 1,
    },
    bevelOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1.5,
        borderRadius: 8,
        borderColor: 'rgba(255,255,255,0.5)',
        borderBottomColor: 'rgba(0,0,0,0.15)',
        borderRightColor: 'rgba(0,0,0,0.15)',
    },
});
