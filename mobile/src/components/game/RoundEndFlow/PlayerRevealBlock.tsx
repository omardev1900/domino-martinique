import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { Player, Domino } from '../../../core/types';
import { DominoTile } from '../../DominoTile';
import RollingNumber from '../../RollingNumber';

interface PlayerRevealBlockProps {
    player: Player;
    position: 'top-left' | 'top-right' | 'bottom';
    phase: 'idle' | 'dimming' | 'reveal' | 'counting' | 'result';
    onCountComplete?: () => void;
}

export const PlayerRevealBlock: React.FC<PlayerRevealBlockProps> = ({
    player,
    position,
    phase,
    onCountComplete,
}) => {
    const reducedMotion = useReducedMotion();
    const { width } = useWindowDimensions();
    const isCompact = width < 430;
    
    const [currentScore, setCurrentScore] = useState(0);

    const handScore = player.hand.reduce((s, d) => s + d.left + d.right, 0);

    useEffect(() => {
        if (phase === 'counting') {
            setCurrentScore(handScore);
            // Simulate count duration
            const timer = setTimeout(() => {
                onCountComplete?.();
            }, 3000);
            return () => clearTimeout(timer);
        } else if (phase === 'idle' || phase === 'dimming') {
            setCurrentScore(0);
        }
    }, [phase, handScore, onCountComplete]);

    if (phase === 'idle' || phase === 'dimming') return null;

    const isTopRight = position === 'top-right';
    const isTopLeft = position === 'top-left';
    const isBottom = position === 'bottom';

    const dominoSize = isCompact ? 22 : 30;

    return (
        <View style={[
            styles.container,
            isTopRight && styles.containerTopRight,
            isTopLeft && styles.containerTopLeft,
            isBottom && styles.containerBottomLeft,
        ]} pointerEvents="none">
            
            <View style={[
                styles.handRow,
                isTopRight && styles.handRowRight,
                isTopLeft && styles.handRowLeft,
                isBottom && styles.handRowLeft,
            ]}>
                {player.hand.map((d, i) => (
                    <Animated.View 
                        key={i} 
                        entering={reducedMotion ? undefined : FadeIn.delay(i * 150).duration(400)}
                    >
                        <DominoTile
                            left={d.left as any}
                            right={d.right as any}
                            size={dominoSize}
                            orientation="vertical"
                            disabled
                            noMargin
                        />
                    </Animated.View>
                ))}
            </View>

            {(phase === 'counting' || phase === 'result') && (
                <View style={styles.scoreContainer}>
                    <RollingNumber 
                        value={currentScore} 
                        style={styles.scoreText} 
                        duration={3000} 
                    />
                    <Animated.Text style={styles.ptsText}> pts</Animated.Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1450,
        alignItems: 'center',
    },
    containerTopRight: {
        top: 20, // Relative to the wrapper/anchor
        right: 80, // Next to avatar
        alignItems: 'flex-end',
    },
    containerTopLeft: {
        top: 20,
        left: 80,
        alignItems: 'flex-start',
    },
    containerBottomLeft: {
        bottom: 80, // Above local player avatar area
        left: 20,
        alignItems: 'flex-start',
    },
    handRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 8,
    },
    handRowRight: {
        justifyContent: 'flex-end',
    },
    handRowLeft: {
        justifyContent: 'flex-start',
    },

    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.4)',
    },
    scoreText: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
    },
    ptsText: {
        color: 'rgba(255,215,0,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 2,
    },
});
