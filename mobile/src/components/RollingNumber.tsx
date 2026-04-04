import React, { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
    runOnJS
} from 'react-native-reanimated';

// Crée un composant Text animé natif
const AnimatedText = Animated.createAnimatedComponent(Text);

interface RollingNumberProps extends TextProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}

/**
 * Composant de compteur animé de 0 à la valeur cible.
 * Effet "machine à sous" / "ticker".
 */
export default function RollingNumber({ value, prefix = '', suffix = '', duration = 1500, style, ...textProps }: RollingNumberProps) {
    const animatedValue = useSharedValue(0);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        // Redémarre l'animation à chaque changement de valeur
        animatedValue.value = 0;
        animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.out(Easing.exp),
        }, (finished) => {
            if (finished) {
                // S'assurer que la valeur finale est exacte à la fin de l'animation
                runOnJS(setDisplayValue)(value);
            }
        });
    }, [value, duration]);

    // Un timer local (requestAnimationFrame) pour mettre à jour l'UI pendant l'animation reanimated
    // sans bloquer le thread UI, car React Native AnimatedText avec children ne supporte pas toujours bien text: useAnimatedProps
    useEffect(() => {
        let animationFrameId: number;
        let isAnimating = true;

        const updateState = () => {
            if (!isAnimating) return;
            const current = Math.round(animatedValue.value);
            setDisplayValue(current);
            animationFrameId = requestAnimationFrame(updateState);
        };

        animationFrameId = requestAnimationFrame(updateState);

        return () => {
            isAnimating = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Formate la valeur avec séparateur de milliers
    const formattedValue = displayValue.toLocaleString();

    return (
        <Text style={style} {...textProps}>
            {prefix}{formattedValue}{suffix}
        </Text>
    );
}
