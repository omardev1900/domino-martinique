
import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, FadeIn, ZoomIn } from 'react-native-reanimated';
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
}

interface VisualTile {
    domino: Domino;
    isReversed: boolean;
}

/**
 * Composant GameTable : Gère l'affichage du plateau de jeu et des dominos posés.
 */
export const GameTable: React.FC<GameTableProps> = ({ gameState, pendingDomino, onSideSelect, theme = 'luxury' }) => {
    const themeColors = TABLE_THEMES[theme];
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isLandscape = screenWidth > screenHeight;
    const scale = useSharedValue(1);

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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const visualSequence = useMemo(() => {
        const list: VisualTile[] = [];
        gameState.table.sequence.forEach((item) => {
            if (list.length === 0) {
                list.push({ domino: item.domino, isReversed: item.isReversed });
                return;
            }
            if (item.sideAtTable === 'left') list.unshift({ domino: item.domino, isReversed: item.isReversed });
            else list.push({ domino: item.domino, isReversed: item.isReversed });
        });
        return list;
    }, [gameState.table.sequence]);

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            <View style={[
                styles.tableOuter,
                { backgroundColor: themeColors.border },
                isLandscape && { aspectRatio: 2.2, width: '90%', maxWidth: 700 }
            ]}>
                <View style={[styles.tableInner, { backgroundColor: themeColors.felt }]}>
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
                                    <TouchableOpacity style={styles.sideSelector} onPress={() => onSideSelect?.('left')}>
                                        <Animated.View entering={ZoomIn.duration(300)} style={styles.sideSelectorInner}>
                                            <Ionicons name="chevron-back" size={28} color="#FFD700" />
                                        </Animated.View>
                                    </TouchableOpacity>
                                )}

                                {visualSequence.map((item) => (
                                    <View key={item.domino.id} style={styles.tileWrapper}>
                                        <DominoTile
                                            left={item.isReversed ? item.domino.right : item.domino.left}
                                            right={item.isReversed ? item.domino.left : item.domino.right}
                                            orientation={item.domino.isDouble ? 'vertical' : 'horizontal'}
                                            size={isLandscape ? 28 : 32}
                                            disabled
                                            noMargin
                                        />
                                    </View>
                                ))}

                                {/* RIGHT ARROW */}
                                {showRightArrow && (
                                    <TouchableOpacity style={styles.sideSelector} onPress={() => onSideSelect?.('right')}>
                                        <Animated.View entering={ZoomIn.duration(300)} style={styles.sideSelectorInner}>
                                            <Ionicons name="chevron-forward" size={28} color="#FFD700" />
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
};

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
        borderRadius: 40,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 25,
        elevation: 20,
    },
    tableInner: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        marginHorizontal: 30, // Increased margin to clear central message
        zIndex: 100,
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
    }
});
