import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn, LinearTransition } from 'react-native-reanimated';
import { Domino as DominoType } from '../../src/core/types';
import { Domino } from './Domino';

interface PlayerHandProps {
    dominoes: DominoType[];
    layout?: 'straight' | 'curved';
    playerId: string;
    isCurrentPlayer: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PlayerHand: React.FC<PlayerHandProps> = ({
    dominoes,
    layout = 'straight',
    isCurrentPlayer
}) => {
    if (layout === 'straight') {
        return (
            <View style={styles.straightContainer}>
                {dominoes.map((domino, index) => (
                    <Animated.View
                        key={domino.id}
                        entering={FadeInDown.delay(index * 100).springify()}
                        layout={LinearTransition}
                        style={{ marginHorizontal: 4 }}
                    >
                        <Domino
                            domino={domino}
                            size={40}
                            orientation="vertical"
                        />
                    </Animated.View>
                ))}
            </View>
        );
    }

    // Curved layout logic
    const totalCount = dominoes.length;
    // Arc parameters
    const arcRadius = 250;
    const maxAngle = 60; // Total spread angle in degrees

    return (
        <View style={styles.curvedContainer}>
            {dominoes.map((domino, index) => {
                // Calculate angle for this item
                // Center index is exactly in the middle
                const centerIndex = (totalCount - 1) / 2;
                const anglePerItem = totalCount > 1 ? maxAngle / (totalCount - 1) : 0;
                const angleDeg = (index - centerIndex) * anglePerItem;
                const angleRad = (angleDeg * Math.PI) / 180;

                // Calculate position offset
                // x represents horizontal displacement from center
                // y represents vertical displacement (following the arc)
                const translateX = arcRadius * Math.sin(angleRad);
                const translateY = arcRadius * (1 - Math.cos(angleRad));

                return (
                    <Animated.View
                        key={domino.id}
                        entering={FadeIn.delay(index * 100)}
                        style={{
                            position: 'absolute',
                            bottom: 20, // Base bottom position
                            transform: [
                                { translateX: translateX },
                                { translateY: translateY },
                                { rotate: `${angleDeg}deg` }
                            ],
                            zIndex: index // Ensure stacking order if needed
                        }}
                    >
                        <Domino
                            domino={domino}
                            size={40}
                            orientation="vertical"
                        />
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    straightContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    curvedContainer: {
        height: 150, // Height to accommodate the arc
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'visible',
    }
});
