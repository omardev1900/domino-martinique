import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { PlayerAvatar } from '../PlayerAvatar';
import { Player, GameState } from '../../core/types';
import { HandSortMode } from '../PlayerHand';

export interface PlayerAreaProps {
    opponents: Player[];
    localPlayer: Player | null;
    gameState: GameState | null;
    localPlayerId: string;
    boudedPlayerId: string | null;
    playersChat: Record<string, string | null>;
    overtime: number | null;
    isBotPlaying: boolean;
    isPaused: boolean;
    insets: EdgeInsets;
    avatarRefs: React.MutableRefObject<Record<string, any>>;
    getPlayerScore: (player: Player) => string;
    skinConfig?: any;
    handSortMode?: HandSortMode;
    isHandSortMenuOpen?: boolean;
    onToggleHandSortMenu?: () => void;
    onSelectHandSortMode?: (mode: HandSortMode) => void;
    isSoloMode?: boolean;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
    opponents,
    localPlayer,
    gameState,
    localPlayerId,
    boudedPlayerId,
    playersChat,
    overtime,
    isBotPlaying,
    isPaused,
    insets,
    avatarRefs,
    getPlayerScore,
    skinConfig,
    handSortMode = 'AUTO',
    isHandSortMenuOpen = false,
    onToggleHandSortMenu,
    onSelectHandSortMode,
    isSoloMode = false,
}) => {
    if (!gameState) return null;

    const isGameOver = ['MATCH_END', 'MANCHE_END', 'PARTIE_END', 'BOUDE'].includes(gameState.phase);
    const isPlaying = gameState.phase === 'PLAYING';

    const getCamionScore = (pId: string) => {
        if (!gameState.mancheHistory) return 0;
        return gameState.mancheHistory.reduce((sum, record) => sum + (record.points[pId] || 0), 0);
    };

    return (
        <View style={styles.uiLayer} pointerEvents={isPaused ? 'none' : 'box-none'} testID="player-area">
            {/* First opponent (Next in turn order) -> Top-Right */}
            {opponents[0] && (
                <View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[opponents[0].id] = el as any;
                        }
                    }}
                    style={[styles.topRightCorner, { top: Math.max(insets.top + 5, 15), right: Math.max(insets.right + 10, 10) }]}
                >
                    <Animated.View
                        entering={FadeInRight.delay(200).duration(600)}
                        testID={`avatar-wrapper-${opponents[0].id}`}
                    >
                        <PlayerAvatar
                            key={`${opponents[0]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[0]}
                            isActive={gameState.currentPlayerId === opponents[0]?.id && isPlaying}
                            showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && isPlaying && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={42}
                            layout="horizontal"
                            score={getPlayerScore(opponents[0])}
                            ptsScore={getCamionScore(opponents[0]?.id)}
                            position="top-right"
                            isBoude={boudedPlayerId === opponents[0]?.id}
                            chatContent={playersChat[opponents[0]?.id]}
                            overtime={gameState.currentPlayerId === opponents[0]?.id ? overtime : null}
                            isBotPlaying={gameState.currentPlayerId === opponents[0]?.id ? isBotPlaying : false}
                            gameMode={gameState.gameMode}
                            showHandDominoes={false}
                            skinConfig={skinConfig}
                            dimmed={isPlaying && gameState.currentPlayerId !== opponents[0]?.id}
                            isSoloMode={isSoloMode}
                        />
                    </Animated.View>
                </View>
            )}

            {/* Second opponent (Last in turn order) -> Top-Left */}
            {opponents[1] && (
                <View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[opponents[1].id] = el as any;
                        }
                    }}
                    style={[styles.topLeftArea, { top: Math.max(insets.top + 5, 15), left: Math.max(insets.left + 10, 10) }]}
                >
                    <Animated.View
                        entering={FadeInLeft.delay(400).duration(600)}
                        testID={`avatar-wrapper-${opponents[1].id}`}
                    >
                        <PlayerAvatar
                            key={`${opponents[1]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1]?.id && isPlaying}
                            showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && isPlaying && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={42}
                            layout="horizontal"
                            score={getPlayerScore(opponents[1])}
                            ptsScore={getCamionScore(opponents[1]?.id)}
                            position="top-left"
                            isBoude={boudedPlayerId === opponents[1]?.id}
                            chatContent={playersChat[opponents[1]?.id]}
                            overtime={gameState.currentPlayerId === opponents[1]?.id ? overtime : null}
                            isBotPlaying={gameState.currentPlayerId === opponents[1]?.id ? isBotPlaying : false}
                            gameMode={gameState.gameMode}
                            showHandDominoes={false}
                            skinConfig={skinConfig}
                            dimmed={isPlaying && gameState.currentPlayerId !== opponents[1]?.id}
                            isSoloMode={isSoloMode}
                        />
                    </Animated.View>
                </View>
            )}

            {/* BOTTOM LEFT: Local Player (Me) */}
            {localPlayer && (
                <View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[localPlayer.id] = el as any;
                        }
                    }}
                    style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}
                >
                    <View style={styles.handSortAnchor}>
                        {isHandSortMenuOpen && (
                            <View style={styles.handSortMenu} testID="hand-sort-menu">
                                {[
                                    { mode: 'AUTO' as const, label: 'Auto' },
                                    { mode: 'DOUBLES' as const, label: 'Doubles' },
                                    { mode: 'SUM' as const, label: 'Somme' },
                                ].map(({ mode, label }) => {
                                    const isActive = handSortMode === mode;
                                    return (
                                        <TouchableOpacity
                                            key={mode}
                                            accessibilityRole="button"
                                            onPress={() => onSelectHandSortMode?.(mode)}
                                            style={[styles.handSortOption, isActive && styles.handSortOptionActive]}
                                            testID={`hand-sort-option-${mode.toLowerCase()}`}
                                        >
                                            <Text style={[styles.handSortOptionText, isActive && styles.handSortOptionTextActive]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={onToggleHandSortMenu}
                            style={styles.handSortTrigger}
                            testID="hand-sort-trigger"
                        >
                            <Text style={styles.handSortTriggerText}>{`Trier${handSortMode ? ` : ${handSortMode === 'AUTO' ? 'Auto' : handSortMode === 'DOUBLES' ? 'Doubles' : 'Somme'}` : ''}`}</Text>
                        </TouchableOpacity>
                    </View>
                    <Animated.View
                        entering={FadeInLeft.delay(600).duration(600)}
                        testID={`avatar-wrapper-${localPlayer.id}`}
                    >
                        <PlayerAvatar
                            player={localPlayer}
                            isActive={gameState.currentPlayerId === localPlayerId && isPlaying}
                            showTimer={gameState.currentPlayerId === localPlayerId && !isGameOver && isPlaying && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={48} // Reduced from 60
                            layout="horizontal"
                            score={getPlayerScore(localPlayer)}
                            ptsScore={getCamionScore(localPlayer.id)}
                            position="bottom"
                            isBoude={boudedPlayerId === localPlayerId}
                            chatContent={playersChat[localPlayerId]}
                            overtime={gameState.currentPlayerId === localPlayerId ? overtime : null}
                            isBotPlaying={gameState.currentPlayerId === localPlayerId ? isBotPlaying : false}
                            gameMode={gameState.gameMode}
                            showHandDominoes={false}
                            skinConfig={skinConfig}
                            dimmed={isPlaying && gameState.currentPlayerId !== localPlayerId}
                            isSoloMode={isSoloMode}
                        />
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    uiLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    topRightCorner: {
        position: 'absolute',
        zIndex: 10,
    },
    topLeftArea: {
        position: 'absolute',
        zIndex: 10,
    },
    bottomLeftArea: {
        position: 'absolute',
        zIndex: 10,
    },
    handSortAnchor: {
        alignItems: 'flex-start',
        marginBottom: 8,
        zIndex: 20,
    },
    handSortTrigger: {
        backgroundColor: 'rgba(17, 9, 4, 0.82)',
        borderColor: 'rgba(243, 229, 200, 0.35)',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    handSortTriggerText: {
        color: '#f3e5c8',
        fontSize: 12,
        fontWeight: '700',
    },
    handSortMenu: {
        backgroundColor: 'rgba(12, 6, 3, 0.94)',
        borderColor: 'rgba(243, 229, 200, 0.25)',
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
        marginBottom: 6,
        padding: 8,
    },
    handSortOption: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    handSortOptionActive: {
        backgroundColor: '#d9b36c',
    },
    handSortOptionText: {
        color: '#f3e5c8',
        fontSize: 12,
        fontWeight: '700',
    },
    handSortOptionTextActive: {
        color: '#2f1706',
    },
});
