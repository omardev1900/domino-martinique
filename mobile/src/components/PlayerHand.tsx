
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
            style={[styles.container]}
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
                        // ✅ FIX B1: Le style d'élévation (translateY) est sur un plain View PARENT.
                        // L'Animated.View enfant gère uniquement l'animation d'entrée (FadeInDown).
                        // Avant ce fix, FadeInDown et translateY étaient sur le même Animated.View :
                        // FadeInDown remettait translateY à 0 pendant son animation, annulant l'élévation.
                        <View
                            key={domino.id}
                            ref={(el) => (tileRefs.current[domino.id] = el as any)}
                            style={
                                canPlay
                                    ? styles.tileElevated
                                    : disabled
                                        ? styles.tileDisabled
                                        // ✅ FIX B2: Pas de transform scale sur les tuiles non-jouables.
                                        // L'ancien scale(0.92) + translateY(-25) sur les tuiles voisines
                                        // créait le visuel "dominos qui se bousculent". Opacity seule = propre.
                                        : styles.tileNotPlayable
                            }
                        >
                            <Animated.View
                                entering={FadeInDown.springify().damping(12).stiffness(100).delay(index * 120)}
                                // 🚨 RADICAL FIX: On retire 'layout' car il cause des mutations sur objets gelés en React 19
                                style={styles.tileWrapper}
                            >
                                <DominoTile
                                    left={domino.left}
                                    right={domino.right}
                                    size={38}
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
        height: 150, // Increased to account for larger domino size
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
        paddingTop: 35, // ++ Increased: make room for elevated domino (-25px) without clipping
        paddingBottom: 10,
        gap: 10, // ++ Slightly more breathing room between tiles
        overflow: 'visible',
    },
    tileWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    // ✅ B1 FIX: styles d'état sur le View parent (plain View, pas Animated.View)
    // pour ne pas interférer avec l'animation entering FadeInDown
    tileElevated: {
        transform: [{ translateY: -25 }],
        zIndex: 10,
        elevation: 15,
    },
    tileDisabled: {
        // Pas mon tour : tuiles visibles sans réduction d'opacité
        zIndex: 1,
        elevation: 3,
    },
    tileNotPlayable: {
        // ✅ A3 FIX: Mon tour, tuile non jouable — aucun grisage (opacity supprimée)
        // Le grisage gênait le joueur dans le choix de son domino (feedback client A3)
        zIndex: 1,
        elevation: 3,
    },
});
