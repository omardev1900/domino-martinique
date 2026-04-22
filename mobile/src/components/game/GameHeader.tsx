import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { GameState } from '../../core/types';

export interface GameHeaderProps {
    gameState: GameState | null;
    insets: EdgeInsets;
    onOpenOptions: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
    gameState,
    insets,
    onOpenOptions,
}) => {
    if (!gameState || gameState.phase !== 'PLAYING') return null;

    return (
        <View style={[styles.unifiedHeader, { top: Math.max(insets.top, 10) }]} testID="game-header">

            {/* Badge Objectif */}
            <View style={styles.headerBadge}>
                <Text style={styles.headerText}>
                    {gameState.gameMode === 'VICTOIRE' ? `${gameState.winningCondition} 🏆` :
                     gameState.gameMode === 'MANCHE'   ? `${gameState.winningCondition} Victoires` :
                     gameState.gameMode === 'SCORE'    ? `${gameState.winningCondition} Pts` :
                                                         `${gameState.winningCondition} 🐷`}
                </Text>
            </View>

            {/* Badge Manche / Round */}
            <View style={styles.headerBadge}>
                <Text style={styles.headerText}>
                    M{Math.max(1, gameState.mancheNumber ?? 1)} / R{Math.max(1, gameState.roundNumber ?? 1)}
                </Text>
            </View>

            {/* Bouton unique ⚙️ */}
            <TouchableOpacity
                onPress={onOpenOptions}
                activeOpacity={0.7}
                style={styles.optionsBtn}
                testID="btn-options"
            >
                <Ionicons name="settings-outline" size={22} color="#FFD700" />
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    unifiedHeader: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 100,
        top: 10,
    },
    headerBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    headerText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    optionsBtn: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
});
