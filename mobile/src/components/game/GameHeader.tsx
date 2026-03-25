import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { GameState } from '../../core/types'; // Assuming standard path

export interface GameHeaderProps {
    gameState: GameState | null;
    insets: EdgeInsets;
    isSoloMode: boolean;
    isPaused: boolean;
    onTogglePause: () => void;
    showRoomInfo: boolean;
    onToggleRoomInfo: () => void;
    isSoundEnabled: boolean;
    onToggleSound: () => void;
    onOpenSettings: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
    gameState,
    insets,
    isSoloMode,
    isPaused,
    onTogglePause,
    showRoomInfo,
    onToggleRoomInfo,
    isSoundEnabled,
    onToggleSound,
    onOpenSettings,
    isFullscreen,
    onToggleFullscreen,
}) => {
    if (!gameState || gameState.phase !== 'PLAYING') {
        return null; // Header is only shown during PLAYING phase
    }

    return (
        <View style={[styles.unifiedHeader, { top: Math.max(insets.top, 10) }]} testID="game-header">

            {/* Block 1: Objectif (Solo Uniquement) */}
            {isSoloMode && (
                <View style={styles.headerBadge}>
                    <Text style={styles.headerText}>
                        {gameState.gameMode === 'VICTOIRE' ? `${gameState.winningCondition} 🏆` :
                            gameState.gameMode === 'MANCHE' ? `${gameState.winningCondition} Victoires` :
                                gameState.gameMode === 'SCORE' ? `${gameState.winningCondition} Pts` :
                                    `${gameState.winningCondition} 🐷`}
                    </Text>
                </View>
            )}

            {/* Block 2: Manche + Round */}
            <View style={styles.headerBadge}>
                <Text style={styles.headerText}>
                    M{Math.max(1, gameState.mancheNumber ?? 1)} / R{Math.max(1, gameState.roundNumber ?? 1)}
                </Text>
            </View>

            {/* Block 3: Controls Icons */}
            <View style={styles.headerControls}>
                {Platform.OS === 'web' && (
                    <TouchableOpacity
                        onPress={onToggleFullscreen}
                        activeOpacity={0.7}
                        style={styles.controlBtn}
                        testID="btn-fullscreen"
                    >
                        <Ionicons
                            name={isFullscreen ? "contract-outline" : "expand-outline"}
                            size={24}
                            color="#FFD700"
                        />
                    </TouchableOpacity>
                )}

                {isSoloMode ? (
                    <TouchableOpacity
                        onPress={onTogglePause}
                        activeOpacity={0.7}
                        style={styles.controlBtn}
                        testID="btn-pause"
                    >
                        <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#FFD700" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={onToggleRoomInfo}
                        activeOpacity={0.7}
                        style={styles.controlBtn}
                        testID="btn-room-info"
                    >
                        <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={onToggleSound}
                    activeOpacity={0.7}
                    style={styles.controlBtn}
                    testID="btn-sound"
                >
                    <Ionicons name={isSoundEnabled ? "volume-high" : "volume-mute"} size={22} color="#FFD700" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onOpenSettings}
                    activeOpacity={0.7}
                    style={styles.controlBtn}
                    testID="btn-settings"
                >
                    <Ionicons name="settings-outline" size={22} color="#FFD700" />
                </TouchableOpacity>
            </View>
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
        top: 10
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
    headerControls: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        alignItems: 'center',
    },
    controlBtn: {
        padding: 5,
    },
});
