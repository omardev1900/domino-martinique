
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Domino } from '../core/types';
import { DominoTile } from './DominoTile';

interface PlayerHandProps {
    hand: Domino[];
    onPlayDomino: (domino: Domino) => void;
    disabled?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    hand,
    onPlayDomino,
    disabled = false,
}) => {
    return (
        <View style={styles.container}>
            {/* Floating Dominos - No Background Container */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {hand.map((domino, index) => (
                    <Animated.View
                        key={domino.id}
                        style={styles.tileWrapper}
                        layout={LinearTransition.springify()}
                    >
                        <DominoTile
                            left={domino.left}
                            right={domino.right}
                            size={40} // Slightly larger for better visibility
                            orientation="vertical"
                            onPress={() => onPlayDomino(domino)}
                            disabled={disabled}
                            entering={FadeInDown.delay(index * 10).springify()}
                        />
                    </Animated.View>
                ))}
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
