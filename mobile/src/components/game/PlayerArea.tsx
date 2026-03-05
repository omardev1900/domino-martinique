import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { PlayerAvatar } from '../PlayerAvatar';
import { Player, GameState } from '../../core/types';

export interface PlayerAreaProps {
    opponents: Player[];
    localPlayer: Player | null;
    gameState: GameState | null;
    localPlayerId: string;
    boudedPlayerId: string | null;
    playersChat: Record<string, { message: string, timestamp: number, emoji?: string }>;
    overtime: number | null;
    isBotPlaying: boolean;
    isPaused: boolean;
    insets: EdgeInsets;
    avatarRefs: React.MutableRefObject<Record<string, any>>;
    getPlayerScore: (player: Player) => string;
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
                <Animated.View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[opponents[0].id] = el as any;
                        }
                    }}
                    entering={FadeInRight.delay(200).duration(600)}
                    style={[styles.topRightCorner, { top: Math.max(insets.top + 5, 15), right: Math.max(insets.right + 10, 10) }]}
                    testID={`avatar-wrapper-${opponents[0].id}`}
                >
                    <PlayerAvatar
                        key={`${opponents[0]?.id}-${gameState.currentPlayerId}`}
                        player={opponents[0]}
                        isActive={gameState.currentPlayerId === opponents[0]?.id && isPlaying}
                        showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && isPlaying && gameState.turnDuration > 0}
                        isPaused={isPaused}
                        timerDuration={gameState.turnDuration}
                        size={52}
                        layout="horizontal"
                        score={getPlayerScore(opponents[0])}
                        ptsScore={getCamionScore(opponents[0]?.id)}
                        position="top-right"
                        isBoude={boudedPlayerId === opponents[0]?.id}
                        chatContent={playersChat[opponents[0]?.id]?.message || playersChat[opponents[0]?.id]?.emoji || null}
                        overtime={gameState.currentPlayerId === opponents[0]?.id ? overtime : null}
                        isBotPlaying={gameState.currentPlayerId === opponents[0]?.id ? isBotPlaying : false}
                        isDisconnected={opponents[0]?.isDisconnected}
                        gameMode={gameState.gameMode}
                    />
                </Animated.View>
            )}

            {/* Second opponent (Last in turn order) -> Top-Left */}
            {opponents[1] && (
                <Animated.View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[opponents[1].id] = el as any;
                        }
                    }}
                    entering={FadeInLeft.delay(400).duration(600)}
                    style={[styles.topLeftArea, { top: Math.max(insets.top + 5, 15), left: Math.max(insets.left + 10, 10) }]}
                    testID={`avatar-wrapper-${opponents[1].id}`}
                >
                    <PlayerAvatar
                        key={`${opponents[1]?.id}-${gameState.currentPlayerId}`}
                        player={opponents[1]}
                        isActive={gameState.currentPlayerId === opponents[1]?.id && isPlaying}
                        showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && isPlaying && gameState.turnDuration > 0}
                        isPaused={isPaused}
                        timerDuration={gameState.turnDuration}
                        size={52}
                        layout="horizontal"
                        score={getPlayerScore(opponents[1])}
                        ptsScore={getCamionScore(opponents[1]?.id)}
                        position="top-left"
                        isBoude={boudedPlayerId === opponents[1]?.id}
                        chatContent={playersChat[opponents[1]?.id]?.message || playersChat[opponents[1]?.id]?.emoji || null}
                        overtime={gameState.currentPlayerId === opponents[1]?.id ? overtime : null}
                        isBotPlaying={gameState.currentPlayerId === opponents[1]?.id ? isBotPlaying : false}
                        isDisconnected={opponents[1]?.isDisconnected}
                        gameMode={gameState.gameMode}
                    />
                </Animated.View>
            )}

            {/* BOTTOM LEFT: Local Player (Me) */}
            {localPlayer && (
                <Animated.View
                    ref={(el) => {
                        if (avatarRefs && avatarRefs.current) {
                            avatarRefs.current[localPlayer.id] = el as any;
                        }
                    }}
                    entering={FadeInLeft.delay(600).duration(600)}
                    style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}
                    testID={`avatar-wrapper-${localPlayer.id}`}
                >
                    <PlayerAvatar
                        player={localPlayer}
                        isActive={gameState.currentPlayerId === localPlayerId && isPlaying}
                        showTimer={gameState.currentPlayerId === localPlayerId && !isGameOver && isPlaying && gameState.turnDuration > 0}
                        isPaused={isPaused}
                        timerDuration={gameState.turnDuration}
                        size={60}
                        layout="horizontal"
                        score={getPlayerScore(localPlayer)}
                        ptsScore={getCamionScore(localPlayer.id)}
                        position="bottom"
                        isBoude={boudedPlayerId === localPlayerId}
                        chatContent={playersChat[localPlayerId]?.message || playersChat[localPlayerId]?.emoji || null}
                        overtime={gameState.currentPlayerId === localPlayerId ? overtime : null}
                        isBotPlaying={gameState.currentPlayerId === localPlayerId ? isBotPlaying : false}
                        isDisconnected={localPlayer.isDisconnected}
                        gameMode={gameState.gameMode}
                    />
                </Animated.View>
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
});
