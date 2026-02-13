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
import { GameAnnouncer } from '../components/GameAnnouncer';
import { BoudeCounting } from '../components/BoudeCounting';

import { GameState, GamePhase, Domino, Player, PlayerId, GameRoom, RoomStatus, GameMode } from '../core/types';
import { subscribeToRoom, updateGameState, leaveRoom, startGame, resetRoomToLobby, voteForRematch, clearRematchVotes } from '../core/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import SoundManager from '../core/audio/SoundManager';
import HapticManager from '../core/audio/HapticManager';
import { TURN_DURATION_SECONDS } from '../core/constants';
import * as Clipboard from 'expo-clipboard';
import SettingsManager from '../core/SettingsManager';
import { TableTheme, TABLE_THEMES } from '../core/themes/tableThemes';
import { authService } from '../core/services/auth.service';
import { AVAILABLE_AVATARS, AvatarId, getAvatarImage } from '../core/avatars';

interface GameScreenProps {
    gameId?: string;
    userId?: string;
    mode?: 'solo' | 'multiplayer';
    difficulty?: 'easy' | 'medium' | 'expert' | 'legend';
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
}

export default function GameScreen({ gameId, userId, mode, difficulty, gameMode, winningCondition, turnDuration }: GameScreenProps) {
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
    const [announcement, setAnnouncement] = useState<{ message: string; subMessage?: string; type: 'COCHON' | 'CHIRE' | 'PARTIE_END' | 'BOUDE' } | null>(null);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [isCountingPoints, setIsCountingPoints] = useState(false);

    // DERIVED STATE - Must be after state hooks but before handlers
    const localPlayer = gameState?.players.find(p => p.id === localPlayerId);
    const isMyTurn = gameState?.currentPlayerId === localPlayerId;
    const isGameOver = gameState?.phase === 'MATCH_END' || gameState?.phase === 'MANCHE_END' || gameState?.phase === 'PARTIE_END' || gameState?.phase === 'BOUDE';
    const showScoreOverlay = isGameOver && showScoreboard;

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
            if (gameState.turnDuration > 0) {
                setTimeLeft(gameState.turnDuration);
            } else {
                setTimeLeft(null);
            }
        } else {
            setTimeLeft(null);
        }

        // Phase Transition Logic for Announcer - SKIP IF COMING FROM BOUDE OR ALREADY SHOWING SCORE
        if (gameState?.phase && ['MANCHE_END', 'MATCH_END', 'PARTIE_END', 'BOUDE'].includes(gameState.phase)) {
            // If we are already showing scoreboard or counting points, don't re-announce
            if (showScoreboard || isCountingPoints) return;

            let message = "";
            let type: any = "PARTIE_END";
            let subMessage = "";

            if (gameState.phase === 'BOUDE') {
                message = "BOUDÉ !";
                type = "BOUDE";
            } else if (gameState.mancheResult === 'CHIRE') {
                message = "CHIRÉ !";
                type = "CHIRE";
                subMessage = "Match Nul - Pas de cochon";
            } else if (gameState.mancheResult === 'COCHON') {
                const winner = gameState.players.find(p => p.wins === Math.max(...gameState.players.map(pl => pl.wins)));
                message = "COCHON !";
                type = "COCHON";
                subMessage = winner ? `${winner.name} l'emporte` : "";
            } else if (gameState.phase === 'PARTIE_END') {
                const winner = gameState.players.find(p => p.id === gameState.firstPlayerOfRound);
                message = "PARTIE TERMINÉE !";
                subMessage = winner ? `${winner.name} gagne` : "";
            } else if (gameState.phase === 'MANCHE_END') {
                message = "MANCHE TERMINÉE !";
            } else if (gameState.phase === 'MATCH_END') {
                message = "MATCH TERMINÉ !";
            }
            if (message) {
                setAnnouncement({ message, subMessage, type });
                setShowScoreboard(false);
            } else {
                setShowScoreboard(true);
            }
        } else {
            setAnnouncement(null);
            setShowScoreboard(false);
        }
    }, [gameState?.currentPlayerId, gameState?.phase, localPlayerId, gameState?.mancheResult, showScoreboard, isCountingPoints]);

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
        const partialState = dealGameSolo(localPlayerId, playerDisplayName, playerAvatarId, difficulty || 'easy');
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
            turnDuration: turnDuration !== undefined ? Number(turnDuration) : TURN_DURATION_SECONDS,
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

    const createInitialState = (playerNames: string[], gMode: GameMode = 'MANCHE', wCond: number = 3, tDur: number = TURN_DURATION_SECONDS): GameState => {
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
            turnDuration: tDur,
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
                roomData.winningCondition || 3,
                roomData.turnDuration || TURN_DURATION_SECONDS
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
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) {
            console.log(`[handlePlayDomino] 🚫 Action bloquée :`, {
                processing: isProcessing.current,
                phase: gameState?.phase,
                paused: isPaused,
                localTurn: gameState?.currentPlayerId === localPlayerId
            });
            return;
        }

        if (gameState.currentPlayerId !== localPlayerId) {
            console.log(`[handlePlayDomino] ⏳ Pas votre tour (Courant: ${gameState.currentPlayerId})`);
            return;
        }

        // Check for possible moves with the new engine
        const validMoves = getValidMoves([domino], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        console.log(`[handlePlayDomino] 🔍 Coup tenté: ${domino.left}-${domino.right}. Coups valides trouvés: ${validMoves.length}`);

        if (validMoves.length === 0) {
            console.log(`[handlePlayDomino] ⛔ Coup invalide pour la table [${gameState.table.leftValue}|${gameState.table.rightValue}]`);
            return;
        }

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
        if (isProcessing.current || !gameState || gameState.phase !== 'PLAYING' || isPaused) {
            console.log("[handlePassTurn] Action blocked by guard");
            return;
        }
        if (!isMyTurn) {
            console.log("[handlePassTurn] Not your turn");
            return;
        }

        isProcessing.current = true;

        // Safety timeout to release processing lock if something hangs
        const lockSafety = setTimeout(() => { isProcessing.current = false; }, 5000);

        // Double check validation client-side to prevent "Cannot Pass" alert loop
        const currentValidMoves = getValidMoves(localPlayer?.hand || [], {
            left: gameState.table.leftValue,
            right: gameState.table.rightValue
        });

        if (currentValidMoves.length > 0) {
            isProcessing.current = false;
            clearTimeout(lockSafety);
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
            clearTimeout(lockSafety);
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
        if (gameState.currentPlayerId !== activeId) {
            console.log(`[Timeout] Ignore: ${activeId} is not current player (${gameState.currentPlayerId})`);
            return;
        }

        isProcessing.current = true;

        console.log(`[Timeout] Turn timeout for ${activeId} - Activating Auto-Play`);

        try {
            // Find the player
            const pIndex = gameState.players.findIndex(player => player.id === activeId);
            if (pIndex === -1) return;
            const p = gameState.players[pIndex];

            // 1. Mark player as Bot (Auto-Play) locally first to modify the state used for the turn
            const stateForTurn = gameState;

            // Find all valid moves
            const validMoves = getValidMoves(p.hand, {
                left: stateForTurn.table.leftValue,
                right: stateForTurn.table.rightValue
            });

            // Find heaviest valid domino (highest sum)
            let validMove = null;
            if (validMoves.length > 0) {
                const sortedMoves = [...validMoves].sort((a, b) => (b.tile.left + b.tile.right) - (a.tile.left + a.tile.right));
                validMove = sortedMoves[0];
            }

            let newState: GameState;
            if (validMove) {
                console.log(`[Auto-Play] Playing heaviest domino for ${activeId}:`, validMove.tile);
                newState = handleTurn(stateForTurn, activeId, validMove.tile, validMove.side === 'start' ? undefined : validMove.side);
                SoundManager.playClack();
            } else {
                console.log(`[Auto-Play] No valid moves for ${activeId} - Passing`);
                newState = passTurn(stateForTurn, activeId);
                SoundManager.playSound('notify');
            }

            // Update State
            if (isSoloMode || !gameId) {
                setGameState(newState);
            } else {
                await updateGameState(gameId, newState);
            }
        } catch (e) {
            console.error("Auto-play processing failed:", e);
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
                    await clearRematchVotes(gameId);
                } catch (e: any) {
                    Alert.alert("Erreur", "Impossible de réinitialiser la salle : " + e.message);
                }
            } else {
                Alert.alert("Attente", "Seul l'hôte peut ramener tout le monde au lobby.");
            }
        } else {
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

        // PRD: Double rule for Match start and EVERY new Manche start
        // Otherwise, winner of previous round starts.
        let winnerId = isMancheEnd ? null : gameState.firstPlayerOfRound;

        // Deal new game
        const partialState = dealGame(playerNames);
        const newPlayers = (partialState.players as Player[]).map((p, i) => {
            // CRITICAL FIX: Always correlate by INDEX i. 
            // In a single Match session, the order of players in the array MUST remain stable.
            const originalPlayer = gameState.players[i];

            return {
                ...p,
                id: originalPlayer.id, // Preserve original unique ID (e.g. 'bot-1' or 'user-uid')
                wins: isMancheEnd ? 0 : originalPlayer.wins,
                isCochon: isMancheEnd ? false : originalPlayer.isCochon,
                mancheWins: originalPlayer.mancheWins,
                totalPoints: originalPlayer.totalPoints,
                totalCochons: originalPlayer.totalCochons,
                isBot: originalPlayer.isBot,
                avatarId: originalPlayer.avatarId
            };
        });

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
            mancheResult: null, // RESET MANCHE RESULT
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
                isSoloMode ? 'expert' : 'medium'
            );

            console.log(`[Bot Decision] ${freshPlayer.name} thinking on table [${freshState.table.leftValue}|${freshState.table.rightValue}]`);

            try {
                let newState: GameState;

                if (decision) {
                    const { tile, side } = decision;
                    console.log(`[Bot Move] Playing ${tile.left}|${tile.right} on ${side}`);
                    newState = handleTurn(freshState, freshPlayer.id, tile, side === 'start' ? undefined : side);
                    SoundManager.playClack();
                    HapticManager.triggerImpact();
                } else {
                    console.log(`[Bot Pass] ${freshPlayer.name} has no valid moves - passing`);
                    newState = passTurn(freshState, freshPlayer.id);

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

                isProcessing.current = false;

            } catch (e: any) {
                console.error("[Bot Error]", e.message);
                isProcessing.current = false;
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [gameState?.currentPlayerId, gameState?.phase, isPaused, isSoloMode, gameId, localPlayerId, roomData]);

    // PHASE 2.2: BOUDE (Game Blocked) Auto-Resolution
    useEffect(() => {
        if (!gameState || gameState.phase !== 'BOUDE' || isCountingPoints) return;

        console.log(`[BOUDE] Game is blocked! Ready for counting.`);
        isProcessing.current = false;
    }, [gameState?.phase]);

    const handleBoudeFinished = async (winnerId: string | 'TIE') => {
        if (!gameState) return;

        // MULTIPLAYER: Only host should write to Firestore to avoid race conditions
        // Non-host players: just dismiss the counting overlay and show scoreboard.
        // Their gameState will update via Firebase subscription when host resolves.
        if (!isSoloMode && gameId) {
            const isHost = roomData?.players[0].uid === userId;
            if (!isHost) {
                console.log('[BOUDE] Non-host: dismissing overlay, waiting for host to resolve via Firebase');
                setShowScoreboard(true);
                setIsCountingPoints(false);
                return;
            }
        }

        const { newState, isTie } = resolveBoude(gameState);

        if (isTie) {
            console.log(`[BOUDE] Tie detected - restarting partie`);
            setIsCountingPoints(false);
            if (isSoloMode) {
                // Restart same round in solo
                const playerNames = gameState.players.map(p => p.name);
                const partial = dealGame(playerNames);
                const resetState = {
                    ...gameState,
                    ...partial,
                    players: (partial.players as Player[]).map((p, i) => ({
                        ...p,
                        id: gameState.players[i].id,
                        mancheWins: gameState.players[i].mancheWins,
                        totalPoints: gameState.players[i].totalPoints,
                        totalCochons: gameState.players[i].totalCochons,
                        isBot: gameState.players[i].isBot,
                        avatarId: gameState.players[i].avatarId
                    })),
                    phase: 'PLAYING' as GamePhase,
                    history: []
                };
                setGameState(resetState as GameState);
            } else if (gameId) {
                // Multiplayer TIE: Deal new cards and restart, same logic as solo
                const playerNames = gameState.players.map(p => p.name);
                const partial = dealGame(playerNames);
                const resetState = {
                    ...gameState,
                    ...partial,
                    players: (partial.players as Player[]).map((p, i) => ({
                        ...p,
                        id: gameState.players[i].id,
                        mancheWins: gameState.players[i].mancheWins,
                        totalPoints: gameState.players[i].totalPoints,
                        totalCochons: gameState.players[i].totalCochons,
                        isBot: gameState.players[i].isBot,
                        avatarId: gameState.players[i].avatarId,
                        wins: gameState.players[i].wins
                    })),
                    phase: 'PLAYING' as GamePhase,
                    history: [],
                    mancheResult: null
                };
                const sanitized = JSON.parse(JSON.stringify(resetState, (k, v) => v === undefined ? null : v));
                await updateGameState(gameId, sanitized);
            }
        } else {
            // Standard winner resolution - Go straight to scoreboard
            // CRITICAL: Set showScoreboard BEFORE clearing isCountingPoints to avoid
            // a render frame where the useEffect re-triggers the announcer
            if (isSoloMode || !gameId) {
                setShowScoreboard(true);
                setIsCountingPoints(false);
                setGameState(newState);
            } else {
                setShowScoreboard(true);
                setIsCountingPoints(false);
                // Sanitize: Replace undefined with null before sending to Firestore
                const sanitized = JSON.parse(JSON.stringify(newState, (k, v) => v === undefined ? null : v));
                await updateGameState(gameId, sanitized);
            }
        }
    };


    // Get opponents in RELATIVE ORDER for Anti-Clockwise visual flow
    // Order: Local (Bottom) -> Next Player (Top-Right) -> Last Player (Top-Left)
    const opponents = useMemo(() => {
        if (!gameState) return [];
        const numPlayers = gameState.players.length;
        const localIdx = gameState.players.findIndex(p => p.id === localPlayerId);
        if (localIdx === -1) return gameState.players.filter(p => p.id !== localPlayerId);

        const ordered = [];
        // First opponent (Next in turn order) -> will be placed Top-Right
        ordered.push(gameState.players[(localIdx + 1) % numPlayers]);
        // Second opponent (Last in turn order) -> will be placed Top-Left
        if (numPlayers > 2) {
            ordered.push(gameState.players[(localIdx + 2) % numPlayers]);
        }
        return ordered;
    }, [gameState?.players, localPlayerId]);

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

    const getPlayerScore = (player: Player) => {
        if (!gameState) return "";
        switch (gameState.gameMode) {
            case 'MANCHE': return `${player.mancheWins} ${player.mancheWins > 1 ? 'Manches' : 'Manche'}`;
            case 'SCORE': return `${player.totalPoints} pts`;
            case 'COCHON': return `${player.totalCochons} 🐷`;
            default: return "";
        }
    };


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
            {/* Dynamic Background based on Theme */}
            <LinearGradient
                colors={[
                    TABLE_THEMES[tableTheme].background,
                    TABLE_THEMES[tableTheme].felt,
                    TABLE_THEMES[tableTheme].background
                ]}
                style={StyleSheet.absoluteFill}
            />

            <StatusBar barStyle="light-content" translucent />


            {/* PAUSE BUTTON - Solo Mode Only */}
            {isSoloMode && gameState && gameState.phase === 'PLAYING' && (
                <TouchableOpacity
                    style={[styles.pauseTopCenterButton, { top: Math.max(insets.top + 10, 20) }]}
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

            {/* ROOM INFO CARD - Floating card with room code + game objective */}
            {!isSoloMode && gameId && showRoomInfo && (
                <>
                    {/* Backdrop - close on tap outside */}
                    <TouchableOpacity
                        style={styles.infoBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowRoomInfo(false)}
                    >
                        <View style={styles.infoCard}>
                            {/* Room Code Row */}
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="game-controller-outline" size={16} color="#FFD700" />
                                <Text style={styles.infoCardTitle}>Salle</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.infoCardCodeRow}
                                onPress={() => {
                                    Clipboard.setStringAsync(gameId);
                                    Alert.alert("✓ Copié", "Code copié dans le presse-papier !");
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.infoCardCode}>{gameId}</Text>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.infoCardDivider} />

                            {/* Game Objective */}
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                                <Text style={styles.infoCardTitle}>Objectif</Text>
                            </View>

                            <View style={styles.infoCardObjective}>
                                <Text style={styles.infoCardObjectiveText}>
                                    {gameState.gameMode === 'MANCHE'
                                        ? `🏆  ${gameState.winningCondition} manche${gameState.winningCondition > 1 ? 's' : ''}`
                                        : gameState.gameMode === 'SCORE'
                                            ? `⭐  ${gameState.winningCondition} points`
                                            : `🐷  ${gameState.winningCondition} cochon${gameState.winningCondition > 1 ? 's' : ''}`
                                    }
                                </Text>
                                <Text style={styles.infoCardModeLabel}>
                                    {gameState.gameMode === 'MANCHE'
                                        ? 'Mode Manche'
                                        : gameState.gameMode === 'SCORE'
                                            ? 'Mode Score'
                                            : 'Mode Cochon'
                                    }
                                </Text>
                            </View>
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
                {/* Opponents Display - ANTI-CLOCKWISE REORGANIZATION */}
                {/* Visual Order: You (Bottom) -> Next Player (Top-Right) -> Last Player (Top-Left) */}
                {opponents[0] && (
                    <Animated.View
                        entering={FadeInRight.delay(200).duration(600)}
                        style={[styles.topRightCorner, { top: Math.max(insets.top + 5, 15), right: Math.max(insets.right + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[0]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[0]}
                            isActive={gameState.currentPlayerId === opponents[0]?.id}
                            showTimer={gameState.currentPlayerId === opponents[0]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[0])}
                            position="top-right"
                            onTimeout={() => handleTimeout(opponents[0]?.id)}
                        />
                    </Animated.View>
                )}

                {opponents[1] && (
                    <Animated.View
                        entering={FadeInLeft.delay(400).duration(600)}
                        style={[styles.topLeftArea, { top: Math.max(insets.top + 5, 15), left: Math.max(insets.left + 10, 10) }]}
                    >
                        <PlayerAvatar
                            key={`${opponents[1]?.id}-${gameState.currentPlayerId}`}
                            player={opponents[1]}
                            isActive={gameState.currentPlayerId === opponents[1]?.id}
                            showTimer={gameState.currentPlayerId === opponents[1]?.id && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
                            size={52}
                            layout="vertical"
                            namePlacement="below"
                            score={getPlayerScore(opponents[1])}
                            position="top-left"
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
                            showTimer={isMyTurn && !isGameOver && gameState.phase === 'PLAYING' && gameState.turnDuration > 0}
                            isPaused={isPaused}
                            timerDuration={gameState.turnDuration}
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
            {!isCountingPoints && (
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
            )}

            {announcement && (
                <GameAnnouncer
                    message={announcement.message}
                    subMessage={announcement.subMessage}
                    type={announcement.type}
                    onFinished={() => {
                        if (announcement.type === 'BOUDE') {
                            setIsCountingPoints(true);
                        } else {
                            setShowScoreboard(true);
                        }
                        setAnnouncement(null);
                    }}
                />
            )}

            {isCountingPoints && gameState && (
                <BoudeCounting
                    players={gameState.players}
                    onFinished={handleBoudeFinished}
                />
            )}

            {showScoreOverlay && (
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
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#FFD700',
        padding: 18,
        width: 280,
        maxWidth: '80%',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 15,
    },
    // Info Card - Header
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    infoCardTitle: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    // Info Card - Code row (tappable to copy)
    infoCardCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.15)',
    },
    infoCardCode: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    // Info Card - Divider
    infoCardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,215,0,0.2)',
        marginBottom: 14,
    },
    // Info Card - Objective
    infoCardObjective: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    infoCardObjectiveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoCardModeLabel: {
        color: 'rgba(255,215,0,0.6)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    pauseTopCenterButton: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,215,0,0.4)',
        zIndex: 500,
    },
});
