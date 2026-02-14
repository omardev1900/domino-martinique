import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    interpolate,
    Easing
} from 'react-native-reanimated';
import { DominoTile } from './DominoTile';
import { FlyingDominoData } from '../core/animations/AnimationTypes';

interface FlyingDominoProps {
    data: FlyingDominoData;
    onFinished: () => void;
}

export const FlyingDomino: React.FC<FlyingDominoProps> = ({ data, onFinished }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, {
            duration: 2500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) // Smooth & majestic
        }, (finished) => {
            if (finished) {
                runOnJS(onFinished)();
            }
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        if (!data.endPoint) return { opacity: 0 };

        const translateX = interpolate(
            progress.value,
            [0, 1],
            [data.startPoint.x, data.endPoint.x]
        );
        const translateY = interpolate(
            progress.value,
            [0, 1],
            [data.startPoint.y, data.endPoint.y]
        );

        // Effet "Slam" : On part gros (1.5) et on atterrit taille normale (1)
        // On garde un léger pic à 0.6 pour l'effet de "levée"
        const scale = interpolate(
            progress.value,
            [0, 0.6, 1],
            [1.5, 1.1, 1]
        );

        const rotate = interpolate(
            progress.value,
            [0, 1],
            [0, data.orientation === 'horizontal' ? 90 : 0]
        );

        return {
            position: 'absolute',
            left: 0,
            top: 0,
            transform: [
                { translateX },
                { translateY },
                { scale },
                { rotate: `${rotate}deg` }
            ],
            zIndex: 1000,
        };
    });

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <DominoTile
                id={data.domino.id}
                left={data.domino.left}
                right={data.domino.right}
                size={34} // Target size on board
                noMargin
            />
        </Animated.View>
    );
};
