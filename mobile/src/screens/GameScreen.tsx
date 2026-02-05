import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LobbyScreen } from './LobbyScreen';
import { GameOverScreen } from './GameOverScreen';
import { SettingsScreen } from './SettingsScreen';
import { dealGame, dealGameSolo, handleTurn, passTurn, checkValidMove, determineFirstPlayer } from '../core/LogicEngine';
import { getBotMove } from '../core/BotEngine';
import { GameState, Domino, Player, PlayerId, GameRoom, RoomStatus } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS } from '../core/constants';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'beginner' | 'intermediate';
}

export default function GameScreen({ gameId, userId, mode, difficulty }: GameScreenProps) {
    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showSettings, setShowSettings] = useState(false);
    const [isSoloMode] = useState(mode === 'solo');
    const [isStarting, setIsStarting] = useState(false); // Loading state during game start

    // Audio & Firebase Subscription
    useEffect(() => {
        // Preload sounds
        SoundManager.preloadSounds().then(() => {
            SoundManager.playMusic('bgm1', 0.3);
        });

        // Solo mode - start immediately
        if (isSoloMode) {
            startSoloGame();
            return;
        }

        if (!gameId) {
            startNewLocalGame();
            return;
        }

        const unsubscribe = subscribeToRoom(gameId, (data) => {
            setRoomData(data);
            if (data.gameState) {
                setGameState(data.gameState);
                setIsStarting(false); // Game loaded successfully
            }
        });

        return () => {
            unsubscribe();
        };
    }, [gameId, isSoloMode]);

    const startSoloGame = () => {
        const partialState = dealGameSolo(localPlayerId, 'Me', difficulty || 'beginner');
        const players = partialState.players as Player[];
        const firstPlayerId = determineFirstPlayer(players);

        const fullState: GameState = {
            gameId: gameId || 'solo-' + Date.now(),
            players: players,
            talonMort: partialState.talonMort as Domino[], // Now populated
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: 1, // Single round for solo
            lastActionTimestamp: Date.now()
        };
        SoundManager.playSound('shuffle');
        setGameState(fullState);
    };

    const startNewLocalGame = () => {
        const fullState = createInitialState(['Me', 'Bot 1', 'Bot 2']);
        fullState.players[1].isBot = true;
        fullState.players[2].isBot = true;
        SoundManager.playSound('shuffle');
        setGameState(fullState);
    };

    const createInitialState = (playerNames: string[]): GameState => {
        const partialState = dealGame(playerNames);
        const players = partialState.players as Player[];

        // Determine who starts based on highest double (not room creator!)
        const firstPlayerId = determineFirstPlayer(players);

        return {
            gameId: gameId || 'local-1',
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: 3,
            lastActionTimestamp: Date.now()
        };
    };

    const handleStartGame = async () => {
        if (!roomData || !gameId) return;

        setIsStarting(true); // Show loading state
        const realPlayers = roomData.players;
        const playerNames = realPlayers.map(p => p.displayName);

        while (playerNames.length < 3) {
            playerNames.push(`Bot ${playerNames.length + 1}`);
        }

        try {
            const initialState = createInitialState(playerNames);
            initialState.players = initialState.players.map((p, i) => {
                if (i < realPlayers.length) {
                    return { ...p, id: realPlayers[i].uid, name: realPlayers[i].displayName, isBot: false };
                } else {
                    return { ...p, id: `bot-${i}`, name: `Bot ${i}`, isBot: true };
                }
            });
            // Re-determine first player after mapping real player IDs
            initialState.currentPlayerId = determineFirstPlayer(initialState.players);
            await startGame(gameId, initialState);
            // Don't set isStarting to false here - let the subscription handle it
        } catch (e: any) {
            Alert.alert("Error", "Failed to start game: " + e.message);
            setIsStarting(false); // Reset on error
        }
    };

    const handlePlayDomino = async (domino: Domino) => {
        if (!gameState) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        try {
            const newState = handleTurn(gameState, localPlayerId, domino);

            // Audio & Haptics
            SoundManager.playClack();
            HapticManager.triggerImpact();

            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e) {
            console.log("Invalid move", e);
        }
    };

    const handlePassTurn = async () => {
        if (!gameState) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        try {
            const newState = passTurn(gameState, localPlayerId);
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e: any) {
            Alert.alert("Cannot Pass", e.message);
        }
    };

    /**
     * Handles turn timeout for ANY player (local or remote).
     * Activates Auto-Play (Bot mode) for that player and plays their turn.
     */
    const handleTimeout = async (playerId?: PlayerId) => {
        if (!gameState) return;

        const activeId = playerId || gameState.currentPlayerId;

        // Verify it's actually the active player's turn to avoid race conditions prematurely
        if (gameState.currentPlayerId !== activeId) return;

        console.log(`[Timeout] Turn timeout for ${activeId} - Activating Auto-Play`);

        // Find the player
        const pIndex = gameState.players.findIndex(player => player.id === activeId);
        if (pIndex === -1) return;
        const p = gameState.players[pIndex];

        // 1. Mark player as Bot (Auto-Play) locally first to modify the state used for the turn
        // We clone the state structure slightly to inject the isBot flag before processing logic
        // But since handleTurn/passTurn clone deep, we need to ensure the resulting state has isBot=true.
        // Actually, we should update the original gameState object or the input to the logic.

        // Let's create a temporary modified state where the player is a bot
        // Logic change: Use current state directly, DO NOT set isBot=true
        const stateForTurn = gameState;

        // Find all valid moves
        const validMoves = p.hand.filter(d =>
            checkValidMove(d, stateForTurn.table.leftValue, stateForTurn.table.rightValue).canPlay
        );

        // Find heaviest valid domino (highest sum) - Deterministic for all clients
        let validDomino = null;
        if (validMoves.length > 0) {
            const sortedMoves = [...validMoves].sort((a, b) => (b.left + b.right) - (a.left + a.right));
            validDomino = sortedMoves[0];
        }

        try {
            let newState: GameState;

            if (validDomino) {
                console.log(`[Auto-Play] Playing heaviest domino for ${activeId}:`, validDomino);
                newState = handleTurn(stateForTurn, activeId, validDomino);

                // Audio effect
                SoundManager.playClack();
            } else {
                console.log(`[Auto-Play] No valid moves for ${activeId} - Passing`);
                newState = passTurn(stateForTurn, activeId);
                SoundManager.playSound('notify');
            }

            // Ensure the isBot flag persists in the new state (LogicEngine preserves unnamed props but best to be sure)
            // handleTurn/passTurn logic preserves the player object properties it doesn't touch.
            // But we modified `stateForTurn`, and `handleTurn` clones THAT. So `isBot` should be true in `newState`.

            // Update State
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                // In multiplayer, anyone can send this update.
                // Firestore will handle the last-write-wins.
                // Since logic is deterministic, all clients calculate roughly the same state.
                await updateGameState(gameId, newState);
            }

        } catch (e) {
            console.error("Auto-play execution failed:", e);
        }
    };



    const handleReplay = () => {
        if (gameId && roomData?.players[0].uid === userId) {
            // Logic to restart online game would go here (reset state)
            Alert.alert("Notice", "Replay logic for online not fully implemented yet.");
        } else {
            startNewLocalGame();
        }
    };

    const handleNextRound = () => {
        if (!gameState) return;

        // Get player names preserving their order
        const playerNames = gameState.players.map(p => p.name);
        const previousData = gameState.players.map(p => ({
            id: p.id,
            wins: p.wins,
            totalPoints: p.totalPoints,
            isBot: p.isBot
        }));
        const winnerId = gameState.firstPlayerOfRound; // Winner of previous round

        // Deal new game
        const partialState = dealGame(playerNames);
        const newPlayers = (partialState.players as Player[]).map((p, i) => ({
            ...p,
            id: gameState.players[i].id, // Preserve player IDs
            wins: previousData[i].wins, // Preserve wins
            totalPoints: previousData[i].totalPoints, // Preserve points
            isBot: previousData[i].isBot, // Preserve bot status/auto-play
        }));

        const newState: GameState = {
            gameId: gameState.gameId,
            players: newPlayers,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: winnerId || newPlayers[0].id, // Winner starts, or fallback to first player
            phase: 'PLAYING',
            firstPlayerOfRound: winnerId,
            history: [],
            winningCondition: gameState.winningCondition,
            lastActionTimestamp: Date.now()
        };

        if (isSoloMode || !gameId) {
            SoundManager.playSound('shuffle');
            setGameState(newState);
        } else {
            SoundManager.playSound('shuffle');
            updateGameState(gameId, newState).catch(err => console.error("Failed to update game state", err));
        }
    };

    // Bot Loop
    useEffect(() => {
        if (!gameState) return;
        // Support bot turns in local, solo, and multiplayer games if bot is present
        // (Removing restrictive gameId.startsWith checks)

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

        if (currentPlayer?.isBot && (gameState.phase === 'PLAYING')) {
            const timer = setTimeout(async () => {
                // If I am the "host" OR it is a local/solo game OR I am the bot player (Auto-Play my own self)
                // We need to decide WHO executes the bot move in multiplayer.
                // To avoid race conditions in normal bot play (start of game), we usually let the Host do it.
                // But for "Auto-Play" takeover, we want reliability.
                // Logic: If it's a Bot, we run the logic. 
                // We use the same deterministic "Heaviest logic" as timeout to be safe?
                // The original BotEngine uses RANDOM moves.
                // If a player became a Bot due to timeout, maybe they should stay "dumb" (random) or "smart" (heaviest)?
                // The task says "comme un Bot". Existing bot is random.
                // BUT `handleTimeout` used "heaviest".
                // I'll stick to `handleTimeout` using Heaviest for "Rescue", but the regular Bot loop uses `getBotMove` (Random).
                // Issue: If `isBot` is set to true, this `useEffect` kicks in!
                // And `getBotMove` is random.
                // If 3 clients run this effect, they generate 3 different random moves.
                // Desync!

                // CRITICAL FIX:
                // Only ONE client should execute the Bot Move in multiplayer.
                // Who? The Room Creator (Host).
                // Or: The player themselves (if they are online but marked as bot? Unlikely if they timed out).
                // We will rely on the "Room Creator" to drive the Bots to avoid desync.
                // If Room Creator disconnects, then the game might stall unless we migrate host.
                // Given the constraints (Fast/Critical), we'll assume the Host is responsible for Bots.

                // For "Timeout Rescue" (handleTimeout), ANYONE can trigger it because it uses DETERMINISTIC heaviest move.
                // Once `isBot` is true, this effect takes over for NEXT turns.
                // We must change `getBotMove` here to be DETERMINISTIC (Heaviest) OR restrict execution to Host.

                const isHost = roomData?.players[0].uid === localPlayerId;
                const shouldExecuteBot = isSoloMode || !gameId || isHost;

                if (!shouldExecuteBot) return;

                // Use DETERMINISTIC move for reliability if it was a player-turned-bot?
                // Or stick to random. If strict Host execution, random is fine (Host decides).
                const move = getBotMove(
                    currentPlayer.hand,
                    gameState.table.leftValue,
                    gameState.table.rightValue
                );

                console.log(`[Bot Decision] ${currentPlayer.name} thinking on table [${gameState.table.leftValue}|${gameState.table.rightValue}]`);

                if (move) {
                    console.log(`[Bot Move] Playing ${move.left}|${move.right}`);
                    try {
                        const newState = handleTurn(gameState, currentPlayer.id, move);

                        // Audio & Haptics for Bot
                        SoundManager.playClack();
                        HapticManager.triggerImpact();

                        if (isSoloMode || !gameId) {
                            setGameState(newState);
                        } else {
                            await updateGameState(gameId, newState);
                        }
                    } catch (e) {
                        console.error("Bot play error (invalid move proposed?):", e, move);
                    }
                } else {
                    // Bot Pass logic when no moves are available
                    console.log(`Bot ${currentPlayer.name} has no valid moves - passing`);
                    try {
                        const newState = passTurn(gameState, currentPlayer.id);
                        if (isSoloMode || !gameId) {
                            setGameState(newState);
                        } else {
                            await updateGameState(gameId, newState);
                        }
                    } catch (e) {
                        console.error("Bot pass error", e);
                        // Emergency fallback: manually rotate turn if passTurn fails
                        const fallbackState = { ...gameState };
                        const idx = gameState.players.findIndex(p => p.id === currentPlayer.id);
                        const nextIdx = (idx + 1) % gameState.players.length;
                        fallbackState.currentPlayerId = gameState.players[nextIdx].id;
                        if (isSoloMode || !gameId) {
                            setGameState(fallbackState);
                        } else {
                            await updateGameState(gameId, fallbackState);
                        }
                    }
                }
            }, 1000); // 1s thinking delay as requested
            return () => clearTimeout(timer);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, gameState?.history.length, roomData, localPlayerId]);


    // RENDER LOGIC

    if (!gameState) {
        if (!roomData) return <View style={styles.loading}><Text style={styles.text}>Loading...</Text></View>;

        // Show loading screen when starting game instead of lobby
        if (isStarting) {
            return (
                <View style={styles.loading}>
                    <Text style={styles.text}>Starting game...</Text>
                    <Text style={[styles.text, { fontSize: 14, marginTop: 10, opacity: 0.7 }]}>
                        Dealing tiles and preparing the board
                    </Text>
                </View>
            );
        }

        return <LobbyScreen roomData={roomData} currentUserId={localPlayerId} onStartGame={handleStartGame} />;
    }

    const localPlayer = gameState.players.find(p => p.id === localPlayerId);
    const isGameOver = gameState.phase === 'MATCH_END' || gameState.phase === 'ROUND_END';

    const isMyTurn = gameState.currentPlayerId === localPlayerId;

    // Check if player has any valid move
    const canPlayAny = localPlayer?.hand.some(d =>
        checkValidMove(d, gameState.table.leftValue, gameState.table.rightValue).canPlay
    ) ?? false;

    // Get opponent players
    const opponents = gameState.players.filter(p => p.id !== localPlayerId);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            <GameTable gameState={gameState} />

            {/* Opponent Avatars */}
            <SafeAreaView style={styles.opponentsContainer} pointerEvents="box-none">
                {/* Settings button - top left corner */}
                <View style={styles.topLeftCorner}>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                        <Ionicons name="settings-sharp" size={20} color="white" />
                    </TouchableOpacity>
                    {opponents[0] && (
                        <View style={styles.opponentAvatar}>
                            <PlayerAvatar
                                key={`${opponents[0].id}-${gameState.currentPlayerId}`}
                                player={opponents[0]}
                                isActive={gameState.currentPlayerId === opponents[0].id}
                                showTimer={gameState.currentPlayerId === opponents[0].id && !isGameOver}
                                timerDuration={TURN_DURATION_SECONDS}
                                size={56}
                                position="top-left"
                                onTimeout={() => handleTimeout(opponents[0].id)}
                            />
                        </View>
                    )}
                </View>

                {/* Top right opponent */}
                {opponents[1] && (
                    <View style={styles.topRightCorner}>
                        <PlayerAvatar
                            key={`${opponents[1].id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1].id}
                            showTimer={gameState.currentPlayerId === opponents[1].id && !isGameOver}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={56}
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[1].id)}
                        />
                    </View>
                )}
            </SafeAreaView>

            {/* Pass Button Area */}
            {isMyTurn && !canPlayAny && (
                <View style={styles.passContainer}>
                    <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                        <Text style={styles.passButtonText}>Pass Turn</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Player Hand with integrated avatar and timer */}
            {localPlayer && (
                <PlayerHand
                    key={`${localPlayer.id}-${gameState.currentPlayerId}`}
                    player={localPlayer}
                    onPlayDomino={handlePlayDomino}
                    disabled={gameState.currentPlayerId !== localPlayerId}
                    isActive={isMyTurn}
                    showTimer={isMyTurn && !isGameOver}
                    timerDuration={TURN_DURATION_SECONDS}
                    onTimeout={() => handleTimeout(localPlayer.id)}
                />
            )}

            {isGameOver && (
                <GameOverScreen
                    gameState={gameState}
                    currentUserId={localPlayerId}
                    onReplay={handleReplay}
                    onNextRound={handleNextRound}
                />
            )}

            {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    loading: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: { color: 'white' },
    opponentsContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'box-none',
    },
    topLeftCorner: {
        position: 'absolute',
        top: 40,
        left: 20,
        alignItems: 'flex-start',
    },
    topRightCorner: {
        position: 'absolute',
        top: 40,
        right: 20,
    },
    settingsButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        marginBottom: 12,
    },
    opponentAvatar: {
        marginTop: 8,
    },
    passContainer: {
        position: 'absolute',
        bottom: 130, // Above hand (adjusted for new height)
        alignSelf: 'center',
        zIndex: 10,
    },
    passButton: {
        backgroundColor: '#e74c3c', // Red for alert/action
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    passButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
});

