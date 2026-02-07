
import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GameState, Domino } from '../core/types';
import { DominoTile } from './DominoTile';

interface GameTableProps {
    gameState: GameState;
}

interface VisualTile {
    domino: Domino;
    isReversed: boolean;
}

export const GameTable: React.FC<GameTableProps> = ({ gameState }) => {
    const { width } = Dimensions.get('window');
    const scale = useSharedValue(1);

    // Dynamic Zoom Logic
    useEffect(() => {
        const tileCount = gameState.table.sequence.length;
        let newScale = 1;

        if (tileCount > 15) {
            newScale = 0.55;
        } else if (tileCount > 12) {
            newScale = 0.65;
        } else if (tileCount > 9) {
            newScale = 0.75;
        } else if (tileCount > 6) {
            newScale = 0.85;
        }

        scale.value = withSpring(newScale, {
            damping: 15,
            stiffness: 100
        });
    }, [gameState.table.sequence.length]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    // Reconstruct visual order from chronological sequence
    const visualSequence = useMemo(() => {
        const list: VisualTile[] = [];
        gameState.table.sequence.forEach((item) => {
            if (list.length === 0) {
                list.push({ domino: item.domino, isReversed: item.isReversed });
                return;
            }

            if (item.sideAtTable === 'left') {
                list.unshift({ domino: item.domino, isReversed: item.isReversed });
            } else {
                list.push({ domino: item.domino, isReversed: item.isReversed });
            }
        });
        return list;
    }, [gameState.table.sequence]);

    return (
        <View style={styles.container}>
            {/* Oval Casino Table */}
            <View style={styles.tableOuter}>
                <View style={styles.tableInner}>
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.scrollContent}
                        showsHorizontalScrollIndicator={false}
                        centerContent={true}
                    >
                        <Animated.View style={[styles.dominosArea, animatedStyle]}>
                            <View style={styles.tileSequence}>
                                {visualSequence.map((item) => {
                                    const isDouble = item.domino.isDouble;
                                    return (
                                        <View key={item.domino.id} style={styles.tileWrapper}>
                                            <DominoTile
                                                left={item.isReversed ? item.domino.right : item.domino.left}
                                                right={item.isReversed ? item.domino.left : item.domino.right}
                                                orientation={isDouble ? 'vertical' : 'horizontal'}
                                                size={32}
                                                disabled
                                                noMargin
                                            />
                                        </View>
                                    );
                                })}
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
        paddingTop: 100, // Increased space for top avatars
        paddingBottom: 140, // Space for hand
    },
    tableOuter: {
        width: '100%',
        maxWidth: 700,
        aspectRatio: 2.2, // Oval shape
        backgroundColor: '#4A2C1B', // Dark wood border
        borderRadius: 200,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    tableInner: {
        flex: 1,
        backgroundColor: '#2D7A4F', // Casino green felt
        borderRadius: 190,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 40,
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
        // Depth effect for dominos on table
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
});
