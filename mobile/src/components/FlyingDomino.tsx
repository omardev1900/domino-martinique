import React, { useEffect } from 'react';
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

// Animation duration in ms — fast and snappy
const ANIMATION_DURATION = 400;

export const FlyingDomino: React.FC<FlyingDominoProps> = ({ data, onFinished }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        // If endPoint is not available (layout measurement failed, common on Web),
        // run a quick scale-in "pop" at the origin and finish immediately.
        if (!data.endPoint) {
            progress.value = withTiming(1, {
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.back(1.5)),
            }, (finished) => {
                if (finished) runOnJS(onFinished)();
            });
            return;
        }

        progress.value = withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
            if (finished) runOnJS(onFinished)();
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        // Fallback: no endPoint — show a scale-in pop at the startPoint position
        if (!data.endPoint) {
            const scale = interpolate(progress.value, [0, 0.6, 1], [0, 1.2, 1]);
            const opacity = interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
            return {
                position: 'absolute',
                left: 0,
                top: 0,
                transform: [
                    { translateX: data.startPoint.x },
                    { translateY: data.startPoint.y },
                    { scale },
                ],
                opacity,
                zIndex: 1000,
            };
        }

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

        // Slam effect: starts big (1.4), lands at normal size (1)
        const scale = interpolate(
            progress.value,
            [0, 0.5, 1],
            [1.4, 1.15, 1]
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
                left={data.domino.left}
                right={data.domino.right}
                size={34}
                noMargin
            />
        </Animated.View>
    );
};
