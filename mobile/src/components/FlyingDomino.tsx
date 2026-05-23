import React, { useEffect, useRef } from 'react';
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

import { SkinConfig } from '../core/store.types';

interface FlyingDominoProps {
    data: FlyingDominoData & { width?: number; height?: number };
    onFinished: () => void;
    skinConfig?: SkinConfig;
}

// Animation duration in ms — fast and snappy
const ANIMATION_DURATION = 400;

export const FlyingDomino: React.FC<FlyingDominoProps> = ({ data, onFinished, skinConfig }) => {
    const progress = useSharedValue(0);
    const finishedRef = useRef(false);
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    useEffect(() => {
        const finishOnce = () => {
            if (finishedRef.current) return;
            finishedRef.current = true;
            onFinishedRef.current();
        };

        const watchdog = setTimeout(finishOnce, ANIMATION_DURATION + 450);

        // If endPoint is not available (layout measurement failed, common on Web),
        // run a quick scale-in "pop" at the origin and finish immediately.
        if (!data.endPoint) {
            progress.value = withTiming(1, {
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.back(1.5)),
            }, (finished) => {
                if (finished) runOnJS(finishOnce)();
            });
            return () => clearTimeout(watchdog);
        }

        progress.value = withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
            if (finished) runOnJS(finishOnce)();
        });

        return () => clearTimeout(watchdog);
    }, [data, progress]);

    const animatedStyle = useAnimatedStyle(() => {
        if (!data.endPoint || !data.width || !data.height) {
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

        const startCenterX = data.startPoint.x + 17;
        const startCenterY = data.startPoint.y + 34;
        
        const endCenterX = data.endPoint.x + data.width / 2;
        const endCenterY = data.endPoint.y + data.height / 2;

        const currentCenterX = interpolate(progress.value, [0, 1], [startCenterX, endCenterX]);
        const currentCenterY = interpolate(progress.value, [0, 1], [startCenterY, endCenterY]);

        const isTargetHorizontal = data.orientation === 'horizontal';
        
        const naturalW = isTargetHorizontal ? 68 : 34;
        const naturalH = isTargetHorizontal ? 34 : 68;

        const endScaleX = data.width / naturalW;
        const endScaleY = data.height / naturalH;

        const rotate = interpolate(progress.value, [0, 1], [isTargetHorizontal ? -90 : 0, 0]);
        const scaleX = interpolate(progress.value, [0, 1], [1, endScaleX]);
        const scaleY = interpolate(progress.value, [0, 1], [1, endScaleY]);

        return {
            position: 'absolute',
            left: -naturalW / 2,
            top: -naturalH / 2,
            transform: [
                { translateX: currentCenterX },
                { translateY: currentCenterY },
                { rotate: `${rotate}deg` },
                { scaleX },
                { scaleY }
            ],
            zIndex: 1000,
        };
    });

    return (
        <Animated.View style={animatedStyle} pointerEvents="none">
            <DominoTile
                left={data.domino.left}
                right={data.domino.right}
                orientation={data.orientation}
                size={34}
                noMargin
                skinConfig={skinConfig}
            />
        </Animated.View>
    );
};
