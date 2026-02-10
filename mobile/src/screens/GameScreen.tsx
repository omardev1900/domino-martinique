import React, { useState, useEffect, useRef, useMemo } from 'react';

import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Alert, SafeAreaView, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInLeft, FadeInRight, FadeIn } from 'react-native-reanimated';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { LobbyScreen } from './LobbyScreen';
import { GameOverScreen } from './GameOverScreen';
import { SettingsScreen } from './SettingsScreen';
import { dealGame, dealGameSolo, handleTurn, passTurn, determineFirstPlayer, resolveBoude } from '../core/LogicEngine';
import { getValidMoves } from '../core/DominoEngine';
import { getBotMove } from '../core/BotEngine';

import { GameState, Domino, Player, PlayerId, GameRoom, RoomStatus, GameMode } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame, resetRoomToLobby, voteForRematch, clearRematchVotes } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS } from '../core/constants';
import * as Clipboard from 'expo-clipboard';
import SettingsManager from '../core/SettingsManager';
import { TableTheme } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId, getAvatarImage } from '../core/avatars';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'beginner' | 'intermediate';
    gameMode?: GameMode;
    winningCondition?: number;
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition }: GameScreenProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const [roomData, setRoomData] = useState<GameRoom | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localPlayerId] = useState<PlayerId>(userId || 'p1');
    const [showSettings, setShowSettings] = useState(false);
    const [showRoomInfo, setShowRoomInfo] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSoloMode] = useState(mode === 'solo');
    const [isStarting, setIsStarting] = useState(false); // Loading state during game start
    const [tableTheme, setTableTheme] = useState<TableTheme>('classic');

    // Player profile data for solo mode
    const [playerDisplayName, setPlayerDisplayName] = useState<string>('Moi');
    const [playerAvatarId, setPlayerAvatarId] = useState<string | undefined>('avatar_01');

    // ATOMIC ACTION GUARD - Prevents race conditions
    const isProcessing = useRef(false);

    // Ref for fresh state access in Bot useEffect
    const gameStateRef = useRef<GameState | null>(null);
    const [pendingDomino, setPendingDomino] = useState<Domino | null>(null);

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

    // Load saved table theme and player profile
    // This must complete BEFORE starting the game
    const [profileLoaded, setProfileLoaded] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = SettingsManager.getSettings();
            setTableTheme(settings.tableTheme);

            // Load player profile for solo mode
            if (isSoloMode) {
                try {
                    const profile = await authService.getCurrentUser();
                    if (profile) {
                        setPlayerDisplayName(profile.displayName || 'Moi');
                        // Validate avatar is a valid image avatar
                        const avatar = profile.avatarUrl;
                        if (avatar && AVAILABLE_AVATARS.includes(avatar as AvatarId)) {
                            setPlayerAvatarId(avatar);
                        } else {
                            setPlayerAvatarId('avatar_01');
                        }
                    }
                } catch (error) {
                    console.error('Error loading profile:', error);
                }
            }
            setProfileLoaded(true);
        };
        loadSettings();
    }, [isSoloMode]);

    const animatedBorderStyle = useAnimatedStyle(() => ({
        borderColor: `rgba(255, 215, 0, ${pulseOpacity.value})`,
    }));

    // Timer reset on turn change
    useEffect(() => {
        if (gameState?.phase === 'PLAYING' && gameState?.currentPlayerId === localPlayerId) {
            setTimeLeft(TURN_DURATION_SECONDS);
        } else {
            setTimeLeft(null);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, localPlayerId]);

    // Timer countdown logic
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLAYING' || isPaused || timeLeft === null) {
            return;
        }

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
    }, [gameState?.phase, isPaused, timeLeft === null]);

    // Auto-play or auto-pass when timer expires
    useEffect(() => {
        if (timeLeft !== 0 || isPaused) return;

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

        // STEP A: Check for valid moves
        const validMoves = getValidMoves(freshPlayer.hand, {
            left: freshState.table.leftValue,
            right: freshState.table.rightValue
        });


        if (validMoves.length > 0) {
            // STEP B: Auto-play the first valid domino
            const move = validMoves[0];
            const dominoToPlay = move.tile;
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

        // Solo mode - wait for profile to load first
        if (isSoloMode) {
            if (!profileLoaded) {
                return; // Wait for profile to load
            }
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
            // Sync game state - status null means we return to lobby
            setGameState(data.gameState || null);
            if (data.gameState) {
                setIsStarting(false); // Game loaded successfully
            }
        });

        return () => {
            unsubscribe();
        };
    }, [gameId, isSoloMode, profileLoaded]);

    // Check if player has ANY playable domino (NEW: Before early return for hooks safety)
    const canPlayAny = useMemo(() => {
        if (!gameState) return false;
        const localPlayer = gameState.players.find(p => p.id === localPlayerId);
        if (!localPlayer) return false;
        const moves = getValidMoves(localPlayer.hand, {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });
        return moves.length > 0;
    }, [gameState?.players, gameState?.table.leftValue, gameState?.table.rightValue, localPlayerId]);


    // IN-GAME PROTECTION: Prevent accidental exit
    useEffect(() => {

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
        const partialState = dealGameSolo(localPlayerId, playerDisplayName, playerAvatarId, difficulty || 'beginner');
        const players = partialState.players as Player[];
        const firstPlayerId = determineFirstPlayer(players);

        const fullState: GameState = {
            gameId: gameId || 'solo-' + Date.now(),
            players: players,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: firstPlayerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            winningCondition: winningCondition !== undefined ? Number(winningCondition) : 3,
            gameMode: gameMode || 'MANCHE',
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

    const createInitialState = (playerNames: string[], gMode: GameMode = 'MANCHE', wCond: number = 3): GameState => {
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
            winningCondition: wCond,
            gameMode: gMode,
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
            const initialState = createInitialState(
                playerNames,
                roomData.gameMode || 'MANCHE',
                roomData.winningCondition || 3
            );
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
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        // Check for possible moves with the new engine
        const validMoves = getValidMoves([domino], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (validMoves.length === 0) return;

        // If multiple sides are possible, ask the user (always show if > 1 option)
        if (validMoves.length > 1) {
            SoundManager.playSound('notify'); // Feedback for selection
            setPendingDomino(domino);
            return;
        }

        // Only one possible side
        const move = validMoves[0];
        executeMove(domino, move.side === 'start' ? undefined : move.side);
    };


    const confirmSidePlay = (side: 'left' | 'right') => {
        if (!pendingDomino || !gameState) return;

        // Pass the side constraint to handleTurn logic if we can
        // For now, we manually handle the side in executesMove or just call executeMove
        // Wait, handleTurn doesn't take side. It determines it.
        // I need to update LogicEngine.ts to support forcing a side.

        executeMove(pendingDomino, side);
        setPendingDomino(null);
    };

    const executeMove = async (domino: Domino, forcedSide?: 'left' | 'right') => {
        if (isProcessing.current || !gameState) return;
        isProcessing.current = true;

        try {
            // Updated handleTurn in LogicEngine to accept optional side
            const newState = handleTurn(gameState, localPlayerId, domino, forcedSide);

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
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) return;
        if (gameState.currentPlayerId !== localPlayerId) return;

        isProcessing.current = true;

        // Double check validation client-side to prevent "Cannot Pass" alert loop
        const currentValidMoves = getValidMoves(localPlayer?.hand || [], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (currentValidMoves.length > 0) {
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

        // CRITICAL FIX: Reset pending domino if player was choosing a side but timed out
        setPendingDomino(null);

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
        const validMoves = getValidMoves(p.hand, {
            left: stateForTurn.table.leftValue,
            right: stateForTurn.table.rightValue
        });


        // Find heaviest valid domino (highest sum) - Deterministic for all clients
        let validMove = null;
        if (validMoves.length > 0) {
            const sortedMoves = [...validMoves].sort((a, b) => (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right));
            validMove = sortedMoves[0];
        }


        try {
            let newState: GameState;

            if (validMove) {
                console.log(`[Auto-Play] Playing heaviest domino for ${activeId}:`, validMove.tile);
                newState = handleTurn(stateForTurn, activeId, validMove.tile, validMove.side === 'start' ? undefined : validMove.side);

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



    const handleReplay = async () => {
        if (isSoloMode) {
            navigation.navigate('home' as never);
            return;
        }

        if (gameId && roomData) {
            const isHost = roomData.players[0].uid === userId;
            if (isHost) {
                try {
                    await resetRoomToLobby(gameId);
                    await clearRematchVotes(gameId); // Also clear votes when going back to lobby
                } catch (e: any) {
                    Alert.alert("Erreur", "Impossible de réinitialiser la salle : " + e.message);
                }
            } else {
                Alert.alert("Attente", "Seul l'hôte peut ramener tout le monde au lobby.");
            }
        } else {
            // Local game (not solo mode route, but no gameId)
            startNewLocalGame();
        }
    };

    const handleRestartMatch = () => {
        if (isSoloMode) {
            startSoloGame();
        }
    };

    const handleVoteRematch = async () => {
        if (!gameId) return;
        try {
            await voteForRematch(gameId, localPlayerId);
        } catch (e: any) {
            Alert.alert("Erreur", "Impossible de voter pour la revanche : " + e.message);
        }
    };

    const handleLeaveRoom = async () => {
        if (!gameId) {
            navigation.navigate('home' as never);
            return;
        }

        try {
            await leaveRoom(gameId, localPlayerId);
            navigation.navigate('home' as never);
        } catch (e: any) {
            console.error("Error leaving room", e);
            navigation.navigate('home' as never); // Fallback exit
        }
    };

    const handleNextRound = () => {
        if (!gameState) return;

        const isMancheEnd = gameState.phase === 'MANCHE_END';

        // Get player names preserving their order
        const playerNames = gameState.players.map(p => p.name);
        const previousData = gameState.players.map(p => ({
            id: p.id,
            totalPoints: p.totalPoints,
            mancheWins: p.mancheWins,
            totalCochons: p.totalCochons,
            isBot: p.isBot
        }));

        let winnerId = gameState.firstPlayerOfRound; // Winner of previous round

        // Deal new game
        const partialState = dealGame(playerNames);
        const newPlayers = (partialState.players as Player[]).map((p, i) => ({
            ...p,
            id: gameState.players[i].id, // Preserve player IDs
            wins: isMancheEnd ? 0 : gameState.players[i].wins, // Reset wins if new manche
            mancheWins: previousData[i].mancheWins,
            totalPoints: previousData[i].totalPoints,
            totalCochons: previousData[i].totalCochons,
            isBot: previousData[i].isBot,
        }));

        // If no winner (TIE), determine starter based on highest double in NEW hands
        if (!winnerId) {
            winnerId = determineFirstPlayer(newPlayers);
        }

        const newState: GameState = {
            ...gameState,
            players: newPlayers,
            talonMort: partialState.talonMort as Domino[],
            table: partialState.table!,
            currentPlayerId: winnerId,
            phase: 'PLAYING',
            firstPlayerOfRound: null,
            history: [],
            lastActionTimestamp: Date.now()
        };

        if (isSoloMode || !gameId) {
            SoundManager.playSound('shuffle');
            setGameState(newState);
        } else {
            // Multiplayer: Only host should trigger next round to avoid double state creation
            const isHost = roomData?.players[0].uid === userId;
            if (!isHost) {
                Alert.alert("Attente", "Seul l'hôte peut lancer la manche suivante.");
                return;
            }

            SoundManager.playSound('shuffle');
            updateGameState(gameId, newState).catch(err => console.error("Failed to update game state", err));
        }
    };

    // Rematch logic - HOST ONLY checks votes and triggers restart
    useEffect(() => {
        if (isSoloMode || !gameId || !roomData) return;

        const isHost = roomData.players[0].uid === localPlayerId;
        if (!isHost) return;

        // If no votes yet, ignore
        if (!roomData.rematchVotes || roomData.rematchVotes.length === 0) return;

        const allVoted = roomData.players.every(p => roomData.rematchVotes?.includes(p.uid));

        if (allVoted && roomData.players.length > 0) {
            console.log("🎲 Everyone voted for rematch! Starting new game...");
            const restartGame = async () => {
                try {
                    await clearRematchVotes(gameId);
                    // handleStartGame already shuffles and starts
                    await handleStartGame();
                } catch (e) {
                    console.error("Rematch start error", e);
                }
            };
            restartGame();
        }
    }, [roomData?.rematchVotes, roomData?.players.length, isSoloMode, gameId, localPlayerId]);

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
        const shouldExecuteBot = (isSoloMode || !gameId || isHost) && !isPaused;
        if (!shouldExecuteBot) return;

        console.log(`[Bot Loop] Scheduling Bot turn for ${currentPlayer.name}`);

        const timer = setTimeout(() => {
            // Use FRESH state from ref
            const freshState = gameStateRef.current;

            // CRITICAL: Re-check phase with fresh state
            if (!freshState || freshState.phase !== 'PLAYING' || isPaused) {
                console.log(`[Bot Timer] Game is paused or phase is ${freshState?.phase}, aborting.`);
                return;
            }

            const freshPlayer = freshState.players.find(p => p.id === freshState.currentPlayerId);
            if (!freshPlayer?.isBot) {
                console.log(`[Bot Timer] Current player is not a bot, aborting.`);
                return;
            }

            // Get bot move
            const decision = getBotMove(
                freshPlayer.hand,
                freshState.table.leftValue,
                freshState.table.rightValue,
                isSoloMode ? 'expert' : 'medium' // On peut ajuster ici selon le besoin
            );

            console.log(`[Bot Decision] ${freshPlayer.name} thinking on table [${freshState.table.leftValue}|${freshState.table.rightValue}]`);

            try {
                let newState: GameState;

                if (decision) {
                    const { tile, side } = decision;
                    console.log(`[Bot Move] Playing ${tile.left}|${tile.right} on ${side}`);
                    // Si side est 'start', on laisse forcedSide undefined
                    newState = handleTurn(freshState, freshPlayer.id, tile, side === 'start' ? undefined : side);
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
    }, [gameState?.currentPlayerId, gameState?.phase, roomData, localPlayerId, isSoloMode, gameId, isPaused]);

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

    const isGameOver = gameState.phase === 'MATCH_END' || gameState.phase === 'MANCHE_END' || gameState.phase === 'ROUND_END' || gameState.phase === 'BOUDE';
    const localPlayer = gameState.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState.currentPlayerId === localPlayerId;

    const getPlayerScore = (player: Player) => {
        if (!gameState) return "";
        switch (gameState.gameMode) {
            case 'MANCHE': return `${player.mancheWins} ${player.mancheWins > 1 ? 'Manches' : 'Manche'}`;
            case 'SCORE': return `${player.totalPoints} pts`;
            case 'COCHON': return `${player.totalCochons} 🐷`;
            default: return "";
        }
    };

    // Get opponent players
    const opponents = gameState.players.filter(p => p.id !== localPlayerId);

    return (
        <View style={styles.container}>
            {/* CHOICE BANNER (Overlay) */}
            {pendingDomino && (
                <View style={[
                    styles.choiceBanner,
                    isLandscape ? { top: 15, bottom: undefined } : { bottom: 160 }
                ]} pointerEvents="none">
                    <Animated.View entering={FadeIn.duration(300)}>
                        <Text style={styles.choiceText}>CHOISISSEZ UN CÔTÉ</Text>
                    </Animated.View>
                </View>
            )}
            {/* Purple Gradient Background */}
            <LinearGradient
                colors={['#1a0a2e', '#2d1b4e', '#3a2560']}
                style={StyleSheet.absoluteFill}
            />

            <StatusBar barStyle="light-content" translucent />


            {/* PAUSE BUTTON - Solo Mode Only */}
            {isSoloMode && gameState && gameState.phase === 'PLAYING' && (
                <TouchableOpacity
                    style={[styles.pauseBottomButton, { top: Math.max(insets.top + 10, 20), left: 20 + insets.left }]}
                    onPress={() => setIsPaused(!isPaused)}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isPaused ? "play" : "pause"} size={28} color="#FFD700" />
                </TouchableOpacity>
            )}

            {/* INFO BUTTON - Discreet top-center button */}
            {!isSoloMode && gameId && (
                <TouchableOpacity
                    style={[styles.infoButton, { top: Math.max(insets.top + 10, 20) }]}
                    onPress={() => setShowRoomInfo(!showRoomInfo)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                </TouchableOpacity>
            )}

            {/* ROOM INFO CARD - Floating card with room code */}
            {!isSoloMode && gameId && showRoomInfo && (
                <>
                    {/* Backdrop - close on tap outside */}
                    <TouchableOpacity
                        style={styles.infoBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowRoomInfo(false)}
                    >
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="game-controller-outline" size={20} color="#FFD700" />
                                <Text style={styles.infoCardTitle}>Code de la salle</Text>
                            </View>

                            <View style={styles.infoCardCodeContainer}>
                                <Text style={styles.infoCardCode}>{gameId}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.infoCardCopyButton}
                                onPress={() => {
                                    Clipboard.setStringAsync(gameId);
                                    Alert.alert("✓ Copié", "Code de la table copié dans le presse-papier !");
                                    setShowRoomInfo(false);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="copy-outline" size={18} color="#FFF" />
                                <Text style={styles.infoCardCopyText}>Copier le code</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.infoCardCloseButton}
                                onPress={() => setShowRoomInfo(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.infoCardCloseText}>Fermer</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </>
            )}


            <GameTable
                gameState={gameState}
                theme={tableTheme}
                pendingDomino={pendingDomino}
                onSideSelect={pendingDomino ? confirmSidePlay : undefined}
            />

            {/* UI LAYER */}
            <View style={styles.uiLayer} pointerEvents="box-none">

                {/* Opponents Display - Both Solo and Multiplayer now use same layout for 3 players */}
                {opponents[0] && (
                    <Animated.View
                        entering={FadeInLeft.delay(200).duration(600)}
                        style={[styles.topLeftArea, { top: Math.max(insets.top + 5, 15), left: Math.max(insets.left + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[0]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[0]}
                            isActive={gameState.currentPlayerId === opponents[0]?.id}
                            showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[0])}
                            position="top-left"
                            onTimeout={() => handleTimeout(opponents[0]?.id)}
                        />
                    </Animated.View>
                )}

                {opponents[1] && (
                    <Animated.View
                        entering={FadeInRight.delay(400).duration(600)}
                        style={[styles.topRightCorner, { top: Math.max(insets.top + 5, 15), right: Math.max(insets.right + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[1]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1]?.id}
                            showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[1])}
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[1]?.id)}
                        />
                    </Animated.View>
                )}

                {/* Pass Button Area - HIGH Z-INDEX */}
                {isMyTurn && !canPlayAny && gameState.phase === 'PLAYING' && (
                    <View style={[styles.passContainer, { bottom: 120 + insets.bottom, zIndex: 100 }]}>
                        <TouchableOpacity style={styles.passButton} onPress={handlePassTurn}>
                            <Text style={styles.passButtonText}>Passer son tour</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* BOTTOM LEFT: Local Player (Me) */}
                {localPlayer && (
                    <Animated.View
                        entering={FadeInLeft.delay(600).duration(600)}
                        style={[styles.bottomLeftArea, { bottom: 20 + insets.bottom, left: 20 + insets.left }]}
                    >
                        <PlayerAvatar
                            player={localPlayer}
                            isActive={isMyTurn}
                            showTimer={isMyTurn && !isGameOver && gameState.phase === 'PLAYING'}
                            timerDuration={TURN_DURATION_SECONDS}
                            size={60}
                            layout="horizontal"
                            score={getPlayerScore(localPlayer)}
                            position="bottom"
                            onTimeout={() => handleTimeout(localPlayerId)}
                        />
                    </Animated.View>
                )}
            </View>

            {/* Player Hand - HIGH Z-INDEX */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom, zIndex: 50 }}>
                {localPlayer && (
                    <PlayerHand
                        hand={localPlayer.hand}
                        onPlayDomino={handlePlayDomino}
                        disabled={gameState.currentPlayerId !== localPlayerId || gameState.phase !== 'PLAYING'}
                        leftValue={gameState.table.leftValue as any}
                        rightValue={gameState.table.rightValue as any}
                    />
                )}
            </View>

            {isGameOver && (
                <GameOverScreen
                    gameState={gameState}
                    currentUserId={localPlayerId}
                    onReplay={handleReplay}
                    onNextRound={handleNextRound}
                    onRestartMatch={handleRestartMatch}
                    onVoteRematch={handleVoteRematch}
                    onLeaveRoom={handleLeaveRoom}
                    rematchVotes={roomData?.rematchVotes}
                    isSolo={isSoloMode}
                />
            )}

            {/* PAUSE OVERLAY */}
            {isPaused && (
                <View style={styles.pauseOverlay}>
                    <Animated.View entering={FadeInLeft.duration(300)} style={styles.pauseContent}>
                        <Ionicons name="pause-circle" size={80} color="#FFD700" />
                        <Text style={styles.pauseTitle}>PAUSE</Text>
                        <TouchableOpacity
                            style={styles.resumeButton}
                            onPress={() => setIsPaused(false)}
                        >
                            <Text style={styles.resumeButtonText}>REPRENDRE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quitButton}
                            onPress={() => navigation.navigate('home' as never)}
                        >
                            <Text style={styles.quitButtonText}>QUITTER LA PARTIE</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
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
    pauseBottomButton: {
        position: 'absolute',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    pauseContent: {
        alignItems: 'center',
        backgroundColor: '#1a2a1a',
        padding: 40,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#FFD700',
        width: '80%',
    },
    pauseTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 30,
        letterSpacing: 4,
    },
    resumeButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    resumeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quitButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    quitButtonText: {
        color: '#CCC',
        fontSize: 16,
        fontWeight: '600',
    },
    // Info Button - Discreet top-center button
    infoButton: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 100,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    // Info Card - Floating card backdrop
    infoBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Info Card - Main container
    infoCard: {
        backgroundColor: 'rgba(26, 10, 46, 0.98)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        padding: 24,
        width: 320,
        maxWidth: '85%',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 20,
    },
    // Info Card - Header
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    infoCardTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Info Card - Code container
    infoCardCodeContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    infoCardCode: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 2,
    },
    // Info Card - Copy button
    infoCardCopyButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    infoCardCopyText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Info Card - Close button
    infoCardCloseButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    infoCardCloseText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    choiceBanner: {
        position: 'absolute',
        bottom: 140, // Just above the player hand
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 200,
    },
    choiceText: {
        backgroundColor: 'rgba(255, 215, 0, 0.9)',
        color: '#1a0a2e',
        fontSize: 14,
        fontWeight: '900',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FFF',
        overflow: 'hidden',
        textAlign: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
});
