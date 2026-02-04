import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Domino, Player } from '../core/types';
import { DominoTile } from './DominoTile';

interface PlayerHandProps {
    player: Player;
    onPlayDomino: (domino: Domino) => void;
    disabled?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    player,
    onPlayDomino,
    disabled = false,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.playerName}>{player.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {player.hand.map((domino, index) => (
                    <Animated.View
                        key={domino.id}
                        style={styles.tileWrapper}
                        layout={LinearTransition.springify()} // Smooth reordering when card removed
                    >
                        <DominoTile
                            left={domino.left}
                            right={domino.right}
                            size={36}
                            orientation="vertical"
                            onPress={() => onPlayDomino(domino)}
                            disabled={disabled}
                            entering={FadeInDown.delay(index * 100).springify()} // Staggered dealing
                        />
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    playerName: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 5,
        marginLeft: 10,
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    tileWrapper: {
        marginRight: 10,
    },
});
