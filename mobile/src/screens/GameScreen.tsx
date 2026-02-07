import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
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

    const navigation = useNavigation();

    // Timer countdown state
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Pulsing animation for active player border
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedBorderStyle = useAnimatedStyle(() => ({
        borderColor: `rgba(255, 215, 0, ${pulseOpacity.value})`,
    }));

    // Timer countdown logic
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING') {
            setTimeLeft(null);
            return;
        }

        const isMyTurn = gameState.currentPlayerId === localPlayerId;
        if (!isMyTurn) {
            setTimeLeft(null);
            return;
        }

        // Start countdown
        setTimeLeft(TURN_DURATION_SECONDS);

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState?.currentPlayerId, gameState?.phase, localPlayerId]);

    // Auto-play or auto-pass when timer expires
    useEffect(() => {
        if (timeLeft !== 0) return;

        // Use ref to get fresh state
        const freshState = gameStateRef.current;
        if (!freshState) {
            console.log('⏰ Timer expired but no gameState available');
            return;
        }

        if (freshState.currentPlayerId !== localPlayerId) {
            console.log('⏰ Timer expired but not my turn anymore');
            return;
        }

        if (freshState.phase !== 'PLAYING') {
            console.log('⏰ Timer expired but game phase is', freshState.phase);
            return;
        }

        console.log('⏰ Timer expired - checking for valid moves...');

        // CRITICAL: Force release processing lock - timer has absolute priority
        isProcessing.current = false;

        // Find the local player in fresh state
        const freshPlayer = freshState.players.find(p => p.id === localPlayerId);
        if (!freshPlayer) {
            console.error('⏰ Timer expired but player not found in state');
            return;
        }

        // STEP A: Check for valid moves using LogicEngine
        const validMoves = freshPlayer.hand.filter(domino =>
            checkValidMove(domino, freshState.table.leftValue, freshState.table.rightValue).canPlay
        );

        if (validMoves.length > 0) {
            // STEP B: Auto-play the first valid domino
            const dominoToPlay = validMoves[0];
            console.log(`⏰ AUTO-PLAY: Playing ${dominoToPlay.left}|${dominoToPlay.right} automatically`);

            // Call handlePlayDomino as if user clicked
            handlePlayDomino(dominoToPlay);
        } else {
            // STEP C: No valid moves - auto-pass
            console.log('⏰ AUTO-PASS: No valid moves, passing turn automatically');
            handlePassTurn();
        }
    }, [timeLeft]);

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

                // CRITICAL: Release processing lock after bot action
                isProcessing.current = false;

            } catch (e: any) {
                console.error("[Bot Error]", e.message);
                isProcessing.current = false; // Release on error too
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
        if (!roomData) return <View key="loading-no-room" style={styles.loading}><Text style={styles.text}>Loading...</Text></View>;

        // Show loading screen when starting game instead of lobby
        if (isStarting) {
            return (
                <View key="loading-starting" style={styles.loading}>
                    <Text style={styles.text}>Starting game...</Text>
                    <Text style={[styles.text, { fontSize: 14, marginTop: 10, opacity: 0.7 }]}>
                        Dealing tiles and preparing the board
                    </Text>
                </View>
            );
        }

        return <LobbyScreen key="lobby-screen" roomData={roomData} currentUserId={localPlayerId} onStartGame={handleStartGame} />;
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
        .map(p => {
            let name = p.name;
            if (p.isBot) {
                if (name.toLowerCase().includes('easy')) name = 'Easy Bot';
                else if (name.toLowerCase().includes('medium') || name.toLowerCase().includes('intermediate')) name = 'Middle Bot';
            }
            return {
                ...p,
                name: name,
                avatarId: p.isBot ? '🤖' : p.avatarId
            };
        });

    return (
        <View style={styles.container}>
            {/* Purple Gradient Background */}
            <LinearGradient
                colors={['#1a0a2e', '#2d1b4e', '#3a2560']}
                style={StyleSheet.absoluteFill}
            />

            <StatusBar barStyle="light-content" translucent />

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

            {/* UI LAYER */}
            <View style={styles.uiLayer} pointerEvents="box-none">

                {/* TOP RIGHT: Bot Avatar (Casino Style) - ABSOLUTE POSITIONING */}
                {isSoloMode && opponents[0] && (
                    <View style={[styles.botAvatarAbsolute, { top: Math.max(insets.top + 10, 40), right: 20 + insets.right }]}>
                        <Animated.View style={[
                            styles.playerCard,
                            gameState.currentPlayerId === opponents[0].id && animatedBorderStyle
                        ]}>
                            <View style={styles.avatarCircleTop}>
                                <Text style={styles.avatarEmoji}>{opponents[0].avatarId}</Text>
                            </View>
                            <View style={styles.playerInfo}>
                                <Text style={styles.playerNameTop}>{opponents[0].name}</Text>
                                <Text style={styles.playerScore}>{opponents[0].hand.length}/7</Text>
                            </View>
                            {gameState.currentPlayerId === opponents[0].id && (
                                <View style={styles.activeIndicator} />
                            )}
                        </Animated.View>
                    </View>
                )}

                {/* MULTIPLAYER: Opponent A */}
                {!isSoloMode && opponents[0] && (
                    <View style={[styles.topLeftArea, { top: Math.max(insets.top + 60, 90), left: Math.max(insets.left + 20, 20) }]}>
                        <PlayerAvatar
                            key={`${opponents[0].id}-${gameState.currentPlayerId}`}
                            player={opponents[0]}
                            isActive={gameState.currentPlayerId === opponents[0].id}
                            showTimer={gameState.currentPlayerId === opponents[0].id && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={52}
                            layout="horizontal"
                            position="top-left"
                            onTimeout={() => handleTimeout(opponents[0].id)}
                        />
                    </View>
                )}

                {/* MULTIPLAYER: Opponent B */}
                {!isSoloMode && opponents[1] && (
                    <View style={[styles.topRightCorner, { top: Math.max(insets.top + 10, 40), right: Math.max(insets.right + 20, 20) }]}>
                        <PlayerAvatar
                            key={`${opponents[1].id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1].id}
                            showTimer={gameState.currentPlayerId === opponents[1].id && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={52}
                            layout="horizontal"
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[1].id)}
                        />
                    </View>
                )}

                {/* Pass Button Area - HIGH Z-INDEX */}
                {isMyTurn && !canPlayAny && gameState.phase === 'PLAYING' && (
                    <View style={[styles.passContainer, { bottom: 100 + insets.bottom, zIndex: 100 }]}>
                        <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                            <Text style={styles.passButtonText}>Passer son tour</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* BOTTOM LEFT: Local Player (Me) - Casino Style */}
                {localPlayer && (
                    <View style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}>
                        <Animated.View style={[styles.playerCardMe, isMyTurn && animatedBorderStyle]}>
                            <View style={styles.avatarCircleBottom}>
                                <Text style={styles.avatarEmoji}>{localPlayer.avatarId || localPlayer.name[0]}</Text>
                            </View>
                            <View style={styles.playerInfoMe}>
                                <Text style={styles.playerNameMe}>{localPlayer.name}</Text>
                                <Text style={styles.playerScoreMe}>{localPlayer.hand.length}/7</Text>
                            </View>
                            {isMyTurn && (
                                <View style={styles.activeIndicatorMe} />
                            )}
                        </Animated.View>
                    </View>
                )}

                {/* BOTTOM RIGHT: Timer Display - Circular like avatars */}
                {isMyTurn && !isGameOver && gameState.phase === 'PLAYING' && timeLeft !== null && (
                    <View style={[styles.timerContainer, { bottom: 20 + insets.bottom, right: 20 + insets.right }]}>
                        <View style={styles.timerCircle}>
                            <Text style={styles.timerText}>{timeLeft}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Player Hand - HIGH Z-INDEX */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom, zIndex: 50 }}>
                {localPlayer && (
                    <PlayerHand
                        hand={localPlayer.hand}
                        onPlayDomino={handlePlayDomino}
                        disabled={gameState.currentPlayerId !== localPlayerId || gameState.phase !== 'PLAYING'}
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
    topCenterArea: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 10,
    },
    botAvatarAbsolute: {
        position: 'absolute',
        zIndex: 20, // Above table and other elements
    },
    playerCard: {
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 12,
        padding: 10,
    },
    avatarCircleTop: {
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
        marginBottom: 6,
    },
    avatarEmoji: {
        fontSize: 28,
    },
    playerInfo: {
        alignItems: 'center',
    },
    playerNameTop: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    playerScore: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    playerCardMe: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingRight: 15,
        paddingVertical: 5,
        gap: 10,
    },
    avatarCircleBottom: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    playerInfoMe: {
        alignItems: 'flex-start',
    },
    playerNameMe: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    playerScoreMe: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
    },
    activeIndicatorMe: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    timerContainer: {
        position: 'absolute',
        zIndex: 15,
    },
    timerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    timerText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    topLeftArea: {
        position: 'absolute',
    },
    topRightCorner: {
        position: 'absolute',
    },
    bottomLeftArea: {
        position: 'absolute',
        zIndex: 10,
    },
    settingsButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
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
