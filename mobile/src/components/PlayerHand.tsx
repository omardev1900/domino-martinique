
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Domino, DominoSide } from '../core/types';
import { DominoTile } from './DominoTile';
import { checkValidMove } from '../core/LogicEngine';

interface PlayerHandProps {
    hand: Domino[];
    onPlayDomino: (domino: Domino, position?: { x: number, y: number }) => void;
    disabled?: boolean;
    leftValue?: DominoSide | null;
    rightValue?: DominoSide | null;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    hand,
    onPlayDomino,
    disabled = false,
    leftValue = null,
    rightValue = null,
}) => {
    const tileRefs = React.useRef<{ [key: string]: View | null }>({});

    const handleTilePress = (domino: Domino) => {
        if (disabled) return;

        const ref = tileRefs.current[domino.id];
        if (ref) {
            ref.measure((x, y, width, height, pageX, pageY) => {
                onPlayDomino(domino, { x: pageX, y: pageY });
            });
        } else {
            onPlayDomino(domino);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {hand.map((domino, index) => {
                    const canPlay = !disabled && checkValidMove(domino, leftValue, rightValue).canPlay;
                    return (
                        <Animated.View
                            key={domino.id}
                            ref={(el) => (tileRefs.current[domino.id] = el as any)}
                            style={[
                                styles.tileWrapper,
                                canPlay && { transform: [{ translateY: -20 }], zIndex: 10 }, // Strong Lift for Playable
                                !disabled && !canPlay ? { opacity: 0.6, transform: [{ scale: 0.95 }] } : {} // Dim for Non-Playable
                            ]}
                            layout={LinearTransition.springify()}
                        >
                            <DominoTile
                                left={domino.left}
                                right={domino.right}
                                size={40}
                                orientation="vertical"
                                onPress={() => handleTilePress(domino)}
                                disabled={disabled}
                                isPlayable={canPlay}
                                entering={FadeInDown.delay(index * 10).springify()}
                            />
                        </Animated.View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        height: 120, // Increased to prevent clipping
        justifyContent: 'center',
        overflow: 'visible',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 20,
        gap: 8,
    },
    tileWrapper: {
        // Floating tiles with slight shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});
