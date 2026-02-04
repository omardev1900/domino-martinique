import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

    // Reconstruct visual order from chronological sequence
    const visualSequence = useMemo(() => {
        const list: VisualTile[] = [];
        gameState.table.sequence.forEach((item) => {
            // If it's the first one, just add it
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
        <LinearGradient
            colors={['#2d5f2e', '#1a3d1a', '#0d1f0d']}
            style={styles.container}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
        >
            <ScrollView
                horizontal
                contentContainerStyle={styles.scrollContent}
                showsHorizontalScrollIndicator={false}
            >
                <View style={styles.boardArea}>
                    {visualSequence.map((item, index) => (
                        <View key={item.domino.id} style={styles.tileWrapper}>
                            <DominoTile
                                left={item.isReversed ? item.domino.right : item.domino.left}
                                right={item.isReversed ? item.domino.left : item.domino.right}
                                orientation="horizontal"
                                size={32}
                                disabled // Disabled on board
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 130, // Space for PlayerHand at bottom
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingHorizontal: 150,
    },
    boardArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        // Premium felt container
        backgroundColor: 'rgba(15, 60, 15, 0.4)',
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'rgba(255,215,0,0.15)', // Subtle gold accent
        minWidth: 300,
        minHeight: 120, // Reduced from 150
        maxHeight: 140, // Limit height to prevent overlap
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 10,
    },
    tileWrapper: {
        // No margin - dominoes should touch side by side
    },
});
