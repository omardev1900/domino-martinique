import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
    withSequence,
    Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Props {
    onAnimationFinish: () => void;
}

export const AnimatedSplashScreen = ({ onAnimationFinish }: Props) => {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.8);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }]
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        // 1. Scale Up Effect (Breathing)
        scale.value = withTiming(1, {
            duration: 1500, // 1.5s zoom
            easing: Easing.out(Easing.exp),
        });

        // 2. Fade Out after delay
        opacity.value = withDelay(
            1500, // Wait for zoom to finish
            withTiming(0, {
                duration: 500, // 0.5s fade out
            }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationFinish)();
                }
            })
        );
    }, []);

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Animated.Image
                source={require('../../assets/images/splash-icon.png')}
                style={[styles.image, animatedStyle]}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0d1f0d', // Match native splash background
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999, // Ensure it's on top
    },
    image: {
        width: 250,
        height: 250,
    },
});
