import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GameState, Domino as DominoType } from '../../src/core/types';
import { Domino } from './Domino';
import { TABLE_THEMES, TableTheme } from '../../src/core/themes/tableThemes';

interface GameTableProps {
    gameState: GameState;
    theme?: TableTheme; // Optional theme prop
}

export const GameTable: React.FC<GameTableProps> = ({ gameState, theme = 'classic' }) => {
    const { table } = gameState;
    const { sequence } = table || { sequence: [] };

    const themeColors = TABLE_THEMES[theme];

    // Build the ordered sequence for display
    // Dominoes played on 'left' go to the beginning, 'right' go to the end
    // We need to reconstruct the visual order from the play history
    const orderedSequence = useMemo(() => {
        if (sequence.length === 0) return [];

        // Start with empty arrays for left and right sides
        const leftSide: typeof sequence = [];
        const rightSide: typeof sequence = [];

        sequence.forEach((item, index) => {
            if (index === 0) {
                // First domino is the center reference
                rightSide.push(item);
            } else if (item.sideAtTable === 'left') {
                // Dominos played on the left go to leftSide (will be reversed for display)
                leftSide.unshift(item);
            } else {
                // Dominos played on the right go to rightSide
                rightSide.push(item);
            }
        });

        // Final order: leftSide (already in correct visual order) + rightSide
        return [...leftSide, ...rightSide];
    }, [sequence]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={[styles.tableBackground, { backgroundColor: themeColors.felt, borderColor: themeColors.border }]}>
                <ScrollView
                    horizontal
                    contentContainerStyle={styles.scrollContent}
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.sequenceContainer}>
                        {orderedSequence.map((item, index) => {
                            const { domino, isReversed } = item;

                            const isDouble = domino.left === domino.right;
                            const orientation = isDouble ? 'vertical' : 'horizontal';

                            return (
                                <View key={`${domino.id}-${index}`} style={styles.dominoWrapper}>
                                    <Domino
                                        domino={domino}
                                        size={36}
                                        orientation={orientation}
                                        isReversed={isReversed}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8,
    },
    tableBackground: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 50,
    },
    sequenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0, // No gap - dominoes touch each other
    },
    dominoWrapper: {
        // Wrapper to handle spacing or alignment adjustments if needed
        justifyContent: 'center',
        alignItems: 'center',
    }
});
