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
    useEffect(() => {
        const tileCount = gameState.table.sequence.length;
        let newScale = 1;
        if (tileCount > 15) newScale = isLandscape ? 0.45 : 0.55;
        else if (tileCount > 12) newScale = isLandscape ? 0.55 : 0.65;
        else if (tileCount > 9) newScale = isLandscape ? 0.65 : 0.75;
        else if (tileCount > 6) newScale = isLandscape ? 0.75 : 0.85;

        scale.value = withSpring(newScale, { damping: 15, stiffness: 100 });
    }, [gameState.table.sequence.length, isLandscape]);

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
            <View style={[
                styles.tableOuter,
                { backgroundColor: themeColors.border, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
                isLandscape && { aspectRatio: 2.2, width: '90%', maxWidth: 700 }
            ]}>
                {/* 3D Border Effect */}
                <View style={styles.tableBorderInner} />

                <View style={[styles.tableInner, { backgroundColor: themeColors.felt }]}>
                    {/* Felt Texture Gradient */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.1)', 'transparent', 'rgba(0,0,0,0.2)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.scrollContent}
                        showsHorizontalScrollIndicator={false}
                        centerContent={true}
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
                                                size={isLandscape ? 30 : 34}
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
        width: '95%',
        maxWidth: 850,
        aspectRatio: 1.8,
        borderRadius: 50,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.7,
        shadowRadius: 30,
        elevation: 25,
        position: 'relative',
    },
    tableBorderInner: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        margin: 2,
    },
    tableInner: {
        flex: 1,
        borderRadius: 40,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.3)',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 60,
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
