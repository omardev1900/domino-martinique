import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LobbyScreen } from './LobbyScreen';
import { GameOverScreen } from './GameOverScreen';
import { SettingsScreen } from './SettingsScreen';
import { dealGame, dealGameSolo, handleTurn, passTurn, checkValidMove, determineFirstPlayer, resolveBoude } from '../core/LogicEngine';
import { getBotMove } from '../core/BotEngine';
import { GameState, Domino, Player, PlayerId, GameRoom, RoomStatus } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS } from '../core/constants';
import * as Clipboard from 'expo-clipboard';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'beginner' | 'intermediate';
}

export default function GameScreen({ gameId, userId, mode, difficulty }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showSettings, setShowSettings] = useState(false);
    const [isSoloMode] = useState(mode === 'solo');
    const [isStarting, setIsStarting] = useState(false); // Loading state during game start

    // ATOMIC ACTION GUARD - Prevents race conditions
    const isProcessing = useRef(false);

    // Ref for fresh state access in Bot useEffect
    const gameStateRef = useRef<GameState | null>(null);

    const navigation = useNavigation(); // Use navigation for intercepting back

    // Audio & Firebase Subscription
    useEffect(() => {
        // Preload sounds
        SoundManager.preloadSounds().then(() => {
            SoundManager.playMusic('bgm1', 0.3);
        });

        // Solo mode - start immediately and bypass Firebase checks
        if (isSoloMode) {
            setIsStarting(false); // Ensure loading is off
            startSoloGame();
            return;
        }

        if (!gameId) {
            setIsStarting(false);
            startNewLocalGame();
            return;
        }

        // Multiplayer loading...
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

    // IN-GAME PROTECTION: Prevent accidental exit
    React.useEffect(() => {
        if (!gameState && !isStarting) return; // Only protect if in game or starting

        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving
            Alert.alert(
                'Quit Game?',
                'Are you sure you want to leave the game? You will be removed from the room.',
                [
                    { text: "Don't leave", style: 'cancel', onPress: () => { } },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        // If the user confirmed, then we dispatch the action we blocked earlier
                        // This will continue the action that had triggered the removal of the screen
                        onPress: async () => {
                            if (gameId && userId) {
                                try {
                                    await leaveRoom(gameId, userId);
                                } catch (err) {
                                    console.error("Error leaving room on exit", err);
                                }
                            }
                            navigation.dispatch(e.data.action);
                        },
                    },
                ]
            );
        });

        return unsubscribe;
    }, [gameState, isStarting, gameId, userId, navigation]);

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
                    return {
                        ...p,
                        id: realPlayers[i].uid,
                        name: realPlayers[i].displayName,
                        avatarId: realPlayers[i].avatarId, // Emoji or undefined
                        isBot: false
                    };
                } else {
                    return { ...p, id: `bot-${i}`, name: `Bot ${i}`, isBot: true, avatarId: 'bot' }; // Bot avatar?
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
        // ATOMIC GUARD
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING') return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        isProcessing.current = true;

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
        } finally {
            isProcessing.current = false;
        }
    };

    const handlePassTurn = async () => {
        // ATOMIC GUARD
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING') return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        isProcessing.current = true;

        // Double check validation client-side to prevent "Cannot Pass" alert loop if logic engine disagrees
        const currentCanPlay = localPlayer?.hand.some(d =>
            checkValidMove(d, gameState.table.leftValue, gameState.table.rightValue).canPlay
        );

        if (currentCanPlay) {
            isProcessing.current = false; // CRITICAL: Release lock before early return
            Alert.alert("Action impossible", "Vous avez des dominos jouables. Vous ne pouvez pas passer.");
            return;
        }

        try {
            const newState = passTurn(gameState, localPlayerId);
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e: any) {
            console.error("Pass Error", e);
            Alert.alert("Cannot Pass", e.message);
        } finally {
            isProcessing.current = false;
        }
    };

    /**
     * Handles turn timeout for ANY player (local or remote).
     * Activates Auto-Play (Bot mode) for that player and plays their turn.
     */
    const handleTimeout = async (playerId?: PlayerId) => {
        // ATOMIC GUARD - Critical for preventing race conditions
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING') return;

        const activeId = playerId || gameState.currentPlayerId;

        // Verify it's actually the active player's turn
        if (gameState.currentPlayerId !== activeId) return;

        isProcessing.current = true;

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
        } finally {
            isProcessing.current = false;
        }
    };



    const handleReplay = () => {
        // Dans GameOverScreen, ce bouton est 'Back to Lobby' si match terminé
        if (isSoloMode) {
            navigation.navigate('home' as never); // Force return to home/lobby
            return;
        }

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

    // Keep ref in sync with state for Bot useEffect
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Bot Loop - INDUSTRIAL LOGIC VERSION
    useEffect(() => {
        if (!gameState) return;

        // HARD PHASE GUARD - Must be PLAYING to enter
        if (gameState.phase !== 'PLAYING') {
            console.log(`[Bot Loop] Phase is ${gameState.phase}, not executing.`);
            return;
        }

        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

        if (!currentPlayer?.isBot) {
            return; // Not a bot turn
        }

        // Only Host executes bot moves in multiplayer
        const isHost = roomData?.players[0].uid === localPlayerId;
        const shouldExecuteBot = isSoloMode || !gameId || isHost;
        if (!shouldExecuteBot) return;

        console.log(`[Bot Loop] Scheduling Bot turn for ${currentPlayer.name}`);

        const timer = setTimeout(() => {
            // Use FRESH state from ref
            const freshState = gameStateRef.current;

            // CRITICAL: Re-check phase with fresh state
            if (!freshState || freshState.phase !== 'PLAYING') {
                console.log(`[Bot Timer] Fresh state phase is ${freshState?.phase}, aborting.`);
                return;
            }

            const freshPlayer = freshState.players.find(p => p.id === freshState.currentPlayerId);
            if (!freshPlayer?.isBot) {
                console.log(`[Bot Timer] Current player is not a bot, aborting.`);
                return;
            }

            // Get bot move
            const move = getBotMove(
                freshPlayer.hand,
                freshState.table.leftValue,
                freshState.table.rightValue
            );

            console.log(`[Bot Decision] ${freshPlayer.name} thinking on table [${freshState.table.leftValue}|${freshState.table.rightValue}]`);

            try {
                let newState: GameState;

                if (move) {
                    console.log(`[Bot Move] Playing ${move.left}|${move.right}`);
                    newState = handleTurn(freshState, freshPlayer.id, move);
                    SoundManager.playClack();
                    HapticManager.triggerImpact();
                } else {
                    console.log(`[Bot Pass] ${freshPlayer.name} has no valid moves - passing`);
                    newState = passTurn(freshState, freshPlayer.id);

                    // CRITICAL: Check if this pass triggered BOUDE
                    if (newState.phase === 'BOUDE') {
                        console.log(`[Bot Pass] Game is now BOUDE! Stopping bot loop.`);
                    }
                }

                // Update state
                if (isSoloMode || !gameId) {
                    setGameState(newState);
                } else {
                    updateGameState(gameId, newState);
                }

            } catch (e: any) {
                console.error("[Bot Error]", e.message);
            }
        }, 1200); // Slightly longer delay for stability

        return () => {
            console.log(`[Bot Loop] Cleanup - clearing timer`);
            clearTimeout(timer);
        };
    }, [gameState?.currentPlayerId, gameState?.phase, roomData, localPlayerId, isSoloMode, gameId]);

    // BOUDE Resolution Effect - Automatically resolve blocked games
    useEffect(() => {
        if (!gameState || gameState.phase !== 'BOUDE') return;

        console.log(`[BOUDE] Game is blocked! Will resolve in 4 seconds...`);
        isProcessing.current = false; // Release lock to allow UI updates

        const timer = setTimeout(() => {
            const freshState = gameStateRef.current;
            if (!freshState || freshState.phase !== 'BOUDE') return;

            console.log(`[BOUDE] Resolving blocked game...`);

            const { newState, isTie } = resolveBoude(freshState);

            if (isTie) {
                console.log(`[BOUDE] Tie detected - restarting round`);
                // Restart the round for tie
                if (isSoloMode) {
                    startSoloGame();
                } else {
                    // For multiplayer, we would need different logic
                    setGameState(newState);
                }
            } else {
                console.log(`[BOUDE] Winner determined - showing results`);
                if (isSoloMode || !gameId) {
                    setGameState(newState);
                } else {
                    updateGameState(gameId, newState);
                }
            }
        }, 4000);

        return () => clearTimeout(timer);
    }, [gameState?.phase, isSoloMode, gameId]);


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
    const isGameOver = gameState.phase === 'MATCH_END' || gameState.phase === 'ROUND_END' || gameState.phase === 'BOUDE';

    const isMyTurn = gameState.currentPlayerId === localPlayerId;

    // Check if player has any valid move
    const canPlayAny = localPlayer?.hand.some(d =>
        checkValidMove(d, gameState.table.leftValue, gameState.table.rightValue).canPlay
    ) ?? false;

    // Get opponent players and formatting for Bot display
    const opponents = gameState.players
        .filter(p => p.id !== localPlayerId)
        .map(p => ({
            ...p,
            name: p.isBot ? `Bot (${p.name.split(' ')[0]})` : p.name,
            avatarId: p.isBot ? '🤖' : p.avatarId
        }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d1f0d" />

            {/* NEW: Game Header with Room Code */}
            {!isSoloMode && gameId && (
                <View style={[styles.header, { top: Math.max(insets.top, 50) }]}>
                    <Text style={styles.headerTitle}>Room: </Text>
                    <TouchableOpacity
                        onPress={() => {
                            Clipboard.setStringAsync(gameId);
                            Alert.alert("Copié", "Code de la table copié !");
                        }}
                        style={styles.headerCodeButton}
                    >
                        <Text style={styles.headerCode}>{gameId}</Text>
                        <Ionicons name="copy-outline" size={16} color="#FFD700" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            )}

            <GameTable gameState={gameState} />

            {/* Opponent Avatars / Settings Panel */}
            <View style={styles.uiLayer} pointerEvents="box-none">
                {/* Top Left Area */}
                <View style={[styles.topLeftCorner, { top: Math.max(insets.top + 10, 40), left: Math.max(insets.left + 20, 20) }]}>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                        <Ionicons name="settings-sharp" size={20} color="white" />
                    </TouchableOpacity>
                    {opponents[0] && (
                        <View style={styles.opponentAvatar}>
                            <PlayerAvatar
                                key={`${opponents[0].id}-${gameState.currentPlayerId}-${gameState.phase}`}
                                player={opponents[0]}
                                isActive={gameState.currentPlayerId === opponents[0].id}
                                showTimer={gameState.currentPlayerId === opponents[0].id && !isGameOver && gameState.phase === 'PLAYING'}
                                timerDuration={TURN_DURATION_SECONDS}
                                size={52}
                                position="top-left"
                                onTimeout={() => handleTimeout(opponents[0].id)}
                            />
                        </View>
                    )}
                </View>

                {/* Top Right Area */}
                {opponents[1] && (
                    <View style={[styles.topRightCorner, { top: Math.max(insets.top + 10, 40), right: Math.max(insets.right + 20, 20) }]}>
                        <PlayerAvatar
                            key={`${opponents[1].id}-${gameState.currentPlayerId}-${gameState.phase}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1].id}
                            showTimer={gameState.currentPlayerId === opponents[1].id && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={52}
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[1].id)}
                        />
                    </View>
                )}

                {/* Pass Button Area - Floating above hand */}
                {isMyTurn && !canPlayAny && gameState.phase === 'PLAYING' && (
                    <View style={[styles.passContainer, { bottom: 120 + insets.bottom }]}>
                        <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                            <Text style={styles.passButtonText}>Passer son tour</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Player Hand */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom }}>
                {localPlayer && (
                    <PlayerHand
                        key={`${localPlayer.id}-${gameState.currentPlayerId}-${gameState.phase}`}
                        player={localPlayer}
                        onPlayDomino={handlePlayDomino}
                        disabled={gameState.currentPlayerId !== localPlayerId || gameState.phase !== 'PLAYING'}
                        isActive={isMyTurn}
                        showTimer={isMyTurn && !isGameOver && gameState.phase === 'PLAYING'}
                        timerDuration={TURN_DURATION_SECONDS}
                        onTimeout={() => handleTimeout(localPlayer.id)}
                    />
                )}
            </View>

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
    uiLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    topLeftCorner: {
        position: 'absolute',
        alignItems: 'flex-start',
    },
    topRightCorner: {
        position: 'absolute',
    },
    settingsButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        marginBottom: 8,
    },
    opponentAvatar: {
        marginTop: 0,
    },
    passContainer: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 10,
    },
    passButton: {
        backgroundColor: '#c0392b',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    passButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    header: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    headerCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCode: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});
