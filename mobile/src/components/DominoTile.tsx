import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { DominoSide } from '../core/types';

interface DominoTileProps {
    left: DominoSide;
    right: DominoSide;
    size?: number; // Width of the tile (height will be 2x)
    orientation?: 'vertical' | 'horizontal';
    onPress?: () => void;
    disabled?: boolean;
    entering?: any; // Reanimated entering prop
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
    entering
}) => {
    const isVertical = orientation === 'vertical';
    const width = isVertical ? size : size * 2;
    const height = isVertical ? size * 2 : size;

    // Dot size relative to tile width
    const dotSize = size / 5;

    const renderHalf = (value: DominoSide) => {
        return (
            <View style={[styles.half, { width: size, height: size }]}>
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
                                    top: row * (size / 3) + (size / 3 - dotSize) / 2,
                                    left: col * (size / 3) + (size / 3 - dotSize) / 2,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <Animated.View entering={entering || ZoomIn.duration(400)} style={{ opacity: disabled ? 0.8 : 1 }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                disabled={disabled || !onPress}
                style={[
                    styles.container,
                    { width, height, flexDirection: isVertical ? 'column' : 'row' },
                ]}
            >
                {renderHalf(left)}
                <View style={[styles.separator, isVertical ? { width: size - 8, height: 2 } : { width: 2, height: size - 8 }]} />
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
        margin: 4,
    },
    half: {
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
