import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolateColor } from 'react-native-reanimated';
import { DominoSide } from '../core/types';

interface DominoTileProps {
    left: DominoSide;
    right: DominoSide;
    size?: number; // Width of the tile (height will be 2x)
    orientation?: 'vertical' | 'horizontal';
    onPress?: () => void;
    disabled?: boolean;
    entering?: any; // Reanimated entering prop
    noMargin?: boolean; // Remove margin for board tiles
    isPlayable?: boolean; // NEW: Should the tile glow?
}

const DOT_POSITIONS: Record<number, number[]> = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
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

    // Internal padding for pips (percentage of size)
    const padding = size * 0.15;
    const innerSize = size - padding * 2;

    // Dot size relative to inner area
    const dotSize = innerSize / 5;

    const renderHalf = (value: DominoSide) => {
        return (
            <View style={[styles.half, { width: size, height: size, padding: padding }]}>
                <View style={[styles.innerHalf, { width: innerSize, height: innerSize }]}>
                    {DOT_POSITIONS[value].map((pos) => {
                        const row = Math.floor(pos / 3);
                        const col = pos % 3;
                        return (
                            <View
                                key={pos}
                                style={[
                                    styles.dot,
                                    {
                                        width: dotSize,
                                        height: dotSize,
                                        top: row * (innerSize / 3) + (innerSize / 3 - dotSize) / 2,
                                        left: col * (innerSize / 3) + (innerSize / 3 - dotSize) / 2,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
            </View>
        );
    };

    const glowValue = useSharedValue(0);

    React.useEffect(() => {
        if (isPlayable) {
            glowValue.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0, { duration: 800 })
                ),
                -1,
                true
            );
        } else {
            glowValue.value = 0;
        }
    }, [isPlayable]);

    const animatedGlowStyle = useAnimatedStyle(() => {
        if (!isPlayable) return {};
        return {
            shadowColor: '#4CAF50',
            shadowOpacity: withTiming(isPlayable ? 0.8 : 0),
            shadowRadius: 10 + glowValue.value * 5,
            borderColor: interpolateColor(
                glowValue.value,
                [0, 1],
                ['#D4D4D4', '#4CAF50']
            ),
            borderWidth: 3,
            transform: [{ scale: 1 + glowValue.value * 0.03 }]
        };
    });

    return (
        <Animated.View entering={entering || ZoomIn.duration(400)} style={{ opacity: disabled ? 0.8 : 1 }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                disabled={disabled || !onPress}
                style={[
                    noMargin ? styles.containerNoMargin : styles.container,
                    styles.container,
                    { width, height, flexDirection: isVertical ? 'column' : 'row' },
                    isPlayable && animatedGlowStyle,
                ]}
            >
                {renderHalf(left)}
                <View style={[styles.separator, isVertical ? { width: size - 12, height: 2 } : { width: 2, height: size - 12 }]} />
                {renderHalf(right)}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFF0', // Warmer Ivory
        borderRadius: 10,
        borderWidth: 3,
        // 3D Bevel Effect - Light on top/left, dark on bottom/right
        borderTopColor: '#FFFFFF',
        borderLeftColor: '#FFFFFF',
        borderBottomColor: '#D4D4D4',
        borderRightColor: '#D4D4D4',
        alignItems: 'center',
        justifyContent: 'center',
        // Enhanced Shadows for depth
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
        margin: 4, // Margin for player hand tiles
    },
    containerNoMargin: {
        backgroundColor: '#FFFFF0',
        borderRadius: 10,
        borderWidth: 3,
        borderTopColor: '#FFFFFF',
        borderLeftColor: '#FFFFFF',
        borderBottomColor: '#D4D4D4',
        borderRightColor: '#D4D4D4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
        margin: 0, // NO margin for board tiles - should touch
    },
    half: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerHalf: {
        position: 'relative',
    },
    dot: {
        position: 'absolute',
        backgroundColor: '#0a0a0a', // Deeper black for contrast
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.3,
        shadowRadius: 1.5,
        elevation: 2,
    },
    separator: {
        backgroundColor: '#B8B8B8',
        opacity: 0.9,
    },
});
