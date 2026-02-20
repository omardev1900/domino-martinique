import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, FadeIn, ZoomIn, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState, Domino } from '../core/types';
import { DominoTile } from './DominoTile';
import { Ionicons } from '@expo/vector-icons';
import { TABLE_THEMES, TableTheme } from '../core/themes/tableThemes';
import { getValidMoves, ValidMove } from '../core/DominoEngine';


interface GameTableProps {
    gameState: GameState;
    theme?: TableTheme;
    pendingDomino?: Domino | null; // The domino currently being played
    onSideSelect?: (side: 'left' | 'right') => void;
    hiddenDominoId?: string | null;
}

interface VisualTile {
    domino: Domino;
    isReversed: boolean;
}

export interface GameTableRef {
    measureTile: (id: string, callback: (x: number, y: number, width: number, height: number) => void) => void;
}

/**
 * Composant GameTable : Gère l'affichage du plateau de jeu et des dominos posés.
 */
export const GameTable = React.forwardRef<GameTableRef, GameTableProps>(({
    gameState,
    pendingDomino,
    onSideSelect,
    theme = 'luxury',
    hiddenDominoId
}, ref) => {
    const themeColors = TABLE_THEMES[theme];
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isLandscape = screenWidth > screenHeight;
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    const tileRefs = React.useRef<{ [key: string]: View | null }>({});

    React.useImperativeHandle(ref, () => ({
        measureTile: (id: string, callback: (x: number, y: number, width: number, height: number) => void) => {
            const tileRef = tileRefs.current[id];
            if (tileRef) {
                tileRef.measure((x, y, width, height, pageX, pageY) => {
                    callback(pageX, pageY, width, height);
                });
            }
        },
    }));

    // Filter which arrows should be shown based on actual validity using the new engine
    const showLeftArrow = useMemo(() => {
        if (!pendingDomino || !onSideSelect) return false;
        const validMoves = getValidMoves([pendingDomino], { left: gameState.table.leftValue, right: null });
        return validMoves.some((m: ValidMove) => m.side === 'left' || m.side === 'start');
    }, [pendingDomino, gameState.table.leftValue, onSideSelect]);

    const showRightArrow = useMemo(() => {
        if (!pendingDomino || !onSideSelect) return false;
        const validMoves = getValidMoves([pendingDomino], { left: null, right: gameState.table.rightValue });
        return validMoves.some((m: ValidMove) => m.side === 'right' || m.side === 'start');
    }, [pendingDomino, gameState.table.rightValue, onSideSelect]);


    // Dynamic Zoom Logic
    // Dynamic Zoom Logic - DISABLED for Premium Feel (User Request)
    useEffect(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, []);

    // Pulsing Animation for selection arrows
    useEffect(() => {
        if (pendingDomino) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.3, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                true
            );
        } else {
            pulse.value = 1;
        }
    }, [pendingDomino]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: withTiming(pendingDomino ? 0.6 / pulse.value : 0)
    }));

    const visualSequence = useMemo(() => {
        const list: VisualTile[] = [];
        gameState.table.sequence.forEach((item) => {
            list.push({
                domino: item.domino,
                isReversed: item.isReversed
            });
        });
        return list;
    }, [gameState.table.sequence]);

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            <View style={[styles.tableOuter, { width: '100%', height: '100%', maxWidth: undefined, aspectRatio: undefined, backgroundColor: 'transparent', padding: 0, shadowOpacity: 0, borderWidth: 0 }]}>
                <View style={[styles.tableInner, { borderWidth: 0, borderRadius: 0 }]}>
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.scrollContent}
                        showsHorizontalScrollIndicator={true}
                        persistentScrollbar={true}
                    >
                        <Animated.View style={[styles.dominosArea, animatedStyle]}>
                            <View style={styles.tileSequence}>
                                {/* LEFT ARROW */}
                                {showLeftArrow && (
                                    <TouchableOpacity
                                        style={[styles.sideSelector, { left: -60 }]}
                                        onPress={() => onSideSelect?.('left')}
                                    >
                                        <Animated.View
                                            entering={ZoomIn.duration(300)}
                                            style={styles.sideSelectorInner}
                                        >
                                            <Ionicons name="chevron-back" size={32} color="#FFD700" />
                                            {/* Pulsing Ring */}
                                            <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                                        </Animated.View>
                                    </TouchableOpacity>
                                )}

                                {visualSequence.map((item, idx) => {
                                    const isHidden = item.domino.id === hiddenDominoId;
                                    return (
                                        <View
                                            key={item.domino.id}
                                            ref={(el) => (tileRefs.current[item.domino.id] = el as any)}
                                            style={[styles.tileWrapper, isHidden && { opacity: 0 }]}
                                        >
                                            <DominoTile
                                                left={item.isReversed ? item.domino.right : item.domino.left}
                                                right={item.isReversed ? item.domino.left : item.domino.right}
                                                orientation={item.domino.isDouble ? 'vertical' : 'horizontal'}
                                                size={isLandscape ? 38 : 42} // Slightly larger by default
                                                disabled
                                                noMargin
                                                entering={FadeIn.delay(idx * 50).duration(400)}
                                            />
                                        </View>
                                    );
                                })}

                                {/* RIGHT ARROW */}
                                {showRightArrow && (
                                    <TouchableOpacity
                                        style={[styles.sideSelector, styles.sideSelectorRight]}
                                        onPress={() => onSideSelect?.('right')}
                                    >
                                        <Animated.View
                                            entering={ZoomIn.duration(300)}
                                            style={styles.sideSelectorInner}
                                        >
                                            <Ionicons name="chevron-forward" size={32} color="#FFD700" />
                                            <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
                                        </Animated.View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animated.View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 80,
        paddingBottom: 130,
    },
    containerLandscape: {
        paddingTop: 40,
        paddingBottom: 80,
    },
    tableOuter: {
        width: '100%', // Full Screen Width
        height: '100%', // Full Screen Height
        backgroundColor: 'transparent',
        padding: 0,
        margin: 0,
    },
    tableBorderInner: {
        display: 'none', // Remove visual artifacts
    },
    tableInner: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 100, // Large padding to ensure ends are visible
    },
    dominosArea: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileSequence: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    sideSelector: {
        position: 'absolute',
        top: '50%',
        marginTop: -30,
        zIndex: 500,
        padding: 20, // Increased hit area
    },
    sideSelectorRight: {
        right: -60,
    },
    sideSelectorInner: {
        width: 70, // Slightly larger
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderWidth: 3,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 15,
    },
    pulseRing: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: '#FFD700',
    },
    talonMortContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    talonMortLandscape: {
        top: 15,
        right: 25,
    },
    talonMortText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
