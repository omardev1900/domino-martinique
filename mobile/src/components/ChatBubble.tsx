import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    FadeIn,
    ZoomIn
} from 'react-native-reanimated';

interface ChatBubbleProps {
    content: string;
    position?: 'top' | 'bottom'; // NEW: Direction relative to avatar
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ content, position = 'top' }) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);

    const isBottom = position === 'bottom';

    useEffect(() => {
        // Entry animation: -40 for top (up), +40 for bottom (down)
        translateY.value = withSpring(isBottom ? 40 : -40);
        opacity.value = withTiming(1, { duration: 300 });

        return () => {
            // No-op cleanup
        };
    }, [content, isBottom]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.container,
                isBottom ? styles.containerBottom : styles.containerTop,
                animatedStyle
            ]}
            pointerEvents="none"
        >
            <Text style={styles.text}>{content}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    containerTop: {
        top: -20, // Initial position, animated to -40
    },
    containerBottom: {
        bottom: -20, // Initial position, animated to +40
    },
    text: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
});
