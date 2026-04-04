import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

export type LeagueFrameId = 'frame_argent' | 'frame_or' | 'frame_diamant' | 'frame_feu';

interface AvatarFrameProps {
    frameId?: LeagueFrameId | string | null;
    size: number;
}

export const AvatarFrame: React.FC<AvatarFrameProps> = ({ frameId, size }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (frameId === 'frame_diamant' || frameId === 'frame_feu') {
            // Pulsing effect for high-tier frames
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ).start();

            // Rotation effect for fire
            if (frameId === 'frame_feu') {
                Animated.loop(
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 3000,
                        useNativeDriver: true,
                    })
                ).start();
            }
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [frameId, pulseAnim, rotateAnim]);

    if (!frameId) return null;

    const strokeWidth = size * 0.08;
    const padding = strokeWidth / 2; // Expand container to prevent clipping
    const containerSize = size + padding * 2;
    const center = containerSize / 2;
    const radius = size / 2;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const getColors = () => {
        switch (frameId) {
            case 'frame_argent': return ['#C0C0C0', '#FFFFFF', '#A9A9A9'];
            case 'frame_or': return ['#FFD700', '#FFF8DC', '#FFA500'];
            case 'frame_diamant': return ['#00FFFF', '#FF00FF', '#00FFFF'];
            case 'frame_feu': return ['#FF0000', '#FF8C00', '#FFFF00', '#FF0000'];
            default: return null;
        }
    };

    const colors = getColors();
    if (!colors) return null;

    return (
        <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }]}>
            <Animated.View style={{
                width: containerSize,
                height: containerSize,
                transform: [
                    { scale: pulseAnim },
                    { rotate: frameId === 'frame_feu' ? spin : '0deg' }
                ]
            }}>
                <Svg width={containerSize} height={containerSize}>
                    <Defs>
                        <LinearGradient id={`grad-${frameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            {colors.map((color, index) => (
                                <Stop key={index} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
                            ))}
                        </LinearGradient>
                    </Defs>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={`url(#grad-${frameId})`}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};
