import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Domino, Player } from '../core/types';
import { DominoTile } from './DominoTile';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerHandProps {
    player: Player;
    onPlayDomino: (domino: Domino) => void;
    disabled?: boolean;
    isActive?: boolean;
    showTimer?: boolean;
    timerDuration?: number;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    player,
    onPlayDomino,
    disabled = false,
    isActive = false,
    showTimer = false,
    timerDuration = 20,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.contentRow}>
                {/* Avatar on the left */}
                <View style={styles.avatarContainer}>
                    <PlayerAvatar
                        player={player}
                        isActive={isActive}
                        showTimer={showTimer}
                        timerDuration={timerDuration}
                        size={70}
                        position="bottom"
                    />
                </View>

                {/* Domino tiles */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    style={styles.scrollView}
                >
                    {player.hand.map((domino, index) => (
                        <Animated.View
                            key={domino.id}
                            style={styles.tileWrapper}
                            layout={LinearTransition.springify()}
                        >
                            <DominoTile
                                left={domino.left}
                                right={domino.right}
                                size={44}
                                orientation="vertical"
                                onPress={() => onPlayDomino(domino)}
                                disabled={disabled}
                                entering={FadeInDown.delay(index * 100).springify()}
                            />
                        </Animated.View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.5)', // Single solid background
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 14,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100, // Reduced from 110
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    avatarContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingRight: 10,
    },
    tileWrapper: {
        marginRight: 8,
    },
});
