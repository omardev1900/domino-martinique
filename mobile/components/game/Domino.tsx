import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Domino as DominoType } from '../../src/core/types';
import { DominoDots } from './DominoDots';

interface DominoProps {
    domino: DominoType;
    size?: number; // Width of the domino (height will be 2x)
    orientation?: 'vertical' | 'horizontal';
    isReversed?: boolean; // If true, swap top/bottom or left/right visually
    style?: StyleProp<ViewStyle>;
    animated?: boolean; // Enable animation on mount
}

export const Domino: React.FC<DominoProps> = ({
    domino,
    size = 40,
    orientation = 'vertical',
    isReversed = false,
    style,
    animated = true
}) => {
    const width = orientation === 'vertical' ? size : size * 2;
    const height = orientation === 'vertical' ? size * 2 : size;

    // Calculate values based on reverse flag
    // When isReversed=true, the domino is physically flipped on the table
    const firstValue = isReversed ? domino.right : domino.left;
    const secondValue = isReversed ? domino.left : domino.right;

    // Premium styling constants
    const backgroundColor = '#fDFDFD'; // Off-white bones
    const dotColor = '#1a1a1a'; // Dark, almost black dots
    const borderColor = '#bbb';

    const Container = animated ? Animated.View : View;
    const animationProps = animated ? { entering: ZoomIn.duration(300).springify() } : {};

    return (
        <Container
            {...animationProps}
            style={[
                styles.container,
                {
                    width,
                    height,
                    flexDirection: orientation === 'vertical' ? 'column' : 'row',
                    backgroundColor,
                    borderColor,
                },
                style
            ]}
        >
            {/* First Half */}
            <View style={[styles.half, { width: size, height: size }]}>
                <DominoDots value={firstValue} size={size} color={dotColor} />
            </View>

            {/* Divider */}
            <View style={[
                styles.divider,
                orientation === 'vertical' ? { width: '80%', height: 1 } : { height: '80%', width: 1 }
            ]} />

            {/* Second Half */}
            <View style={[styles.half, { width: size, height: size }]}>
                <DominoDots value={secondValue} size={size} color={dotColor} />
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',

        // Shadow for "Premium 2D" feel
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    half: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        backgroundColor: '#ccc',
    }
});
