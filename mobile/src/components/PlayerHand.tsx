
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Domino, DominoSide } from '../core/types';
import { DominoTile } from './DominoTile';
import { checkValidMove } from '../core/LogicEngine';
import { SkinConfig } from '../core/store.types';

interface PlayerHandProps {
    hand: Domino[];
    onPlayDomino: (domino: Domino, position?: { x: number, y: number }) => void;
    disabled?: boolean;
    leftValue?: DominoSide | null;
    rightValue?: DominoSide | null;
    isLocked?: boolean;
    forcedPlayableDominoId?: string | null;
    skinConfig?: SkinConfig; // Cosmetic skin configuration
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    hand,
    onPlayDomino,
    disabled = false,
    leftValue = null,
    rightValue = null,
    isLocked = false,
    forcedPlayableDominoId = null,
    skinConfig,
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
        <View
            style={[styles.container, isLocked && { opacity: 0.5 }]}
            pointerEvents={isLocked ? 'none' : 'auto'}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {hand.map((domino, index) => {
                    const canPlayByBoardRule = !disabled && checkValidMove(domino, leftValue, rightValue).canPlay;
                    const canPlay = canPlayByBoardRule && (!forcedPlayableDominoId || domino.id === forcedPlayableDominoId);
                    return (
                        <View
                            key={domino.id}
                            ref={(el) => (tileRefs.current[domino.id] = el as any)}
                        >
                            <Animated.View
                                entering={FadeInDown.springify().damping(12).stiffness(100).delay(index * 120)}
                                // 🚨 RADICAL FIX: On retire 'layout' car il cause des mutations sur objets gelés en React 19
                                style={[
                                    styles.tileWrapper,
                                    canPlay ? { transform: [{ translateY: -25 }], zIndex: 10, elevation: 15 } : { opacity: 0.6, transform: [{ scale: 0.95 }], zIndex: 1, elevation: 5 },
                                ]}
                            >
                                <DominoTile
                                    left={domino.left}
                                    right={domino.right}
                                    size={45}
                                    orientation="vertical"
                                    onPress={() => handleTilePress(domino)}
                                    disabled={!canPlay || disabled}
                                    skinConfig={skinConfig}
                                    isPlayable={canPlay}
                                />
                            </Animated.View>
                        </View>
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
        height: 130, // Increased to account for paddingTop
        justifyContent: 'center',
        overflow: 'visible',
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
        width: '100%',
        overflow: 'visible',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 30, // Make natural room for the elevated domino
        paddingBottom: 10,
        gap: 8,
        overflow: 'visible',
    },
    tileWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
});
