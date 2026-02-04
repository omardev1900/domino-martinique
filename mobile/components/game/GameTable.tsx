import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GameState, Domino as DominoType } from '../../src/core/types';
import { Domino } from './Domino';

interface GameTableProps {
    gameState: GameState;
}

export const GameTable: React.FC<GameTableProps> = ({ gameState }) => {
    const { table } = gameState;
    const { sequence } = table || { sequence: [] };

    // For a simple first iteration, we render them in a ScrollView row centered.
    // A true "snake" layout would require calculating positions on a 2D grid which is complex.
    // We will start with a linear sequence that is scrollable for MVP.

    return (
        <View style={styles.tableBackground}>
            <ScrollView
                horizontal
                contentContainerStyle={styles.scrollContent}
                showsHorizontalScrollIndicator={false}
            >
                <View style={styles.sequenceContainer}>
                    {sequence.map((item, index) => {
                        const { domino, sideAtTable, isReversed } = item;

                        // Determine orientation.
                        // Usually doubles are placed vertically if the stream is horizontal, 
                        // but standard domino rules vary. Here we'll simplify:
                        // If it's a double, we might want to rotate it or just keep it standard.
                        // Let's assume standard inline placement for now: 
                        // [1|2] - [2|5] - [5|5]
                        // If it's a double, we often place it perpendicular (cross-wise).

                        const isDouble = domino.left === domino.right;
                        const orientation = isDouble ? 'vertical' : 'horizontal';

                        // If the sequence flows horizontally, doubles are vertical.
                        // Non-doubles are horizontal.

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
    );
};

const styles = StyleSheet.create({
    tableBackground: {
        flex: 1,
        backgroundColor: '#35654d', // Felt green or similar table color
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 50,
    },
    sequenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2, // Small gap between dominoes to see them clearly, or 0 if they must touch
    },
    dominoWrapper: {
        // Wrapper to handle spacing or alignment adjustments if needed
        justifyContent: 'center',
        alignItems: 'center',
    }
});
