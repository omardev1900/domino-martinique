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

    const handleTimeout = async (playerId?: PlayerId) => {
        if (!gameState) return;

        const activeId = playerId || gameState.currentPlayerId;

        // Safety: only handle timeout if it is actually that player's turn
        if (gameState.currentPlayerId !== activeId) return;

        console.log(`Turn timeout for ${activeId} - checking for valid moves`);

        const p = gameState.players.find(player => player.id === activeId);
        if (!p) return;

        // Find all valid moves
        const validMoves = p.hand.filter(d =>
            checkValidMove(d, gameState.table.leftValue, gameState.table.rightValue).canPlay
        );

        // Find heaviest valid domino (highest sum)
        let validDomino = null;
        if (validMoves.length > 0) {
            const sortedMoves = [...validMoves].sort((a, b) => (b.left + b.right) - (a.left + a.right));
            validDomino = sortedMoves[0];
        }

        if (validDomino) {
            console.log(`Auto-playing domino for ${activeId}:`, validDomino);
            try {
                if (p.isBot || isSoloMode) {
                    const newState = handleTurn(gameState, activeId, validDomino);

                    // Audio & Haptics for auto-play
                    SoundManager.playClack();
                    HapticManager.triggerImpact();

                    setGameState(newState);
                } else if (gameId) {
                    await handlePlayDomino(validDomino);
                } else {
                    await handlePlayDomino(validDomino); // handlePlayDomino handles local state
                }
            } catch (e) {
                console.error("Auto-play failed:", e);
            }
        } else {
            console.log(`No valid moves for ${activeId} - auto-passing`);
            try {
                if (p.isBot || isSoloMode) {
                    const newState = passTurn(gameState, activeId);
                    SoundManager.playSound('notify');
                    setGameState(newState);
                } else if (gameId) {
                    await handlePassTurn();
                } else {
                    await handlePassTurn(); // handlePassTurn handles local state
                }
            } catch (e) {
                console.error("Auto-pass failed:", e);
            }
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
            isBot: previousData[i].isBot, // Preserve bot status
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

                        setGameState(newState);
                    } catch (e) {
                        console.error("Bot play error (invalid move proposed?):", e, move);
                    }
                } else {
                    // Bot Pass logic when no moves are available
                    console.log(`Bot ${currentPlayer.name} has no valid moves - passing`);
                    try {
                        const newState = passTurn(gameState, currentPlayer.id);
                        setGameState(newState);
                    } catch (e) {
                        console.error("Bot pass error", e);
                        // Emergency fallback: manually rotate turn if passTurn fails
                        const fallbackState = { ...gameState };
                        const idx = gameState.players.findIndex(p => p.id === currentPlayer.id);
                        const nextIdx = (idx + 1) % gameState.players.length;
                        fallbackState.currentPlayerId = gameState.players[nextIdx].id;
                        setGameState(fallbackState);
                    }
                }
            }, 1000); // 1s thinking delay as requested
            return () => clearTimeout(timer);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, gameState?.history.length]);


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
                                player={opponents[0]}
                                isActive={gameState.currentPlayerId === opponents[0].id}
                                showTimer={gameState.currentPlayerId === opponents[0].id && !isGameOver}
                                timerDuration={20}
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
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1].id}
                            showTimer={gameState.currentPlayerId === opponents[1].id && !isGameOver}
                            timerDuration={20}
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
                    player={localPlayer}
                    onPlayDomino={handlePlayDomino}
                    disabled={gameState.currentPlayerId !== localPlayerId}
                    isActive={isMyTurn}
                    showTimer={isMyTurn && !isGameOver}
                    timerDuration={20}
                    onTimeout={handleTimeout}
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
